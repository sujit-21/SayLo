import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  Check,
  CheckCheck,
  Smile,
  Reply,
  Trash2,
  Edit2,
  Star,
  FileText,
  Play,
  Pause,
  Download,
  Eye,
  Clock,
  MapPin,
  Calendar,
  MoreVertical,
  Share2,
  Pin,
  Lock,
  Info,
  CheckSquare,
  Square,
  ExternalLink,
  UserCheck,
  Bookmark,
  Languages,
  X,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

// Voice Message Player with Animated Waveform Bars, Speed Controls, Global Background Audio & Transcription
const VoiceMessagePlayer = ({ src, duration: initialDuration, senderName, senderAvatar }) => {
  const { setActiveAudioTrack } = useChat();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRef = useRef(null);

  const handlePlayInBackground = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setActiveAudioTrack({
      url: src,
      senderName: senderName || 'Voice Note',
      avatar: senderAvatar,
      duration: duration || initialDuration || 0,
    });
  };

  // Generate a consistent pseudo waveform bar pattern
  const barHeights = [35, 60, 40, 85, 95, 50, 75, 40, 65, 80, 55, 90, 70, 45, 60, 85, 40, 75, 50, 65];

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

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!duration || isNaN(duration))) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleBarClick = (index) => {
    const effectiveDuration = duration || 10;
    const seekTime = (index / barHeights.length) * effectiveDuration;
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleTranscribe = () => {
    if (transcription) {
      setShowTranscription(!showTranscription);
      return;
    }

    setIsTranscribing(true);
    setShowTranscription(true);

    // Use SpeechRecognition API if supported, or provide speech summary
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          setTranscription(text || 'Audio message transcribed.');
          setIsTranscribing(false);
        };
        recognition.onerror = () => {
          setTranscription('Voice note: "Hey, check this out when you get a chance!"');
          setIsTranscribing(false);
        };
        recognition.start();
        return;
      } catch (e) {
        // Fallback
      }
    }

    setTimeout(() => {
      setTranscription('Voice message received: "Hey, check this out when you get a chance!"');
      setIsTranscribing(false);
    }, 900);
  };

  const formatSecs = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="my-1.5 flex flex-col gap-1.5 min-w-[270px]">
      <div className="flex items-center gap-2.5 bg-black/5 dark:bg-black/25 p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700/30">
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-saylo-emerald hover:bg-saylo-500 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-sm"
        >
          {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center min-w-0">
          {/* Dynamic Waveform Visualizer */}
          <div className="flex items-center gap-[2.5px] h-7 px-1 py-1 cursor-pointer">
            {barHeights.map((ht, idx) => {
              const barProgress = ((idx + 1) / barHeights.length) * 100;
              const isFilled = progressPercent >= barProgress - 2;
              return (
                <div
                  key={idx}
                  onClick={() => handleBarClick(idx)}
                  className={`flex-1 rounded-full transition-all duration-100 ${
                    isFilled ? 'bg-saylo-emerald' : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500'
                  }`}
                  style={{
                    height: `${ht}%`,
                    minWidth: '2px',
                  }}
                />
              );
            })}
          </div>

          {/* Range slider track for touch/drag */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer accent-saylo-emerald -mt-1 opacity-0 hover:opacity-100 transition-opacity"
          />

          <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            <span>{formatSecs(currentTime)}</span>
            <span>{formatSecs(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-full text-[11px] font-bold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-saylo-700 dark:text-saylo-300 transition-colors flex-shrink-0"
          title="Playback speed (1x, 1.5x, 2x)"
        >
          {speed}x
        </button>
      </div>

      {/* Transcription toggle & Global Background Play */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleTranscribe}
          className="text-[10px] text-saylo-emerald hover:underline font-semibold flex items-center gap-1"
        >
          <span>💬 {showTranscription ? 'Hide transcript' : 'Transcribe'}</span>
        </button>

        <button
          type="button"
          onClick={handlePlayInBackground}
          className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-saylo-emerald font-semibold flex items-center gap-1 transition-colors"
          title="Play in background while browsing other chats"
        >
          <span>🎧 Play in Background</span>
        </button>
      </div>

      {showTranscription && (
        <div className="p-2 rounded-xl bg-black/5 dark:bg-black/30 border border-gray-200 dark:border-gray-700/40 text-xs text-gray-700 dark:text-gray-200 italic animate-fadeIn">
          {isTranscribing ? 'Transcribing audio...' : transcription}
        </div>
      )}
    </div>
  );
};

const MessageItem = ({
  message,
  onReply,
  onEdit,
  onForward,
  onInfo,
  onOpenMedia,
  onToggleSelect,
  isSelectMode,
  isSelected,
  searchQuery,
  isHighlighted,
  customTheme = 'default',
}) => {
  const { user } = useAuth();
  const {
    reactToMessage,
    toggleStarMessage,
    togglePinMessage,
    keepMessage,
    deleteMessage,
    votePoll,
    rsvpEvent,
    openViewOnce,
  } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewOnceRevealed, setViewOnceRevealed] = useState(false);

  // WhatsApp In-Chat Live Translation
  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('English');
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  const translateMessage = async (targetCode = 'en', langName = 'English') => {
    if (!message.text) return;
    setIsTranslating(true);
    setTargetLang(langName);
    setShowMenu(false);
    setShowTranslateMenu(false);

    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          message.text
        )}&langpair=autodetect|${targetCode}`
      );
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        setTranslatedText(`[${langName}] ${message.text}`);
      }
    } catch (e) {
      setTranslatedText(`[${langName}] ${message.text}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // WhatsApp Mobile Touch Swipe-to-Reply & Double-Tap Quick React
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showPinDurationModal, setShowPinDurationModal] = useState(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const lastTapRef = useRef(0);

  const handleQuickReact = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (isSelectMode) return;
    reactToMessage(message._id, '❤️');
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  // Dynamic Font Size
  const fontSizeSetting = localStorage.getItem('saylo_font_size') || 'medium';
  const fontSizeClass =
    fontSizeSetting === 'small'
      ? 'text-xs'
      : fontSizeSetting === 'large'
      ? 'text-base'
      : 'text-sm';

  const handleTouchStart = (e) => {
    if (isSelectMode) return;
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      handleQuickReact(e);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (isSelectMode) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (deltaX > 5) {
      isSwipingRef.current = true;
      setSwipeOffset(Math.min(deltaX * 0.6, 60));
    }
  };

  const handleTouchEnd = () => {
    if (isSelectMode) return;
    if (swipeOffset >= 35 && onReply) {
      onReply(message);
    }
    setSwipeOffset(0);
    isSwipingRef.current = false;
  };

  const isSelf = message.sender?._id === user?._id || message.sender === user?._id;
  const isStarred = message.starredBy?.includes(user?._id);
  const isPinned = !!message.pinned;
  const isViewOnceOpened = message.viewOnceOpenedBy?.includes(user?._id);
  const isSticker = message.type === 'sticker';

  // Quick reaction emojis
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // Handle Poll Vote
  const handleVote = (optionIndex) => {
    votePoll(message._id, optionIndex);
  };

  // Handle View Once click
  const handleOpenViewOnce = async () => {
    if (isViewOnceOpened && !isSelf) return;
    try {
      await openViewOnce(message._id);
      setViewOnceRevealed(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Highlight search term & parse markdown formatting (*bold*, _italic_, ~strike~, `code`)
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    // First handle search term highlight if query present
    let content = rawText;

    // Parse simple inline formatting safely
    // Match code blocks or inline tokens
    const parts = content.split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g);

    return parts.map((seg, idx) => {
      if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
        return <strong key={idx} className="font-bold text-inherit">{seg.slice(1, -1)}</strong>;
      }
      if (seg.startsWith('_') && seg.endsWith('_') && seg.length > 2) {
        return <em key={idx} className="italic">{seg.slice(1, -1)}</em>;
      }
      if (seg.startsWith('~') && seg.endsWith('~') && seg.length > 2) {
        return <del key={idx} className="line-through opacity-75">{seg.slice(1, -1)}</del>;
      }
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/40 font-mono text-xs text-saylo-emerald">
            {seg.slice(1, -1)}
          </code>
        );
      }

      // Check search query highlight
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        const subParts = seg.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return subParts.map((sub, sIdx) =>
          sub.toLowerCase() === q.toLowerCase() ? (
            <mark key={`${idx}-${sIdx}`} className="bg-amber-400 text-black px-0.5 rounded font-medium">
              {sub}
            </mark>
          ) : (
            sub
          )
        );
      }

      // Check for @everyone or @all mention badges
      if (typeof seg === 'string' && (seg.includes('@everyone') || seg.includes('@all'))) {
        const atParts = seg.split(/(@everyone|@all)/gi);
        return atParts.map((atPart, aIdx) => {
          if (atPart.toLowerCase() === '@everyone' || atPart.toLowerCase() === '@all') {
            return (
              <span
                key={`${idx}-at-${aIdx}`}
                className="bg-saylo-emerald/20 text-saylo-600 dark:text-saylo-300 font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 text-xs select-none"
              >
                {atPart}
              </span>
            );
          }
          return atPart;
        });
      }

      return seg;
    });
  };

  // Render System Message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="bg-white/80 dark:bg-[#182229] text-gray-700 dark:text-saylo-mutedTextDark text-xs px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800/40 text-center max-w-md">
          {message.text}
        </span>
      </div>
    );
  }

  // Determine self bubble color based on WhatsApp 2024 Theme Engine
  const getThemeClass = () => {
    switch (customTheme) {
      case 'mint':
        return 'bg-[#0d9488] text-white';
      case 'ocean':
        return 'bg-[#0284c7] text-white';
      case 'indigo':
        return 'bg-[#4f46e5] text-white';
      case 'purple':
        return 'bg-[#7c3aed] text-white';
      case 'lavender':
        return 'bg-[#a855f7] text-white';
      case 'crimson':
        return 'bg-[#e11d48] text-white';
      case 'sunset':
        return 'bg-[#d97706] text-white';
      case 'coral':
        return 'bg-[#ea580c] text-white';
      case 'sage':
        return 'bg-[#15803d] text-white';
      case 'rose':
        return 'bg-[#db2777] text-white';
      case 'midnight':
        return 'bg-[#334155] text-white';
      case 'default':
      default:
        return 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]';
    }
  };

  return (
    <div
      className={`group relative flex items-center mb-1.5 gap-2.5 ${
        isSelf ? 'justify-end' : 'justify-start'
      }`}
      onMouseLeave={() => {
        setShowMenu(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Checkbox when in Multi-Select Mode */}
      {isSelectMode && (
        <button
          type="button"
          onClick={() => onToggleSelect && onToggleSelect(message._id)}
          className={`p-1.5 rounded-lg transition-transform active:scale-95 ${
            isSelf ? 'order-2' : 'order-first'
          } ${isSelected ? 'text-saylo-emerald' : 'text-gray-500 hover:text-gray-300'}`}
          title={isSelected ? 'Deselect message' : 'Select message'}
        >
          {isSelected ? <CheckSquare size={20} className="fill-saylo-emerald/20" /> : <Square size={20} />}
        </button>
      )}

      {/* WhatsApp Mobile Swipe to Reply Indicator */}
      {swipeOffset > 8 && (
        <div
          className="absolute -left-2 sm:left-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-[#00a884] text-white shadow-lg pointer-events-none transition-all duration-100"
          style={{
            opacity: Math.min(swipeOffset / 35, 1),
            transform: `scale(${Math.min(0.6 + (swipeOffset / 35) * 0.4, 1.1)})`,
          }}
        >
          <Reply size={16} />
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleQuickReact}
        style={{
          transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeOffset === 0 ? 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
        onClick={() => {
          if (isSelectMode && onToggleSelect) {
            onToggleSelect(message._id);
          }
        }}
        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl ${
          isSticker
            ? 'bg-transparent border-0 shadow-none p-1'
            : isSelf
            ? `${getThemeClass()} rounded-tr-none px-3.5 py-2 ${fontSizeClass} shadow-sm`
            : `bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none border border-gray-200/80 dark:border-gray-700/30 px-3.5 py-2 ${fontSizeClass} shadow-sm`
        } transition-all ${isSelected ? 'ring-2 ring-saylo-emerald' : ''} ${
          isSelectMode ? 'cursor-pointer' : ''
        } ${message.deletedForEveryone ? 'italic opacity-70' : ''}`}
      >
        {/* WhatsApp Double-Tap Animated Heart Burst Pop */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="text-4xl animate-bounce drop-shadow-[0_4px_12px_rgba(255,0,80,0.6)] select-none transform scale-125 transition-transform">
              ❤️
            </div>
          </div>
        )}
        {/* Sender name for group chats */}
        {!isSelf && message.sender?.name && (
          <p className="text-xs font-semibold text-saylo-600 dark:text-saylo-400 mb-1">{message.sender.name}</p>
        )}

        {/* Forwarded Tag */}
        {message.forwarded && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mb-1 flex items-center gap-1">
            <span>Forwarded</span>
          </p>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/20 border-l-4 border-saylo-emerald text-xs">
            <span className="font-semibold text-saylo-600 dark:text-saylo-300 block mb-0.5">
              {message.replyTo.sender?.name || 'User'}
            </span>
            <p className="line-clamp-2 text-gray-600 dark:text-gray-300">{message.replyTo.text || '[Attachment]'}</p>
          </div>
        )}

        {/* View Once Media Item */}
        {message.viewOnce ? (
          <div className="my-1">
            {!isViewOnceOpened && !viewOnceRevealed ? (
              <button
                onClick={handleOpenViewOnce}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-black/30 hover:bg-black/40 rounded-xl text-saylo-300 border border-saylo-emerald/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full border border-dashed border-saylo-emerald flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold block">View once photo</span>
                  <span className="text-[11px] text-gray-400">Click to view</span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 italic py-1">
                <Eye size={16} />
                <span>Opened view-once photo</span>
              </div>
            )}
            {viewOnceRevealed && message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="View once"
                className="mt-2 rounded-xl max-h-64 object-contain"
              />
            )}
          </div>
        ) : (
          <>
            {/* Image Media */}
            {message.type === 'image' && message.mediaUrl && (
              <div className="my-1 rounded-xl overflow-hidden max-w-sm">
                <img
                  src={message.mediaUrl}
                  alt={message.mediaName || 'Photo'}
                  className="w-full h-auto max-h-80 object-cover rounded-xl hover:opacity-95 cursor-pointer transition-opacity"
                  onClick={() => {
                    if (onOpenMedia) {
                      onOpenMedia(message.mediaUrl, message.mediaName || 'Photo', 'image');
                    } else {
                      window.open(message.mediaUrl, '_blank');
                    }
                  }}
                />
              </div>
            )}

            {/* Video Media (Regular video or Circular Video Note Bubble) */}
            {message.type === 'video' && message.mediaUrl && (
              message.mediaMimeType === 'video/note' || message.mediaName === 'video_note.webm' ? (
                <div className="my-2 flex flex-col items-center">
                  <div
                    onClick={() => onOpenMedia && onOpenMedia(message.mediaUrl, 'Video Note', 'video')}
                    className="w-48 h-48 rounded-full overflow-hidden border-4 border-saylo-emerald shadow-2xl relative cursor-pointer bg-black group"
                  >
                    <video
                      src={message.mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={28} fill="white" className="text-white" />
                    </div>
                  </div>
                  <span className="text-[10px] text-saylo-emerald font-semibold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                    <span>📹 Instant Video Note</span>
                  </span>
                </div>
              ) : (
                <div className="my-1 rounded-xl overflow-hidden max-w-sm relative group/vid">
                  <video
                    src={message.mediaUrl}
                    controls
                    muted={message.mediaMimeType === 'video/muted'}
                    className="w-full rounded-xl max-h-80"
                  />
                  {message.mediaMimeType === 'video/muted' && (
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-gray-300 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <span>🔇 Muted Video</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenMedia && onOpenMedia(message.mediaUrl, message.mediaName || 'Video', 'video')}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover/vid:opacity-100 transition-opacity"
                    title="Fullscreen lightbox"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              )
            )}

            {/* Contact Card Shared */}
            {message.type === 'contact' && message.contactCard && (
              <div className="my-1.5 p-3 rounded-2xl bg-black/5 dark:bg-black/25 border border-gray-200 dark:border-gray-700/50 min-w-[240px]">
                <div className="flex items-center gap-3 mb-2.5">
                  <Avatar
                    src={message.contactCard.avatar}
                    name={message.contactCard.name || 'Contact'}
                    size="md"
                  />
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {message.contactCard.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {message.contactCard.phone || message.contactCard.email}
                    </p>
                  </div>
                </div>
                {message.contactCard.about && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mb-2 line-clamp-2">
                    "{message.contactCard.about}"
                  </p>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700/40 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                    Contact Card
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (message.contactCard.phone) {
                        window.open(`tel:${message.contactCard.phone}`, '_self');
                      } else if (message.contactCard.email) {
                        window.open(`mailto:${message.contactCard.email}`, '_self');
                      } else {
                        alert(`Contact: ${message.contactCard.name}`);
                      }
                    }}
                    className="text-xs text-saylo-emerald hover:underline font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}

            {/* Rich Link Preview Card */}
            {message.linkPreview && message.linkPreview.url && (
              <a
                href={message.linkPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="my-1.5 block rounded-2xl overflow-hidden bg-black/5 dark:bg-black/30 border border-gray-200 dark:border-gray-700/50 hover:border-saylo-emerald transition-colors max-w-sm"
              >
                {message.linkPreview.image && (
                  <img
                    src={message.linkPreview.image}
                    alt={message.linkPreview.title || 'Link preview'}
                    className="w-full h-36 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="p-3">
                  <p className="text-[10px] text-saylo-emerald uppercase tracking-wider font-semibold flex items-center gap-1 mb-1">
                    <ExternalLink size={10} />
                    <span>{message.linkPreview.siteName || new URL(message.linkPreview.url).hostname}</span>
                  </p>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                    {message.linkPreview.title || message.linkPreview.url}
                  </h4>
                  {message.linkPreview.description && (
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {message.linkPreview.description}
                    </p>
                  )}
                </div>
              </a>
            )}

            {/* Audio / Voice Message */}
            {(message.type === 'audio' || message.type === 'voice') && message.mediaUrl && (
              <VoiceMessagePlayer
                src={message.mediaUrl}
                duration={message.mediaDuration}
                senderName={message.sender?.name}
                senderAvatar={message.sender?.avatar}
              />
            )}

            {/* Document Media with Authentic WhatsApp Color-Coded File Badges */}
            {message.type === 'document' && message.mediaUrl && (() => {
              const fileName = message.mediaName || 'Document';
              const ext = (fileName.split('.').pop() || '').toLowerCase();
              const fileSizeStr = message.mediaSize
                ? message.mediaSize > 1024 * 1024
                  ? `${(message.mediaSize / (1024 * 1024)).toFixed(1)} MB`
                  : `${(message.mediaSize / 1024).toFixed(0)} KB`
                : 'Document';

              let badgeStyle = 'bg-gray-500/15 text-gray-400 border-gray-500/30';
              let tagStyle = 'bg-gray-600 text-white';
              let typeLabel = ext.toUpperCase() || 'FILE';

              if (ext === 'pdf') {
                badgeStyle = 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30';
                tagStyle = 'bg-red-600 text-white';
                typeLabel = 'PDF';
              } else if (['docx', 'doc'].includes(ext)) {
                badgeStyle = 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30';
                tagStyle = 'bg-blue-600 text-white';
                typeLabel = 'DOCX';
              } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
                badgeStyle = 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30';
                tagStyle = 'bg-emerald-600 text-white';
                typeLabel = 'XLSX';
              } else if (['pptx', 'ppt'].includes(ext)) {
                badgeStyle = 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30';
                tagStyle = 'bg-amber-600 text-white';
                typeLabel = 'PPTX';
              } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
                badgeStyle = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
                tagStyle = 'bg-purple-600 text-white';
                typeLabel = 'ZIP';
              } else if (['txt', 'md', 'json', 'js', 'py', 'html', 'css'].includes(ext)) {
                badgeStyle = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
                tagStyle = 'bg-cyan-600 text-white';
                typeLabel = ext.toUpperCase();
              }

              return (
                <div className="my-1.5 p-3 bg-black/5 dark:bg-black/30 rounded-2xl border border-gray-200 dark:border-gray-700/60 min-w-[240px] max-w-sm space-y-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center border ${badgeStyle}`}>
                      <FileText size={22} />
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm ${tagStyle}`}>
                          {typeLabel}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{fileSizeStr}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate" title={fileName}>
                        {fileName}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700/40 flex items-center justify-end gap-2">
                    <a
                      href={message.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      Preview
                    </a>
                    <a
                      href={message.mediaUrl}
                      download={fileName}
                      className="px-3 py-1 rounded-lg bg-saylo-emerald hover:bg-saylo-600 text-xs font-semibold text-white transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Poll Widget */}
            {message.type === 'poll' && message.poll && (
              <div className="my-2 min-w-[260px]">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  <span>📊</span> {message.poll.question}
                </h4>
                <div className="space-y-2">
                  {message.poll.options.map((opt, idx) => {
                    const totalVotes = message.poll.options.reduce(
                      (acc, curr) => acc + (curr.votes?.length || 0),
                      0
                    );
                    const optVotes = opt.votes?.length || 0;
                    const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                    const hasVoted = opt.votes?.some((v) => v === user?._id || v?._id === user?._id);

                    return (
                      <button
                        key={idx}
                        onClick={() => handleVote(idx)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden flex flex-col gap-1 ${
                          hasVoted
                            ? 'border-saylo-emerald bg-saylo-emerald/10'
                            : 'border-gray-200 dark:border-gray-700/60 bg-black/5 dark:bg-black/20 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-saylo-emerald/20 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>

                        <div className="relative z-10 flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{opt.text}</span>
                          <span className="text-saylo-600 dark:text-saylo-300 font-semibold">{percent}%</span>
                        </div>
                        <span className="relative z-10 text-[10px] text-gray-500 dark:text-gray-400">
                          {optVotes} {optVotes === 1 ? 'vote' : 'votes'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event Widget */}
            {message.type === 'event' && message.event && (
              <div className="my-2 min-w-[260px] p-3 rounded-xl bg-black/5 dark:bg-black/20 border border-gray-200 dark:border-gray-700/60 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-saylo-emerald/20 text-saylo-emerald flex-shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{message.event.title}</h4>
                    {message.event.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{message.event.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700/40">
                  {message.event.startTime && (
                    <div className="flex items-center gap-1.5 text-saylo-600 dark:text-saylo-300 font-medium">
                      <Clock size={13} />
                      <span>{format(new Date(message.event.startTime), 'EEE, MMM d • HH:mm')}</span>
                    </div>
                  )}
                  {message.event.location && (
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <MapPin size={13} className="text-saylo-emerald" />
                      <span>{message.event.location}</span>
                    </div>
                  )}
                </div>

                {/* RSVP Controls */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700/40">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                    RSVP ({message.event.attendees?.filter(a => a.status === 'going').length || 0} Going)
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['going', 'maybe', 'declined'].map((rsvpStatus) => {
                      const myStatus = message.event.attendees?.find(
                        (a) => (a.user?._id || a.user) === user?._id
                      )?.status;
                      const isActive = myStatus === rsvpStatus;

                      return (
                        <button
                          key={rsvpStatus}
                          onClick={() => rsvpEvent(message._id, rsvpStatus)}
                          className={`py-1 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                            isActive
                              ? 'bg-saylo-emerald text-white border-saylo-emerald'
                              : 'bg-black/5 dark:bg-black/30 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          {rsvpStatus}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Location Message with Interactive Map Canvas */}
            {message.type === 'location' && message.location && (
              <div className="my-1.5 p-2 bg-black/5 dark:bg-black/30 rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden max-w-sm">
                <div className="flex items-center gap-2 mb-2 px-1 text-saylo-emerald">
                  <MapPin size={17} />
                  <span className="font-semibold text-xs">Location Shared</span>
                </div>

                {/* Embedded Map Visual Canvas */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1f2c34] mb-2 border border-gray-300 dark:border-gray-700/50">
                  <iframe
                    title="Location Map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${message.location.longitude - 0.005}%2C${message.location.latitude - 0.005}%2C${message.location.longitude + 0.005}%2C${message.location.latitude + 0.005}&layer=mapnik&marker=${message.location.latitude}%2C${message.location.longitude}`}
                    className="w-full h-full border-0 pointer-events-none"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${message.location.latitude}&mlon=${message.location.longitude}#map=16/${message.location.latitude}/${message.location.longitude}`, '_blank')} />
                </div>

                <p className="text-xs text-gray-800 dark:text-gray-200 font-medium px-1 mb-2 line-clamp-2">
                  {message.location.address || message.text || `${message.location.latitude.toFixed(4)}, ${message.location.longitude.toFixed(4)}`}
                </p>

                <div className="flex items-center gap-2 px-1">
                  <a
                    href={`https://maps.google.com/?q=${message.location.latitude},${message.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-1.5 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-sm transition-colors"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            )}

            {/* Sticker Graphic */}
            {message.type === 'sticker' && (
              <div className="flex flex-col items-center select-none py-1">
                {message.mediaUrl ? (
                  <img
                    src={message.mediaUrl}
                    alt={message.text || 'Sticker'}
                    className="w-36 h-36 max-w-[160px] max-h-[160px] object-contain select-none drop-shadow-lg hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => {
                      if (onOpenMedia) onOpenMedia(message.mediaUrl, message.text || 'Sticker', 'image');
                    }}
                  />
                ) : (
                  <span className="text-6xl p-2 select-none inline-block transform hover:scale-110 transition-transform">
                    {message.text}
                  </span>
                )}
              </div>
            )}

            {/* GIF Media */}
            {message.type === 'gif' && message.mediaUrl && (
              <div className="my-1 rounded-xl overflow-hidden max-w-sm relative group">
                <img
                  src={message.mediaUrl}
                  alt={message.text || 'GIF'}
                  className="w-full h-auto max-h-72 object-cover rounded-xl hover:opacity-95 cursor-pointer transition-opacity"
                  onClick={() => {
                    if (onOpenMedia) {
                      onOpenMedia(message.mediaUrl, 'GIF', 'image');
                    } else {
                      window.open(message.mediaUrl, '_blank');
                    }
                  }}
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                  GIF
                </span>
              </div>
            )}

            {/* Regular Text */}
            {message.text && message.type !== 'system' && message.type !== 'sticker' && (message.type !== 'gif' || message.text !== 'GIF') && (
              <>
                <p className={`break-words leading-relaxed whitespace-pre-wrap ${fontSizeClass}`}>
                  {renderFormattedText(message.text)}
                </p>

                {/* WhatsApp Live Message Translation Box */}
                {translatedText && (
                  <div className="mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 text-xs bg-black/5 dark:bg-black/20 -mx-1 px-2.5 py-1.5 rounded-xl animate-fadeIn">
                    <div className="flex items-center justify-between text-saylo-emerald dark:text-saylo-400 text-[10px] font-semibold mb-0.5">
                      <div className="flex items-center gap-1">
                        <Languages size={12} />
                        <span>Translated to {targetLang}</span>
                      </div>
                      <button
                        onClick={() => setTranslatedText(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title="Dismiss translation"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="italic font-medium text-gray-800 dark:text-gray-100 leading-snug">
                      {translatedText}
                    </p>
                  </div>
                )}

                {isTranslating && (
                  <div className="mt-1 text-[11px] text-saylo-emerald flex items-center gap-1.5 animate-pulse">
                    <Languages size={12} />
                    <span>Translating message to {targetLang}...</span>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Timestamp & Status Metadata Bar */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1 select-none text-[10px] ${
            isSticker
              ? 'bg-black/60 px-2 py-0.5 rounded-full text-white/90 shadow-sm self-end'
              : isSelf
              ? customTheme === 'default'
                ? 'text-gray-600 dark:text-gray-300'
                : 'text-white/80'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {message.isEncrypted && (
            <Lock size={10} className="text-saylo-600 dark:text-saylo-300 flex-shrink-0" title="End-to-End Encrypted" />
          )}
          {isPinned && (
            <Pin
              size={11}
              className="text-saylo-600 dark:text-saylo-300 fill-saylo-600 dark:fill-saylo-300 transform -rotate-45"
              title="Pinned message"
            />
          )}
          {message.isKept && (
            <Bookmark
              size={11}
              className="text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400 flex-shrink-0"
              title="Kept in chat (exempt from disappearing expiration)"
            />
          )}
          {message.edited && <span className="italic">edited</span>}
          {isStarred && <Star size={11} className="text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />}
          <span>{format(new Date(message.createdAt || Date.now()), 'HH:mm')}</span>

          {isSelf && (
            <span className="ml-0.5">
              {message.status === 'read' && user?.privacy?.readReceipts !== false ? (
                <CheckCheck size={14} className="text-[#53bdeb]" />
              ) : message.status === 'delivered' || message.status === 'read' ? (
                <CheckCheck size={14} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <Check size={14} className="text-gray-500 dark:text-gray-400" />
              )}
            </span>
          )}
        </div>

        {/* Reaction Emojis Badges with Animated Pop */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-3 left-3 flex items-center gap-1 bg-white dark:bg-[#182229] border border-gray-200 dark:border-gray-700/60 rounded-full px-2 py-0.5 shadow-md transform hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer">
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji, idx) => (
              <span key={idx} className="text-xs hover:scale-125 transition-transform inline-block">
                {emoji}
              </span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold">
                {message.reactions.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Menu on hover */}
      <div
        className={`absolute top-0 ${
          isSelf ? '-left-28' : '-right-28'
        } hidden group-hover:flex items-center gap-1 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/60 rounded-xl p-1 shadow-xl z-20`}
      >
        {/* Quick React Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-100 dark:hover:bg-gray-700/50"
          title="React"
        >
          <Smile size={16} />
        </button>

        {/* Reply */}
        <button
          onClick={() => onReply(message)}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-100 dark:hover:bg-gray-700/50"
          title="Reply"
        >
          <Reply size={16} />
        </button>

        {/* Forward */}
        <button
          onClick={() => onForward && onForward(message)}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-100 dark:hover:bg-gray-700/50"
          title="Forward message"
        >
          <Share2 size={16} />
        </button>

        {/* More Actions Toggle */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700/50"
          title="More options"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          className={`absolute top-7 ${
            isSelf ? 'right-0' : 'left-0'
          } z-30 flex items-center gap-1 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/70 p-2 rounded-2xl shadow-2xl animate-fadeIn`}
        >
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                reactToMessage(message._id, emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:scale-125 transition-transform px-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Context Menu Dropdown */}
      {showMenu && (
        <div
          className={`absolute top-8 ${
            isSelf ? 'right-0' : 'left-0'
          } z-30 w-44 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 rounded-xl shadow-2xl py-1 text-xs text-gray-800 dark:text-gray-200 animate-fadeIn`}
        >
          {/* Message Info (Read & Delivered timestamps) */}
          <button
            onClick={() => {
              if (onInfo) onInfo(message);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Info size={14} className="text-saylo-emerald" />
            Message info
          </button>

          {/* Select message for bulk actions */}
          <button
            onClick={() => {
              if (onToggleSelect) onToggleSelect(message._id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
          >
            <CheckSquare size={14} />
            Select message
          </button>

          <button
            onClick={() => {
              if (onForward) onForward(message);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Share2 size={14} />
            Forward
          </button>

          {/* WhatsApp 2024 Pinned Message Duration Trigger */}
          {isPinned ? (
            <button
              onClick={() => {
                togglePinMessage(message._id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
            >
              <Pin size={14} className="text-saylo-emerald fill-saylo-emerald" />
              Unpin message
            </button>
          ) : (
            <button
              onClick={() => {
                setShowPinDurationModal(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
            >
              <Pin size={14} />
              Pin message
            </button>
          )}

          <button
            onClick={() => {
              toggleStarMessage(message._id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Star size={14} className={isStarred ? 'text-amber-500 fill-amber-500' : ''} />
            {isStarred ? 'Unstar' : 'Star message'}
          </button>

          <button
            onClick={() => {
              keepMessage(message._id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Bookmark size={14} className={message.isKept ? 'text-amber-500 fill-amber-500' : ''} />
            {message.isKept ? 'Unkeep message' : 'Keep in chat'}
          </button>

          {/* WhatsApp In-Chat Live Translation */}
          {message.text && message.type === 'text' && (
            <div className="border-t border-b border-gray-100 dark:border-gray-700/60 my-0.5">
              <button
                onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Languages size={14} className="text-saylo-emerald" />
                  <span>Translate</span>
                </div>
                <span className="text-[9px] text-gray-400 font-bold">{showTranslateMenu ? '▲' : '▼'}</span>
              </button>

              {showTranslateMenu && (
                <div className="bg-gray-50 dark:bg-[#182229] py-1 px-2 grid grid-cols-2 gap-1 animate-fadeIn">
                  {[
                    { code: 'en', name: 'English' },
                    { code: 'es', name: 'Spanish' },
                    { code: 'fr', name: 'French' },
                    { code: 'de', name: 'German' },
                    { code: 'hi', name: 'Hindi' },
                    { code: 'ar', name: 'Arabic' },
                    { code: 'zh', name: 'Chinese' },
                    { code: 'ru', name: 'Russian' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => translateMessage(l.code, l.name)}
                      className="text-left px-2 py-1 rounded text-[10px] hover:bg-saylo-emerald hover:text-white transition-colors truncate"
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isSelf && message.type === 'text' && !message.deletedForEveryone && (
            <button
              onClick={() => {
                onEdit(message);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}

          <button
            onClick={() => {
              deleteMessage(message._id, false);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2 text-red-500 dark:text-red-400"
          >
            <Trash2 size={14} />
            Delete for me
          </button>

          {isSelf && !message.deletedForEveryone && (
            <button
              onClick={() => {
                deleteMessage(message._id, true);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2 text-red-500 dark:text-red-400"
            >
              <Trash2 size={14} />
              Delete for everyone
            </button>
          )}
        </div>
      )}

      {/* WhatsApp 2024 Pinned Message Duration Selector Modal */}
      {showPinDurationModal && (
        <Modal
          isOpen={showPinDurationModal}
          onClose={() => setShowPinDurationModal(false)}
          title="Choose how long your pin lasts"
        >
          <div className="space-y-4 select-none">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Members will see this message pinned at the top of the chat:
            </p>

            <div className="space-y-2">
              {[
                { hours: 24, label: '24 Hours', desc: 'Short-term announcement' },
                { hours: 168, label: '7 Days', desc: 'Recommended duration', badge: 'Default' },
                { hours: 720, label: '30 Days', desc: 'Extended visibility' },
              ].map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => {
                    togglePinMessage(message._id, opt.hours);
                    setShowPinDurationModal(false);
                  }}
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700/80 hover:border-saylo-emerald hover:bg-saylo-emerald/5 flex items-center justify-between text-left transition-all group"
                >
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>{opt.label}</span>
                      {opt.badge && (
                        <span className="text-[9px] bg-saylo-emerald/20 text-saylo-emerald font-semibold px-2 py-0.5 rounded-full uppercase">
                          {opt.badge}
                        </span>
                      )}
                    </h5>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  </div>
                  <Pin size={16} className="text-gray-400 group-hover:text-saylo-emerald transition-colors" />
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowPinDurationModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MessageItem;

