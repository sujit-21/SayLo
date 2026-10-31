import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, X, Volume2 } from 'lucide-react';
import Avatar from './Avatar';
import { useChat } from '../../context/ChatContext';

const GlobalAudioPlayer = () => {
  const { activeAudioTrack, setActiveAudioTrack } = useChat();
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    if (activeAudioTrack?.url) {
      if (audioRef.current) {
        audioRef.current.src = activeAudioTrack.url;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [activeAudioTrack?.url]);

  if (!activeAudioTrack) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || activeAudioTrack.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActiveAudioTrack(null);
  };

  const formatSecs = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed top-2 sm:top-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-lg w-full bg-[#1f2c34] border border-saylo-emerald/50 rounded-2xl shadow-2xl p-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 animate-slideIn select-none backdrop-blur-md">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setActiveAudioTrack(null);
        }}
        preload="metadata"
      />

      {/* Avatar & Track Info */}
      <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
        <Avatar src={activeAudioTrack.avatar} name={activeAudioTrack.senderName || 'Voice Note'} size="sm" />
        <div className="truncate max-w-[90px] sm:max-w-[130px]">
          <p className="text-xs font-semibold text-white truncate">
            {activeAudioTrack.senderName || 'Voice Note'}
          </p>
          <span className="text-[10px] text-saylo-emerald font-medium flex items-center gap-1">
            <Volume2 size={11} className={isPlaying ? 'animate-pulse' : ''} />
            {isPlaying ? 'Playing...' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Play/Pause & Scrubber */}
      <div className="flex-1 flex items-center gap-2 mx-1 min-w-0">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-saylo-emerald hover:bg-saylo-500 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center min-w-0">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-saylo-emerald"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-0.5">
            <span>{formatSecs(currentTime)}</span>
            <span>{formatSecs(duration)}</span>
          </div>
        </div>
      </div>

      {/* Speed pill & Dismiss button */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-saylo-emerald text-[11px] font-bold rounded-lg transition-colors font-mono"
          title="Playback Speed"
        >
          {playbackSpeed}x
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss player"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;
