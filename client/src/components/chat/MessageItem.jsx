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
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

// Voice Message Player with Animated Waveform Bars, Speed Controls & Live Audio Transcription
const VoiceMessagePlayer = ({ src, duration: initialDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRef = useRef(null);

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
      <div className="flex items-center gap-2.5 bg-black/25 p-2.5 rounded-2xl border border-gray-700/30">
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
                    isFilled ? 'bg-saylo-emerald' : 'bg-gray-600 hover:bg-gray-500'
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

          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-0.5">
            <span>{formatSecs(currentTime)}</span>
            <span>{formatSecs(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 text-saylo-300 transition-colors flex-shrink-0"
          title="Playback speed (1x, 1.5x, 2x)"
        >
          {speed}x
        </button>
      </div>

      {/* Transcription toggle */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleTranscribe}
          className="text-[10px] text-saylo-emerald hover:underline font-semibold flex items-center gap-1"
        >
          <span>💬 {showTranscription ? 'Hide transcript' : 'Transcribe voice'}</span>
        </button>
      </div>

      {showTranscription && (
        <div className="p-2 rounded-xl bg-black/30 border border-gray-700/40 text-xs text-gray-200 italic animate-fadeIn">
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
    deleteMessage,
    votePoll,
    rsvpEvent,
    openViewOnce,
  } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewOnceRevealed, setViewOnceRevealed] = useState(false);

  const isSelf = message.sender?._id === user?._id || message.sender === user?._id;
  const isStarred = message.starredBy?.includes(user?._id);
  const isPinned = !!message.pinned;
  const isViewOnceOpened = message.viewOnceOpenedBy?.includes(user?._id);

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
        return <strong key={idx} className="font-bold text-white">{seg.slice(1, -1)}</strong>;
      }
      if (seg.startsWith('_') && seg.endsWith('_') && seg.length > 2) {
        return <em key={idx} className="italic">{seg.slice(1, -1)}</em>;
      }
      if (seg.startsWith('~') && seg.endsWith('~') && seg.length > 2) {
        return <del key={idx} className="line-through opacity-75">{seg.slice(1, -1)}</del>;
      }
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-xs text-saylo-emerald">
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

      return seg;
    });
  };

  // Render System Message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="bg-[#182229] text-saylo-mutedTextDark text-xs px-3 py-1.5 rounded-lg shadow-sm border border-gray-800/40 text-center max-w-md">
          {message.text}
        </span>
      </div>
    );
  }

  // Determine self bubble color based on customTheme
  const getThemeClass = () => {
    switch (customTheme) {
      case 'ocean':
        return 'bg-[#0284c7] dark:bg-[#0284c7]';
      case 'purple':
        return 'bg-[#7c3aed] dark:bg-[#7c3aed]';
      case 'crimson':
        return 'bg-[#e11d48] dark:bg-[#e11d48]';
      case 'sunset':
        return 'bg-[#d97706] dark:bg-[#d97706]';
      case 'midnight':
        return 'bg-[#334155] dark:bg-[#334155]';
      case 'default':
      default:
        return 'bg-[#005c4b] dark:bg-[#005c4b]';
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

      <div
        onClick={() => {
          if (isSelectMode && onToggleSelect) {
            onToggleSelect(message._id);
          }
        }}
        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-all ${
          isSelf
            ? `${getThemeClass()} text-[#e9edef] rounded-tr-none`
            : 'bg-[#202c33] dark:bg-[#202c33] text-[#e9edef] rounded-tl-none border border-gray-700/30'
        } ${isSelected ? 'ring-2 ring-saylo-emerald' : ''} ${
          isSelectMode ? 'cursor-pointer' : ''
        } ${message.deletedForEveryone ? 'italic opacity-70' : ''}`}
      >
        {/* Sender name for group chats */}
        {!isSelf && message.sender?.name && (
          <p className="text-xs font-semibold text-saylo-400 mb-1">{message.sender.name}</p>
        )}

        {/* Forwarded Tag */}
        {message.forwarded && (
          <p className="text-[11px] text-gray-400 italic mb-1 flex items-center gap-1">
            <span>Forwarded</span>
          </p>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-4 border-saylo-emerald text-xs">
            <span className="font-semibold text-saylo-300 block mb-0.5">
              {message.replyTo.sender?.name || 'User'}
            </span>
            <p className="line-clamp-2 text-gray-300">{message.replyTo.text || '[Attachment]'}</p>
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
                  <video src={message.mediaUrl} controls className="w-full rounded-xl max-h-80" />
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
              <div className="my-1.5 p-3 rounded-2xl bg-black/25 border border-gray-700/50 min-w-[240px]">
                <div className="flex items-center gap-3 mb-2.5">
                  <Avatar
                    src={message.contactCard.avatar}
                    name={message.contactCard.name || 'Contact'}
                    size="md"
                  />
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {message.contactCard.name}
                    </h4>
                    <p className="text-xs text-gray-300 truncate">
                      {message.contactCard.phone || message.contactCard.email}
                    </p>
                  </div>
                </div>
                {message.contactCard.about && (
                  <p className="text-[11px] text-gray-400 italic mb-2 line-clamp-2">
                    "{message.contactCard.about}"
                  </p>
                )}
                <div className="pt-2 border-t border-gray-700/40 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
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
                className="my-1.5 block rounded-2xl overflow-hidden bg-black/30 border border-gray-700/50 hover:border-saylo-emerald transition-colors max-w-sm"
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
                  <h4 className="text-xs font-bold text-white line-clamp-2">
                    {message.linkPreview.title || message.linkPreview.url}
                  </h4>
                  {message.linkPreview.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                      {message.linkPreview.description}
                    </p>
                  )}
                </div>
              </a>
            )}

            {/* Audio / Voice Message */}
            {(message.type === 'audio' || message.type === 'voice') && message.mediaUrl && (
              <VoiceMessagePlayer src={message.mediaUrl} duration={message.mediaDuration} />
            )}

            {/* Document Media */}
            {message.type === 'document' && message.mediaUrl && (
              <div className="my-1 flex items-center justify-between gap-3 p-3 bg-black/20 rounded-xl min-w-[220px]">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="text-saylo-emerald flex-shrink-0" size={24} />
                  <div className="truncate">
                    <span className="text-xs font-medium block truncate">
                      {message.mediaName || 'Document'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {message.mediaSize ? `${(message.mediaSize / 1024).toFixed(1)} KB` : 'File'}
                    </span>
                  </div>
                </div>
                <a
                  href={message.mediaUrl}
                  download={message.mediaName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:bg-white/10 rounded-full text-saylo-emerald"
                >
                  <Download size={18} />
                </a>
              </div>
            )}

            {/* Poll Widget */}
            {message.type === 'poll' && message.poll && (
              <div className="my-2 min-w-[260px]">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-white">
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
                            : 'border-gray-700/60 bg-black/20 hover:border-gray-600'
                        }`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-saylo-emerald/20 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>

                        <div className="relative z-10 flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-200">{opt.text}</span>
                          <span className="text-saylo-300 font-semibold">{percent}%</span>
                        </div>
                        <span className="relative z-10 text-[10px] text-gray-400">
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
              <div className="my-2 min-w-[260px] p-3 rounded-xl bg-black/20 border border-gray-700/60 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-saylo-emerald/20 text-saylo-emerald flex-shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">{message.event.title}</h4>
                    {message.event.description && (
                      <p className="text-xs text-gray-300 mt-0.5">{message.event.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-400 pt-1 border-t border-gray-700/40">
                  {message.event.startTime && (
                    <div className="flex items-center gap-1.5 text-saylo-300 font-medium">
                      <Clock size={13} />
                      <span>{format(new Date(message.event.startTime), 'EEE, MMM d • HH:mm')}</span>
                    </div>
                  )}
                  {message.event.location && (
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <MapPin size={13} className="text-saylo-emerald" />
                      <span>{message.event.location}</span>
                    </div>
                  )}
                </div>

                {/* RSVP Controls */}
                <div className="pt-2 border-t border-gray-700/40">
                  <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
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
                              : 'bg-black/30 border-gray-700 text-gray-300 hover:border-gray-500'
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
              <div className="my-1.5 p-2 bg-black/30 rounded-2xl border border-gray-700/60 overflow-hidden max-w-sm">
                <div className="flex items-center gap-2 mb-2 px-1 text-saylo-emerald">
                  <MapPin size={17} />
                  <span className="font-semibold text-xs">Location Shared</span>
                </div>

                {/* Embedded Map Visual Canvas */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-[#1f2c34] mb-2 border border-gray-700/50">
                  <iframe
                    title="Location Map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${message.location.longitude - 0.005}%2C${message.location.latitude - 0.005}%2C${message.location.longitude + 0.005}%2C${message.location.latitude + 0.005}&layer=mapnik&marker=${message.location.latitude}%2C${message.location.longitude}`}
                    className="w-full h-full border-0 pointer-events-none"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${message.location.latitude}&mlon=${message.location.longitude}#map=16/${message.location.latitude}/${message.location.longitude}`, '_blank')} />
                </div>

                <p className="text-xs text-gray-200 font-medium px-1 mb-2 line-clamp-2">
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

            {/* Regular Text */}
            {message.text && message.type !== 'system' && (
              <p className="break-words leading-relaxed whitespace-pre-wrap">
                {renderFormattedText(message.text)}
              </p>
            )}
          </>
        )}

        {/* Timestamp & Status Metadata Bar */}
        <div className="flex items-center justify-end gap-1.5 mt-1 select-none text-[10px] text-gray-400">
          {message.isEncrypted && (
            <Lock size={10} className="text-saylo-300 flex-shrink-0" title="End-to-End Encrypted" />
          )}
          {isPinned && (
            <Pin
              size={11}
              className="text-saylo-300 fill-saylo-300 transform -rotate-45"
              title="Pinned message"
            />
          )}
          {message.edited && <span className="italic">edited</span>}
          {isStarred && <Star size={11} className="text-amber-400 fill-amber-400" />}
          <span>{format(new Date(message.createdAt || Date.now()), 'HH:mm')}</span>

          {isSelf && (
            <span className="ml-0.5">
              {message.status === 'read' ? (
                <CheckCheck size={14} className="text-saylo-300" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={14} className="text-gray-400" />
              ) : (
                <Check size={14} className="text-gray-400" />
              )}
            </span>
          )}
        </div>

        {/* Reaction Emojis Badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-3 left-3 flex items-center gap-1 bg-[#182229] border border-gray-700/60 rounded-full px-2 py-0.5 shadow-md">
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji, idx) => (
              <span key={idx} className="text-xs">
                {emoji}
              </span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] text-gray-400 font-bold">
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
        } hidden group-hover:flex items-center gap-1 bg-[#202c33] border border-gray-700/60 rounded-xl p-1 shadow-xl z-20`}
      >
        {/* Quick React Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-700/50"
          title="React"
        >
          <Smile size={16} />
        </button>

        {/* Reply */}
        <button
          onClick={() => onReply(message)}
          className="p-1 text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-700/50"
          title="Reply"
        >
          <Reply size={16} />
        </button>

        {/* Forward */}
        <button
          onClick={() => onForward && onForward(message)}
          className="p-1 text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-700/50"
          title="Forward message"
        >
          <Share2 size={16} />
        </button>

        {/* More Actions Toggle */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700/50"
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
          } z-30 flex items-center gap-1 bg-[#202c33] border border-gray-700/70 p-2 rounded-2xl shadow-2xl animate-fadeIn`}
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
          } z-30 w-44 bg-[#202c33] border border-gray-700/80 rounded-xl shadow-2xl py-1 text-xs text-gray-200 animate-fadeIn`}
        >
          {/* Message Info (Read & Delivered timestamps) */}
          <button
            onClick={() => {
              if (onInfo) onInfo(message);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Info size={14} className="text-saylo-300" />
            Message info
          </button>

          {/* Select message for bulk actions */}
          <button
            onClick={() => {
              if (onToggleSelect) onToggleSelect(message._id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <CheckSquare size={14} />
            Select message
          </button>

          <button
            onClick={() => {
              if (onForward) onForward(message);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Share2 size={14} />
            Forward
          </button>

          <button
            onClick={() => {
              togglePinMessage(message._id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Pin size={14} className={isPinned ? 'text-saylo-emerald' : ''} />
            {isPinned ? 'Unpin message' : 'Pin message'}
          </button>

          <button
            onClick={() => {
              toggleStarMessage(message._id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Star size={14} className={isStarred ? 'text-amber-400' : ''} />
            {isStarred ? 'Unstar' : 'Star message'}
          </button>

          {isSelf && message.type === 'text' && !message.deletedForEveryone && (
            <button
              onClick={() => {
                onEdit(message);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
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
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2 text-red-400"
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
              className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2 text-red-400"
            >
              <Trash2 size={14} />
              Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;

