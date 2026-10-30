import React from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ScreenShare, Volume2 } from 'lucide-react';
import Avatar from '../common/Avatar';

const CallOverlay = () => {
  const {
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
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    switchToVideo,
  } = useCall();

  if (callState === 'idle') return null;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // 1. INCOMING CALL MODAL
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
        <div className="bg-[#1f2c34] border border-gray-700 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full animate-ping bg-saylo-emerald/30 scale-125"></div>
            <Avatar src={caller?.avatar} name={caller?.name || 'Caller'} size="2xl" />
          </div>

          <h3 className="text-xl font-bold text-white mb-1">{caller?.name || 'Incoming Call'}</h3>
          <p className="text-saylo-emerald font-medium text-sm mb-8 flex items-center gap-1.5">
            <Volume2 size={16} className="animate-pulse" />
            Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...
          </p>

          <div className="flex items-center justify-center gap-12 w-full">
            {/* Reject */}
            <button
              onClick={rejectCall}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-transform transform group-hover:scale-110">
                <PhoneOff size={24} />
              </div>
              <span className="text-xs text-gray-300">Decline</span>
            </button>

            {/* Accept */}
            <button
              onClick={acceptCall}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-saylo-emerald hover:bg-saylo-600 flex items-center justify-center text-white shadow-lg transition-transform transform group-hover:scale-110">
                <Phone size={24} />
              </div>
              <span className="text-xs text-gray-300">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. CALLING / CONNECTED MODAL
  const activeUser = targetUser || caller;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-4xl h-[85vh] bg-[#111b21] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
        {/* Top bar info */}
        <div className="absolute top-4 left-6 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <Avatar src={activeUser?.avatar} name={activeUser?.name || 'User'} size="sm" />
          <div>
            <h4 className="text-sm font-semibold text-white leading-tight">{activeUser?.name}</h4>
            <p className="text-xs text-saylo-400 font-mono">
              {callState === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>
        </div>

        {/* Video / Audio Stage */}
        <div className="flex-1 relative bg-[#0b141a] flex items-center justify-center overflow-hidden">
          {callType === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Local Video PiP */}
              <div className="absolute bottom-24 right-6 w-48 h-36 bg-black rounded-2xl overflow-hidden border-2 border-saylo-emerald shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-6">
                {callState === 'connected' && (
                  <div className="absolute inset-0 rounded-full animate-pulse bg-saylo-emerald/20 scale-150"></div>
                )}
                <Avatar src={activeUser?.avatar} name={activeUser?.name || 'User'} size="2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{activeUser?.name}</h3>
              <p className="text-saylo-emerald text-sm font-mono tracking-wider">
                {callState === 'calling' ? 'Calling...' : `Connected (${formatDuration(callDuration)})`}
              </p>
            </div>
          )}
        </div>

        {/* Call Controls Toolbar */}
        <div className="h-20 bg-[#202c33] border-t border-gray-800 flex items-center justify-center gap-6 px-6 z-20">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-gray-700/60 hover:bg-gray-700 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Switch to Video (when on voice call) */}
          {callType === 'audio' && callState === 'connected' && (
            <button
              onClick={switchToVideo}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-gray-700/60 hover:bg-saylo-emerald hover:text-white text-gray-200"
              title="Switch to Video Call"
            >
              <Video size={20} />
            </button>
          )}

          {/* Toggle Camera */}
          {callType === 'video' && (
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isCameraOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-gray-700/60 hover:bg-gray-700 text-white'
              }`}
              title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}

          {/* Screen Share */}
          {callType === 'video' && (
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isScreenSharing ? 'bg-saylo-emerald text-white' : 'bg-gray-700/60 hover:bg-gray-700 text-white'
              }`}
              title="Share Screen"
            >
              <ScreenShare size={20} />
            </button>
          )}

          {/* Hang Up */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;

