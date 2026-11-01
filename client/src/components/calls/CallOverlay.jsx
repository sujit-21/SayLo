import React, { useState } from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ScreenShare, Volume2, Lock, Sparkles, Wand2, X, Check, ZoomIn } from 'lucide-react';
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

  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState('none'); // 'none' | 'blur' | 'office' | 'cafe' | 'beach'
  const [selectedFilter, setSelectedFilter] = useState('normal'); // 'normal' | 'warm' | 'cool' | 'noir' | 'vivid' | 'dreamy'

  if (callState === 'idle') return null;

  const getFilterStyle = () => {
    switch (selectedFilter) {
      case 'warm':
        return 'sepia(30%) saturate(125%) brightness(105%)';
      case 'cool':
        return 'hue-rotate(180deg) saturate(110%)';
      case 'noir':
        return 'grayscale(100%) contrast(125%)';
      case 'vivid':
        return 'saturate(160%) contrast(110%)';
      case 'dreamy':
        return 'contrast(95%) brightness(110%)';
      default:
        return 'none';
    }
  };

  // WhatsApp 2025 Remote Video Zoom (1x, 1.5x, 2x)
  const [zoomLevel, setZoomLevel] = useState(1);
  const cycleZoom = (e) => {
    if (e) e.stopPropagation();
    setZoomLevel((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 md:p-4 animate-fadeIn">
      <div className="relative w-full h-full md:max-w-4xl md:h-[85vh] bg-[#111b21] rounded-none md:rounded-3xl overflow-hidden border-0 md:border md:border-gray-800 shadow-2xl flex flex-col">
        {/* Top bar info */}
        <div className="absolute top-4 left-4 sm:left-6 z-20 flex items-center gap-3 bg-black/50 backdrop-blur-md px-3.5 sm:px-4 py-2 rounded-full border border-white/10 shadow-lg">
          <Avatar src={activeUser?.avatar} name={activeUser?.name || 'User'} size="sm" />
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight truncate max-w-[140px] sm:max-w-[200px]">
              {activeUser?.name}
            </h4>
            <p className="text-[11px] sm:text-xs text-saylo-400 font-mono">
              {callState === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>
        </div>

        {/* WhatsApp Call Security Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[11px] text-gray-300 shadow-md">
          <Lock size={12} className="text-saylo-emerald" />
          <span>End-to-end encrypted</span>
        </div>

        {/* Video / Audio Stage */}
        <div className="flex-1 relative bg-[#0b141a] flex items-center justify-center overflow-hidden">
          {callType === 'video' ? (
            <>
              {/* Remote Video with WhatsApp 2025 Zoom */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                onDoubleClick={cycleZoom}
                className="w-full h-full object-cover transition-transform duration-300 origin-center cursor-zoom-in"
                style={{ transform: `scale(${zoomLevel})` }}
              />

              {/* Remote Video Zoom Pill Button */}
              <button
                type="button"
                onClick={cycleZoom}
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white shadow-lg transition-transform active:scale-95"
                title="Zoom remote video (1x, 1.5x, 2x)"
              >
                <ZoomIn size={14} className={zoomLevel > 1 ? 'text-saylo-emerald' : 'text-gray-300'} />
                <span>{zoomLevel}x</span>
              </button>
              {/* Local Video PiP with WhatsApp Background Effects & Filters */}
              <div
                className={`absolute bottom-24 right-3 sm:right-6 w-28 h-36 sm:w-48 sm:h-36 bg-black rounded-xl sm:rounded-2xl overflow-hidden border-2 border-saylo-emerald shadow-2xl relative ${
                  selectedEffect === 'blur' ? 'backdrop-blur-xl' : ''
                }`}
                style={{
                  backgroundImage:
                    selectedEffect === 'office'
                      ? 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop)'
                      : selectedEffect === 'cafe'
                      ? 'url(https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop)'
                      : selectedEffect === 'beach'
                      ? 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop)'
                      : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-all ${
                    selectedEffect !== 'none' && selectedEffect !== 'blur' ? 'opacity-90 mix-blend-screen' : ''
                  }`}
                  style={{
                    filter: getFilterStyle(),
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-6">
                {callState === 'connected' && (
                  <div className="absolute inset-0 rounded-full animate-pulse bg-saylo-emerald/20 scale-150"></div>
                )}
                <Avatar src={activeUser?.avatar} name={activeUser?.name || 'User'} size="2xl" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{activeUser?.name}</h3>
              <p className="text-saylo-emerald text-xs sm:text-sm font-mono tracking-wider">
                {callState === 'calling' ? 'Calling...' : `Connected (${formatDuration(callDuration)})`}
              </p>
            </div>
          )}
        </div>

        {/* WhatsApp Video Call Effects Drawer */}
        {showEffectsDrawer && callType === 'video' && (
          <div className="absolute bottom-24 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-80 bg-[#1f2c34] border border-gray-700/80 rounded-3xl p-4 shadow-2xl z-30 animate-in slide-in-from-bottom duration-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700/50 mb-3">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-saylo-emerald" />
                Call Effects & Backgrounds
              </span>
              <button
                type="button"
                onClick={() => setShowEffectsDrawer(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Virtual Backgrounds */}
            <div className="mb-3">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
                Background
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'blur', label: 'Blur' },
                  { id: 'office', label: 'Office' },
                  { id: 'cafe', label: 'Cafe' },
                  { id: 'beach', label: 'Beach' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSelectedEffect(bg.id)}
                    className={`py-1.5 px-2 rounded-xl text-center font-medium capitalize border transition-all ${
                      selectedEffect === bg.id
                        ? 'bg-saylo-emerald text-white border-saylo-emerald shadow-sm'
                        : 'bg-black/30 border-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Color Filters */}
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
                Color Filter
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'normal', label: 'Normal' },
                  { id: 'warm', label: 'Warm' },
                  { id: 'cool', label: 'Cool' },
                  { id: 'vivid', label: 'Vivid' },
                  { id: 'noir', label: 'B&W' },
                  { id: 'dreamy', label: 'Dreamy' },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setSelectedFilter(flt.id)}
                    className={`py-1.5 px-2 rounded-xl text-center font-medium capitalize border transition-all ${
                      selectedFilter === flt.id
                        ? 'bg-saylo-emerald text-white border-saylo-emerald shadow-sm'
                        : 'bg-black/30 border-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Call Controls Toolbar */}
        <div className="h-20 bg-[#202c33] border-t border-gray-800 flex items-center justify-center gap-3 sm:gap-6 px-3 sm:px-6 z-20">
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

          {/* WhatsApp Video Effects & Background Blur */}
          {callType === 'video' && (
            <button
              onClick={() => setShowEffectsDrawer(!showEffectsDrawer)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                showEffectsDrawer || selectedEffect !== 'none' || selectedFilter !== 'normal'
                  ? 'bg-gradient-to-tr from-blue-500 via-purple-500 to-emerald-400 text-white shadow-lg scale-105'
                  : 'bg-gray-700/60 hover:bg-gray-700 text-white'
              }`}
              title="Effects & Virtual Backgrounds"
            >
              <Sparkles size={20} />
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

