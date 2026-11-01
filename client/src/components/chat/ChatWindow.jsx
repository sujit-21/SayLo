import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import ChatInfoPanel from './ChatInfoPanel';
import NewPollModal from './NewPollModal';
import NewEventModal from './NewEventModal';
import DisappearingModal from './DisappearingModal';
import LockChatModal from './LockChatModal';
import WallpaperModal from './WallpaperModal';
import ForwardModal from './ForwardModal';
import MessageInfoModal from './MessageInfoModal';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import MediaLightboxModal from './MediaLightboxModal';
import ScheduleMessageModal from './ScheduleMessageModal';
import ShareContactModal from './ShareContactModal';
import ChatThemeModal from './ChatThemeModal';
import ImageDoodleEditor from './ImageDoodleEditor';
import WhatsAppCameraModal from './WhatsAppCameraModal';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Pin,
  UploadCloud,
  Share2,
  Trash2,
  Keyboard,
  CheckSquare,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';

const ChatWindow = () => {
  const {
    activeConversation,
    messages,
    loadingMessages,
    setReplyMessage,
    editMessage,
    sendMessage,
    deleteMessage,
  } = useChat();
  const { wallpaper, theme } = useTheme();

  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareContactModal, setShowShareContactModal] = useState(false);
  const [lightboxData, setLightboxData] = useState(null); // { url, name, type }
  const [doodleImageFile, setDoodleImageFile] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [customTheme, setCustomTheme] = useState('default');

  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [forwardingMessages, setForwardingMessages] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [activePinIndex, setActivePinIndex] = useState(0);

  // Multi-message select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploadingDrop, setIsUploadingDrop] = useState(false);

  const messagesEndRef = useRef(null);
  const chatStreamRef = useRef(null);

  // Auto-scroll to bottom on chat change or new message
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!searchFilter.trim()) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  // Handle Drag & Drop / Clipboard file upload
  const uploadAndSendFile = async (file, caption = '', isViewOnce = false, isHd = true) => {
    if (!file || !activeConversation) return;
    setIsUploadingDrop(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url, name, mimeType, size } = res.data.file;
      let msgType = 'document';
      if (mimeType.startsWith('image/')) msgType = 'image';
      else if (mimeType.startsWith('video/')) msgType = 'video';
      else if (mimeType.startsWith('audio/')) msgType = 'audio';

      await sendMessage({
        type: msgType,
        mediaUrl: url,
        mediaName: name,
        mediaMimeType: mimeType,
        mediaSize: size,
        text: caption || undefined,
        viewOnce: isViewOnce,
        isHdQuality: isHd,
      });
    } catch (err) {
      console.error('File drop/paste failed', err);
      alert('Failed to send file. Please try again.');
    } finally {
      setIsUploadingDrop(false);
    }
  };

  // Clipboard Paste listener (Ctrl + V for images/files)
  useEffect(() => {
    const handlePaste = (e) => {
      const targetTag = e.target?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            uploadAndSendFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeConversation?._id]);

  // Global Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle Keyboard Shortcuts modal on Ctrl + / or ? (when not inside an input)
      const targetTag = e.target?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      if ((e.ctrlKey && e.key === '/') || (!isInput && e.key === '?')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }

      // Exit select mode on Escape
      if (e.key === 'Escape') {
        if (isSelectMode) {
          setIsSelectMode(false);
          setSelectedMessageIds([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectMode]);

  // Bulk actions handlers
  const handleToggleSelectMessage = (msgId) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedMessageIds([msgId]);
      return;
    }

    setSelectedMessageIds((prev) => {
      if (prev.includes(msgId)) {
        const next = prev.filter((id) => id !== msgId);
        if (next.length === 0) setIsSelectMode(false);
        return next;
      } else {
        return [...prev, msgId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedMessageIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedMessageIds.length} selected message(s)?`
      )
    ) {
      return;
    }

    for (const id of selectedMessageIds) {
      try {
        await deleteMessage(id, false);
      } catch (e) {
        console.error(e);
      }
    }
    setIsSelectMode(false);
    setSelectedMessageIds([]);
  };

  const handleBulkForward = () => {
    const selectedObjs = messages.filter((m) => selectedMessageIds.includes(m._id));
    if (selectedObjs.length > 0) {
      setForwardingMessages(selectedObjs);
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 h-full bg-[#f0f2f5] dark:bg-[#111b21] flex flex-col items-center justify-center p-6 text-center select-none border-l border-gray-200 dark:border-gray-800">
        <div className="w-24 h-24 mb-6 rounded-3xl bg-saylo-emerald/10 border border-saylo-emerald/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-saylo-emerald" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" fill="#00A884" fillOpacity="0.1" />
            <path
              d="M50 20C33.4315 20 20 33.4315 20 50C20 55.733 21.6115 61.0927 24.3975 65.6566L21 79L34.7431 75.402C39.1415 78.2917 44.3752 80 50 80C66.5685 80 80 66.5685 80 50C80 33.4315 66.5685 20 50 20Z"
              fill="#00A884"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">SAYLO for Web</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
          Send and receive messages in real time. Experience private 1-on-1 chats, group collaboration, voice notes, and HD calls.
        </p>
      </div>
    );
  }

  // Find all messages matching the search filter
  const matchingMessages = searchFilter.trim()
    ? messages.filter((m) =>
        Boolean(m?.text && typeof m.text === 'string' && m.text.toLowerCase().includes(searchFilter.toLowerCase().trim()))
      )
    : [];

  // Pinned messages in this conversation
  const pinnedMessages = messages.filter((m) => !!m.pinned);

  // WhatsApp 2024 Media Lightbox Gallery List
  const conversationMedia = useMemo(() => {
    return messages.filter(
      (m) => (m.type === 'image' || m.type === 'video') && m.mediaUrl
    );
  }, [messages]);

  // Jump to active matched message
  const jumpToMatch = (idx) => {
    if (matchingMessages.length === 0) return;
    const targetMsg = matchingMessages[idx];
    if (targetMsg) {
      const el = document.getElementById(`msg-${targetMsg._id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleNextMatch = () => {
    if (matchingMessages.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchingMessages.length;
    setCurrentMatchIndex(nextIdx);
    jumpToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (matchingMessages.length === 0) return;
    const prevIdx =
      (currentMatchIndex - 1 + matchingMessages.length) % matchingMessages.length;
    setCurrentMatchIndex(prevIdx);
    jumpToMatch(prevIdx);
  };

  // Format date dividers
  const renderDateDivider = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    let label = '';
    try {
      if (isToday(d)) label = 'Today';
      else if (isYesterday(d)) label = 'Yesterday';
      else label = format(d, 'MMMM d, yyyy');
    } catch {
      label = '';
    }

    if (!label) return null;

    return (
      <div className="flex justify-center my-3 select-none">
        <span className="bg-white/90 dark:bg-[#182229] border border-gray-200 dark:border-gray-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg shadow-sm">
          {label}
        </span>
      </div>
    );
  };

  // Background pattern class based on selected per-chat or global wallpaper & theme
  const effectiveWallpaper =
    (activeConversation?._id && localStorage.getItem(`saylo_wallpaper_${activeConversation._id}`)) ||
    wallpaper;

  let wallpaperClass = theme === 'dark' ? 'bg-chat-pattern-dark' : 'bg-chat-pattern-light';
  if (effectiveWallpaper === 'midnight') wallpaperClass = 'bg-[#0b141a]';
  else if (effectiveWallpaper === 'emerald') wallpaperClass = 'bg-[#002a22]';
  else if (effectiveWallpaper === 'navy') wallpaperClass = 'bg-[#0a192f]';
  else if (effectiveWallpaper === 'charcoal') wallpaperClass = 'bg-[#18181b]';
  else if (effectiveWallpaper === 'nebula') wallpaperClass = 'bg-gradient-to-br from-[#1e1b4b] via-[#31104b] to-[#0b141a]';
  else if (effectiveWallpaper === 'sunset') wallpaperClass = 'bg-gradient-to-br from-[#451a03] via-[#78350f] to-[#0f172a]';
  else if (effectiveWallpaper === 'slate') wallpaperClass = 'bg-[#1e293b]';

  return (
    <div
      className="flex-1 h-full flex overflow-hidden relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer?.files?.[0]) {
          uploadAndSendFile(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-[#0b141a]/90 backdrop-blur-sm border-2 border-dashed border-saylo-emerald flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <UploadCloud size={48} className="text-saylo-emerald mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-gray-100">Drop files here to send</h3>
          <p className="text-xs text-gray-400 mt-1">Photos, videos, audio, and documents</p>
        </div>
      )}

      {/* Uploading Spinner Overlay */}
      {isUploadingDrop && (
        <div className="absolute top-4 right-4 z-40 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-800 dark:text-gray-200 font-medium">Sending dropped file...</span>
        </div>
      )}

      <div className="flex-1 h-full flex flex-col min-w-0 bg-[#efeae2] dark:bg-[#0b141a] transition-colors duration-150">
        {/* Header */}
        <ChatHeader
          onToggleSearch={() => {
            setShowSearch(!showSearch);
            if (showSearch) {
              setSearchFilter('');
              setCurrentMatchIndex(0);
            }
          }}
          onOpenInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
          onOpenDisappearingModal={() => setShowDisappearingModal(true)}
          onOpenWallpaperModal={() => setShowWallpaperModal(true)}
          onOpenThemeModal={() => setShowThemeModal(true)}
          onOpenLockModal={() => setShowLockModal(true)}
        />

        {/* Group Description Announcement Banner */}
        {activeConversation.isGroup && activeConversation.description && (
          <div className="bg-[#182229] border-b border-gray-800/80 px-4 py-2 flex items-center justify-between text-xs text-gray-300 animate-fadeIn">
            <div className="flex items-center gap-2 truncate flex-1 mr-3">
              <span className="text-saylo-emerald font-semibold flex items-center gap-1 flex-shrink-0">
                <Info size={14} /> Group Info:
              </span>
              <span className="truncate text-gray-300 font-normal">
                {activeConversation.description}
              </span>
            </div>
            <button
              onClick={() => setShowInfoPanel(true)}
              className="text-[11px] text-saylo-emerald hover:underline font-semibold flex-shrink-0"
            >
              View Info
            </button>
          </div>
        )}

        {/* In-Chat Message Search Bar */}
        {showSearch && (
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                placeholder="Search messages in this chat..."
                className="w-full bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 text-xs">
              {searchFilter.trim() && (
                <span className="text-[11px] text-gray-400">
                  {matchingMessages.length > 0
                    ? `${currentMatchIndex + 1} of ${matchingMessages.length}`
                    : '0 of 0'}
                </span>
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMatch}
                  disabled={matchingMessages.length === 0}
                  className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30 hover:bg-white/5"
                  title="Previous match"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMatch}
                  disabled={matchingMessages.length === 0}
                  className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30 hover:bg-white/5"
                  title="Next match"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchFilter('');
                  setCurrentMatchIndex(0);
                }}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
                title="Close search"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Pinned Messages Top Banner (Multi-Pin Carousel) */}
        {pinnedMessages.length > 0 && (() => {
          const safePinIndex = ((activePinIndex % pinnedMessages.length) + pinnedMessages.length) % pinnedMessages.length;
          const currentPinned = pinnedMessages[safePinIndex];
          if (!currentPinned) return null;
          return (
            <div className="bg-[#182229] border-b border-gray-800 px-4 py-2 flex items-center justify-between z-10 animate-fadeIn">
              <div
                onClick={() => {
                  if (currentPinned._id) {
                    document
                      .getElementById(`msg-${currentPinned._id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="flex items-center gap-2.5 truncate flex-1 cursor-pointer hover:opacity-90"
              >
                <Pin
                  size={14}
                  className="text-saylo-emerald fill-saylo-emerald flex-shrink-0 transform -rotate-45"
                />
                <div className="truncate text-xs">
                  <span className="font-semibold text-saylo-300 mr-2">
                    Pinned {pinnedMessages.length > 1 ? `(${safePinIndex + 1}/${pinnedMessages.length})` : ''}:
                  </span>
                  <span className="text-gray-300 truncate">
                    {currentPinned.text || `[Attachment: ${currentPinned.type || 'Media'}]`}
                  </span>
                  {currentPinned.pinnedDurationHours && (
                    <span className="ml-2 text-[10px] text-saylo-300 bg-saylo-emerald/20 border border-saylo-emerald/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      ⏱️ {currentPinned.pinnedDurationHours < 48 ? '24h' : currentPinned.pinnedDurationHours <= 168 ? '7d' : '30d'}
                    </span>
                  )}
                </div>
              </div>

              {pinnedMessages.length > 1 && (
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
                    title="Previous pinned message"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinIndex((prev) => (prev + 1) % pinnedMessages.length);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5"
                    title="Next pinned message"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Messages Stream */}
        <div
          ref={chatStreamRef}
          className={`flex-1 overflow-y-auto px-4 md:px-12 py-4 ${wallpaperClass}`}
        >
          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-xs bg-[#182229] text-gray-400 px-4 py-2 rounded-xl border border-gray-800">
                No messages yet. Send a message to start the conversation!
              </span>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              let isDifferentDay = !prevMsg;
              if (prevMsg && prevMsg.createdAt && msg.createdAt) {
                try {
                  const prevD = new Date(prevMsg.createdAt);
                  const currD = new Date(msg.createdAt);
                  if (!isNaN(prevD.getTime()) && !isNaN(currD.getTime())) {
                    isDifferentDay = format(prevD, 'yyyy-MM-dd') !== format(currD, 'yyyy-MM-dd');
                  }
                } catch {
                  isDifferentDay = false;
                }
              }

              const isMatch = Boolean(
                searchFilter.trim() &&
                msg?.text &&
                typeof msg.text === 'string' &&
                msg.text.toLowerCase().includes(searchFilter.toLowerCase().trim())
              );

              const isCurrentActiveMatch =
                isMatch &&
                matchingMessages[currentMatchIndex]?._id === msg._id;

              return (
                <React.Fragment key={msg._id || idx}>
                  {isDifferentDay && renderDateDivider(msg.createdAt)}
                  <div id={`msg-${msg._id}`}>
                    <MessageItem
                      message={msg}
                      onReply={(m) => setReplyMessage(m)}
                      onEdit={(m) => {
                        const newText = window.prompt('Edit your message:', m.text);
                        if (newText && newText !== m.text) {
                          editMessage(m._id, newText);
                        }
                      }}
                      onForward={(m) => setForwardingMessage(m)}
                      onInfo={(m) => setInfoMessage(m)}
                      onOpenMedia={(url, name, type) => setLightboxData({ url, name, type })}
                      onToggleSelect={handleToggleSelectMessage}
                      isSelectMode={isSelectMode}
                      isSelected={selectedMessageIds.includes(msg._id)}
                      searchQuery={searchFilter}
                      isHighlighted={isCurrentActiveMatch}
                      customTheme={customTheme}
                    />
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Bulk Action Bar when messages are selected */}
        {isSelectMode && (
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-700/80 px-6 py-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom duration-150 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedMessageIds([]);
                }}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                title="Cancel selection"
              >
                <X size={18} />
              </button>
              <span className="text-sm font-semibold text-gray-100">
                {selectedMessageIds.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkForward}
                disabled={selectedMessageIds.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium disabled:opacity-40 transition-colors"
                title="Forward selected messages"
              >
                <Share2 size={15} />
                <span>Forward</span>
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={selectedMessageIds.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium disabled:opacity-40 transition-colors"
                title="Delete selected messages"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Input composer (hidden during bulk select mode) */}
        {!isSelectMode && (
          <MessageInput
            onOpenPollModal={() => setShowPollModal(true)}
            onOpenEventModal={() => setShowEventModal(true)}
            onOpenScheduleModal={() => setShowScheduleModal(true)}
            onOpenShareContactModal={() => setShowShareContactModal(true)}
            onOpenDoodleEditor={(file) => setDoodleImageFile(file)}
            onOpenCamera={() => setShowCameraModal(true)}
          />
        )}
      </div>

      {/* Slide-over Info Panel with Media Gallery */}
      <ChatInfoPanel
        isOpen={showInfoPanel}
        onClose={() => setShowInfoPanel(false)}
        onOpenMedia={(url, name, type) => setLightboxData({ url, name, type })}
      />

      {/* Modals */}
      <NewPollModal isOpen={showPollModal} onClose={() => setShowPollModal(false)} />
      <NewEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
      <DisappearingModal
        isOpen={showDisappearingModal}
        onClose={() => setShowDisappearingModal(false)}
      />
      <LockChatModal isOpen={showLockModal} onClose={() => setShowLockModal(false)} />
      <WallpaperModal isOpen={showWallpaperModal} onClose={() => setShowWallpaperModal(false)} />

      {/* Custom Chat Theme Modal */}
      <ChatThemeModal
        isOpen={showThemeModal}
        currentTheme={customTheme}
        onClose={() => setShowThemeModal(false)}
        onSelectTheme={(themeId) => setCustomTheme(themeId)}
      />

      {/* Schedule Message Modal */}
      <ScheduleMessageModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={async (scheduledText, scheduledTimeISO) => {
          try {
            await sendMessage({
              text: scheduledText,
              type: 'text',
              scheduledFor: scheduledTimeISO,
            });
            alert('Message scheduled successfully!');
          } catch (err) {
            console.error('Failed to schedule message', err);
            alert('Failed to schedule message');
          }
        }}
      />

      {/* Share Contact Card Modal */}
      <ShareContactModal
        isOpen={showShareContactModal}
        onClose={() => setShowShareContactModal(false)}
        onShareContact={async (contactCard) => {
          try {
            await sendMessage({
              type: 'contact',
              text: `Contact Card: ${contactCard.name}`,
              contactCard,
            });
          } catch (err) {
            console.error('Failed to share contact card', err);
          }
        }}
      />

      {/* Media Lightbox Gallery Modal with WhatsApp Gallery Slider */}
      {(() => {
        const currentMediaIndex = lightboxData?.url
          ? conversationMedia.findIndex((m) => m.mediaUrl === lightboxData.url)
          : -1;

        return (
          <MediaLightboxModal
            isOpen={!!lightboxData}
            mediaUrl={lightboxData?.url}
            mediaName={lightboxData?.name}
            mediaType={lightboxData?.type}
            mediaList={conversationMedia}
            currentIndex={currentMediaIndex !== -1 ? currentMediaIndex : 0}
            onNavigate={(newIdx) => {
              const target = conversationMedia[newIdx];
              if (target) {
                setLightboxData({
                  url: target.mediaUrl,
                  name: target.mediaName,
                  type: target.type,
                });
              }
            }}
            onClose={() => setLightboxData(null)}
            onForward={() => {
              const matching = messages.find((m) => m.mediaUrl === lightboxData?.url);
              if (matching) {
                setForwardingMessage(matching);
              }
              setLightboxData(null);
            }}
          />
        );
      })()}

      {/* Image Doodle & Photo Canvas Editor */}
      <ImageDoodleEditor
        isOpen={!!doodleImageFile}
        imageFile={doodleImageFile}
        onClose={() => setDoodleImageFile(null)}
        onSave={(editedFile) => {
          uploadAndSendFile(editedFile);
          setDoodleImageFile(null);
        }}
      />

      {/* WhatsApp Live Camera, Filters, Editor & Instant Send Modal */}
      <WhatsAppCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onSendPhoto={({ file, caption, viewOnce, isHd }) => {
          uploadAndSendFile(file, caption, viewOnce, isHd);
        }}
      />

      {/* Message Info Modal (Read & Delivery receipts) */}
      <MessageInfoModal
        isOpen={!!infoMessage}
        message={infoMessage}
        onClose={() => setInfoMessage(null)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Single Message Forward Modal */}
      <ForwardModal
        isOpen={!!forwardingMessage}
        message={forwardingMessage}
        onClose={() => setForwardingMessage(null)}
      />

      {/* Bulk Messages Forward Modal */}
      <ForwardModal
        isOpen={!!forwardingMessages}
        messages={forwardingMessages}
        onClose={() => {
          setForwardingMessages(null);
          setIsSelectMode(false);
          setSelectedMessageIds([]);
        }}
      />
    </div>
  );
};

export default ChatWindow;
