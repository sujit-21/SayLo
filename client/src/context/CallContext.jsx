import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
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

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const durationTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Clean up WebRTC peer connection
  const cleanupCall = () => {
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
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
    if (!socket || !caller || !incomingOffer) return;

    try {
      setCallState('connected');
      startTimer();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
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

  // Screen sharing
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          // Revert to camera if available
          if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (camTrack && videoSender) {
              videoSender.replaceTrack(camTrack);
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
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender && camTrack) {
          videoSender.replaceTrack(camTrack);
        }
      }
      setIsScreenSharing(false);
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

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ice_candidate', handleIceCandidate);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ice_candidate', handleIceCandidate);
      socket.off('call:ended', handleCallEnded);
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
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);

