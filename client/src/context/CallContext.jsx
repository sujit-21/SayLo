import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { sound } from '../utils/sound';
import api from '../services/api';

const CallContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'incoming', 'connected'
  const [caller, setCaller] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [callType, setCallType] = useState('audio'); // 'audio', 'video'
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isLowDataMode, setIsLowDataMode] = useState(() => {
    return localStorage.getItem('saylo_low_data_calls') === 'true';
  });

  useEffect(() => {
    const handleLowDataChange = (e) => {
      setIsLowDataMode(Boolean(e.detail?.lowData));
    };
    window.addEventListener('saylo_low_data_changed', handleLowDataChange);
    return () => window.removeEventListener('saylo_low_data_changed', handleLowDataChange);
  }, []);

  const getMediaConstraints = (type) => {
    const lowData = localStorage.getItem('saylo_low_data_calls') === 'true';
    return {
      audio: lowData
        ? { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
        : true,
      video:
        type === 'video'
          ? lowData
            ? { width: { max: 640, ideal: 480 }, height: { max: 360, ideal: 270 }, frameRate: { max: 15 } }
            : true
          : false,
    };
  };

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const durationTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Clean up WebRTC peer connection
  const cleanupCall = () => {
    sound.stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    setCallState('idle');
    setCaller(null);
    setTargetUser(null);
    setIncomingOffer(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallDuration(0);
  };

  // Start call duration timer
  const startTimer = () => {
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Setup PeerConnection
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice_candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Attach local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  // Initiate call
  const startCall = async (receiver, type = 'audio', conversationId = null) => {
    if (!socket || !receiver) return;

    try {
      setCallType(type);
      setTargetUser(receiver);
      setCallState('calling');

      const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(type));
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(receiver._id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', {
        receiverId: receiver._id,
        conversationId,
        callType: type,
        offer,
      });
    } catch (err) {
      console.error('Failed to access media devices or start call', err);
      cleanupCall();
      alert('Unable to access microphone or camera. Please check browser permissions.');
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    sound.stopRingtone();
    if (!socket || !caller || !incomingOffer) return;

    try {
      setCallState('connected');
      startTimer();

      const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(callType));
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(caller._id);
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:accept', {
        callerId: caller._id,
        answer,
      });
    } catch (err) {
      console.error('Failed to accept call', err);
      rejectCall();
    }
  };

  // Reject call
  const rejectCall = () => {
    if (socket && caller) {
      socket.emit('call:reject', { callerId: caller._id });
      api.post('/calls', {
        receiverId: user._id,
        type: callType,
        status: 'rejected',
        duration: 0,
      }).catch(console.error);
    }
    cleanupCall();
  };

  // End active call
  const endCall = () => {
    const peerId = targetUser?._id || caller?._id;
    if (socket && peerId) {
      socket.emit('call:end', { targetUserId: peerId });
    }
    if (callDuration > 0) {
      api.post('/calls', {
        receiverId: peerId,
        type: callType,
        status: 'completed',
        duration: callDuration,
      }).catch(console.error);
    }
    cleanupCall();
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsCameraOff(!track.enabled);
      });
    }
  };

  // Screen sharing with WhatsApp 2024 System / Device Audio
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const screenAudioTrack = screenStream.getAudioTracks()[0];

        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');

        if (videoSender && screenTrack) {
          videoSender.replaceTrack(screenTrack);
        }
        if (audioSender && screenAudioTrack) {
          audioSender.replaceTrack(screenAudioTrack);
        }

        screenTrack.onended = () => {
          // Revert to camera & mic if available
          if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            const micTrack = localStreamRef.current.getAudioTracks()[0];
            if (camTrack && videoSender) {
              videoSender.replaceTrack(camTrack);
            }
            if (micTrack && audioSender) {
              audioSender.replaceTrack(micTrack);
            }
          }
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen sharing error', err);
      }
    } else {
      if (localStreamRef.current) {
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        const micTrack = localStreamRef.current.getAudioTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');
        if (videoSender && camTrack) {
          videoSender.replaceTrack(camTrack);
        }
        if (audioSender && micTrack) {
          audioSender.replaceTrack(micTrack);
        }
      }
      setIsScreenSharing(false);
    }
  };

  // Seamless Voice to Video Switch
  const switchToVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: getMediaConstraints('video').video,
      });
      const videoTrack = stream.getVideoTracks()[0];

      if (localStreamRef.current) {
        localStreamRef.current.addTrack(videoTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        } else {
          peerConnectionRef.current.addTrack(videoTrack, localStreamRef.current);
        }
      }

      setCallType('video');
      setIsCameraOff(false);

      const peerId = targetUser?._id || caller?._id;
      if (socket && peerId) {
        socket.emit('call:switch_video', { targetUserId: peerId });
      }
    } catch (err) {
      console.error('Failed to switch to video', err);
      alert('Could not access camera to switch to video.');
    }
  };

  // Socket listeners for signaling
  useEffect(() => {
    if (!socket) return;

    // Incoming Call
    const handleIncomingCall = ({ caller, callType, offer }) => {
      setCaller(caller);
      setCallType(callType);
      setIncomingOffer(offer);
      setCallState('incoming');
      sound.startRingtone();
    };

    // Call Accepted
    const handleCallAccepted = async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState('connected');
        startTimer();
      }
    };

    // Call Rejected
    const handleCallRejected = () => {
      alert('Call was declined');
      cleanupCall();
    };

    // ICE Candidate received
    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    // Call Ended
    const handleCallEnded = () => {
      cleanupCall();
    };

    // Remote switched to video
    const handleSwitchVideo = () => {
      setCallType('video');
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ice_candidate', handleIceCandidate);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:switch_video', handleSwitchVideo);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ice_candidate', handleIceCandidate);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:switch_video', handleSwitchVideo);
    };
  }, [socket]);

  return (
    <CallContext.Provider
      value={{
        callState,
        caller,
        targetUser,
        callType,
        callDuration,
        isMuted,
        isCameraOff,
        isScreenSharing,
        isLowDataMode,
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        switchToVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);

