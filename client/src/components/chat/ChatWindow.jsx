import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import ChatInfoPanel from './ChatInfoPanel';
import NewPollModal from './NewPollModal';
import DisappearingModal from './DisappearingModal';
import LockChatModal from './LockChatModal';
import WallpaperModal from './WallpaperModal';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { Search, X } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';

const ChatWindow = () => {
  const { activeConversation, messages, loadingMessages, setReplyMessage, editMessage } = useChat();
  const { wallpaper } = useTheme();

  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [showPollModal, setShowPollModal] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeConversation?._id]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  if (!activeConversation) {
    return (
      <div className="flex-1 h-full bg-[#111b21] dark:bg-[#111b21] flex flex-col items-center justify-center p-6 text-center select-none border-l border-gray-800">
        <div className="w-24 h-24 mb-6 rounded-3xl bg-saylo-emerald/10 border border-saylo-emerald/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-saylo-emerald" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" fill="#00A884" fillOpacity="0.1" />
            <path
              d="M50 20C33.4315 20 20 33.4315 20 50C20 55.733 21.6115 61.0927 24.3975 65.6566L21 79L34.7431 75.402C39.1415 78.2917 44.3752 80 50 80C66.5685 80 80 66.5685 80 50C80 33.4315 66.5685 20 50 20Z"
              fill="#00A884"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">SAYLO for Web</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
          Send and receive messages in real time. Experience private 1-on-1 chats, group collaboration, voice notes, and HD calls.
        </p>
        <span className="text-xs text-saylo-400 flex items-center gap-1.5 font-medium">
          🔒 TLS Protected & Verified Messaging
        </span>
      </div>
    );
  }

  // Filter messages by search if search bar is open
  const filteredMessages = searchFilter.trim()
    ? messages.filter((m) =>
        m.text?.toLowerCase().includes(searchFilter.toLowerCase().trim())
      )
    : messages;

  // Format date dividers
  const renderDateDivider = (dateStr) => {
    const d = new Date(dateStr);
    let label = format(d, 'MMMM d, yyyy');
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';

    return (
      <div className="flex justify-center my-3 select-none">
        <span className="bg-[#182229] border border-gray-800 text-[11px] font-medium text-gray-400 px-3 py-1 rounded-lg shadow-sm">
          {label}
        </span>
      </div>
    );
  };

  // Background pattern class based on selected wallpaper
  let wallpaperClass = 'bg-chat-pattern-dark';
  if (wallpaper === 'midnight') wallpaperClass = 'bg-[#0b141a]';
  else if (wallpaper === 'emerald') wallpaperClass = 'bg-[#002a22]';
  else if (wallpaper === 'navy') wallpaperClass = 'bg-[#0a192f]';
  else if (wallpaper === 'charcoal') wallpaperClass = 'bg-[#18181b]';

  return (
    <div className="flex-1 h-full flex overflow-hidden">
      <div className="flex-1 h-full flex flex-col min-w-0 bg-[#0b141a] dark:bg-[#0b141a]">
        {/* Header */}
        <ChatHeader
          onToggleSearch={() => setShowSearch(!showSearch)}
          onOpenInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
          onOpenDisappearingModal={() => setShowDisappearingModal(true)}
          onOpenWallpaperModal={() => setShowWallpaperModal(true)}
          onOpenLockModal={() => setShowLockModal(true)}
        />

        {/* In-chat Search Banner */}
        {showSearch && (
          <div className="bg-[#202c33] px-4 py-2 border-b border-gray-800 flex items-center gap-3">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search messages in this chat..."
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchFilter('');
              }}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className={`flex-1 overflow-y-auto px-4 md:px-12 py-4 ${wallpaperClass}`}>
          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-xs bg-[#182229] text-gray-400 px-4 py-2 rounded-xl border border-gray-800">
                {searchFilter ? 'No matching messages found' : 'No messages yet. Send a message to start the conversation!'}
              </span>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const prevMsg = filteredMessages[idx - 1];
              const isDifferentDay =
                !prevMsg ||
                format(new Date(prevMsg.createdAt), 'yyyy-MM-dd') !==
                  format(new Date(msg.createdAt), 'yyyy-MM-dd');

              return (
                <React.Fragment key={msg._id || idx}>
                  {isDifferentDay && renderDateDivider(msg.createdAt)}
                  <MessageItem
                    message={msg}
                    onReply={(m) => setReplyMessage(m)}
                    onEdit={(m) => {
                      const newText = window.prompt('Edit your message:', m.text);
                      if (newText && newText !== m.text) {
                        editMessage(m._id, newText);
                      }
                    }}
                  />
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input composer */}
        <MessageInput onOpenPollModal={() => setShowPollModal(true)} />
      </div>

      {/* Slide-over Info Panel */}
      <ChatInfoPanel isOpen={showInfoPanel} onClose={() => setShowInfoPanel(false)} />

      {/* Modals */}
      <NewPollModal isOpen={showPollModal} onClose={() => setShowPollModal(false)} />
      <DisappearingModal
        isOpen={showDisappearingModal}
        onClose={() => setShowDisappearingModal(false)}
      />
      <LockChatModal isOpen={showLockModal} onClose={() => setShowLockModal(false)} />
      <WallpaperModal isOpen={showWallpaperModal} onClose={() => setShowWallpaperModal(false)} />
    </div>
  );
};

export default ChatWindow;
