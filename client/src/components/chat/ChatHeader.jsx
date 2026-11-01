import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Clock,
  Lock,
  Download,
  Trash2,
  Info,
  Palette,
  ArrowLeft,
  VolumeX,
  Volume2,
  Star,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import CallLinkModal from './CallLinkModal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';
import api from '../../services/api';

const ChatHeader = ({
  onToggleSearch,
  onOpenInfoPanel,
  onOpenDisappearingModal,
  onOpenWallpaperModal,
  onOpenThemeModal,
  onOpenLockModal,
}) => {
  const { user } = useAuth();
  const {
    activeConversation,
    setActiveConversation,
    fetchConversations,
    messages,
    deleteMessage,
    clearChat,
    getContactNickname,
  } = useChat();
  const { onlineUsers, typingUsers } = useSocket();
  const { startCall } = useCall();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showCallLinkModal, setShowCallLinkModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  // WhatsApp 2024 Dedicated Favorites Management
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('saylo_favorite_chats')) || [];
      return favs.includes(activeConversation?._id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('saylo_favorite_chats')) || [];
      setIsFavorite(favs.includes(activeConversation?._id));
    } catch {
      setIsFavorite(false);
    }
  }, [activeConversation?._id]);

  const handleToggleFavorite = () => {
    if (!activeConversation?._id) return;
    try {
      let favs = JSON.parse(localStorage.getItem('saylo_favorite_chats')) || [];
      if (favs.includes(activeConversation._id)) {
        favs = favs.filter((id) => id !== activeConversation._id);
        setIsFavorite(false);
      } else {
        favs.push(activeConversation._id);
        setIsFavorite(true);
      }
      localStorage.setItem('saylo_favorite_chats', JSON.stringify(favs));
      window.dispatchEvent(new CustomEvent('saylo_favorites_updated', { detail: { favorites: favs } }));
    } catch (err) {
      console.error(err);
    }
  };

  const myParticipant = activeConversation?.participants?.find(
    (p) => (p.user?._id || p.user) === user?._id
  );
  const isMuted = Boolean(
    myParticipant?.isMuted &&
      (!myParticipant.mutedUntil || new Date(myParticipant.mutedUntil) > new Date())
  );

  const handleToggleMute = async (hours = null) => {
    if (!activeConversation?._id) return;
    try {
      await api.put(`/conversations/${activeConversation._id}/preference`, {
        isMuted: !isMuted,
        mutedDurationHours: hours,
      });
      await fetchConversations();
      setShowDropdown(false);
      setShowMuteSubmenu(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBack = (e) => {
    e.stopPropagation();
    setActiveConversation(null);
    navigate('/chats', { replace: true });
  };

  const handleClearChat = async () => {
    if (!activeConversation?._id) return;
    try {
      setClearing(true);
      await clearChat(activeConversation._id);
      setShowClearModal(false);
    } catch (err) {
      alert('Failed to clear chat');
    } finally {
      setClearing(false);
    }
  };

  if (!activeConversation) return null;

  // Identify conversation target
  let name = activeConversation.name || 'Chat';
  let avatar = activeConversation.avatar;
  let isOnline = false;
  let statusText = '';
  let otherParticipant = null;

  if (activeConversation.isGroup) {
    statusText = `${activeConversation.participants?.length || 0} participants`;
  } else if (activeConversation.isNoteToSelf) {
    name = 'Message Yourself (You)';
    statusText = 'Message yourself, take notes & links';
  } else {
    // 1-on-1 direct
    otherParticipant = activeConversation.participants?.find(
      (p) => (p.user?._id || p.user) !== user?._id
    )?.user;

    if (otherParticipant) {
      name = getContactNickname(otherParticipant._id, otherParticipant.name);
      avatar = otherParticipant.avatar;
      isOnline = onlineUsers.has(otherParticipant._id?.toString());

      // Check if other participant is currently typing
      const chatTyping = typingUsers[activeConversation._id];
      if (chatTyping && Object.keys(chatTyping).length > 0) {
        statusText = 'typing...';
      } else if (isOnline) {
        statusText = 'online';
      } else if (otherParticipant.lastSeen) {
        statusText = `last seen ${format(new Date(otherParticipant.lastSeen), 'HH:mm')}`;
      }
    }
  }

  // Export chat transcript to formatted .txt file (WhatsApp style)
  const handleExportChat = () => {
    let transcript = `SAYLO Chat Export: ${name}\nGenerated: ${new Date().toLocaleString()}\nMessages and calls are end-to-end encrypted on SAYLO.\n----------------------------------------\n\n`;
    messages.forEach((m) => {
      const senderName =
        m.sender?._id === user?._id || m.sender === user?._id
          ? 'You'
          : m.sender?.name || 'User';
      const time = format(new Date(m.createdAt || Date.now()), 'dd/MM/yyyy, HH:mm:ss');
      let content = m.text || '';
      if (m.type === 'image') content = `[Image: ${m.fileUrl || 'Photo'}] ${m.caption || ''}`.trim();
      else if (m.type === 'video') content = `[Video: ${m.fileUrl || 'Video'}] ${m.caption || ''}`.trim();
      else if (m.type === 'audio') content = `[Voice Note: ${m.duration ? m.duration + 's' : 'Audio'}]`;
      else if (m.type === 'document') content = `[Document: ${m.fileName || 'File'}]`;
      else if (m.type === 'location') content = `[Location: ${m.location?.address || 'Pinned Location'}]`;
      else if (m.type === 'contact') content = `[Contact Card: ${m.contact?.name || 'Contact'}]`;
      else if (!content && m.fileUrl) content = `[Attachment: ${m.fileUrl}]`;

      transcript += `[${time}] ${senderName}: ${content}\n`;
    });

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAYLO_chat_${name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDropdown(false);
  };

  return (
    <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 md:px-4 z-20 select-none transition-colors duration-150">
      {/* Back button & Contact info */}
      <div className="flex items-center gap-2 md:gap-2.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          className="p-1.5 -ml-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center flex-shrink-0"
          title="Back to chat list"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          onClick={onOpenInfoPanel}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 flex-1 min-w-0"
        >
          <Avatar src={avatar} name={name} size="md" isOnline={isOnline} />
        <div className="truncate">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</h3>
            {otherParticipant?.username && (
              <span className="text-[11px] font-mono text-saylo-emerald/90 dark:text-saylo-400 font-normal">
                @{otherParticipant.username}
              </span>
            )}
            {isMuted && (
              <VolumeX size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" title="Notifications muted" />
            )}
            {activeConversation.disappearingTimer > 0 && (
              <Clock size={13} className="text-saylo-emerald flex-shrink-0" title="Disappearing messages on" />
            )}
          </div>
          <p
            className={`text-xs truncate ${
              statusText === 'typing...' || statusText === 'online'
                ? 'text-saylo-emerald font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {statusText}
          </p>
        </div>
      </div>
    </div>

      {/* Header action buttons */}
      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        {!activeConversation.isNoteToSelf && otherParticipant && (
          <>
            {/* Audio Call */}
            <button
              onClick={() => startCall(otherParticipant, 'audio', activeConversation._id)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
              title="Voice call"
            >
              <Phone size={19} />
            </button>

            {/* Video Call */}
            <button
              onClick={() => startCall(otherParticipant, 'video', activeConversation._id)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
              title="Video call"
            >
              <Video size={19} />
            </button>
          </>
        )}

        {/* Group Call Button */}
        {activeConversation.isGroup && (
          <button
            onClick={() => setShowCallLinkModal(true)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
            title="Start group voice or video call"
          >
            <Phone size={19} />
          </button>
        )}

        {/* Search within conversation */}
        <button
          onClick={onToggleSearch}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
          title="Search in chat"
        >
          <Search size={19} />
        </button>

        {/* WhatsApp 2024 Favorite Chat Toggle */}
        <button
          onClick={handleToggleFavorite}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-transform active:scale-90"
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          aria-label="Toggle Favorite"
        >
          <Star
            size={19}
            className={
              isFavorite
                ? 'text-amber-400 fill-amber-400 animate-in zoom-in-50 duration-200'
                : 'text-gray-500 dark:text-gray-400 hover:text-amber-400'
            }
          />
        </button>

        {/* More options menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-gray-900 dark:hover:text-white transition-colors"
            title="More options"
          >
            <MoreVertical size={19} />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-11 w-52 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-2xl py-2 z-40 text-xs text-gray-800 dark:text-gray-200 animate-fadeIn"
              onMouseLeave={() => setShowDropdown(false)}
            >
              <button
                onClick={() => {
                  onOpenInfoPanel();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Info size={16} />
                Contact / Group info
              </button>

              {/* Mute / Unmute Notifications */}
              {isMuted ? (
                <button
                  onClick={() => handleToggleMute()}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
                >
                  <Volume2 size={16} />
                  Unmute notifications
                </button>
              ) : (
                <div className="py-1 border-y border-gray-100 dark:border-gray-700/40">
                  <span className="px-4 text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                    Mute Notifications
                  </span>
                  <button
                    onClick={() => handleToggleMute(8)}
                    className="w-full text-left px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[11px] text-gray-700 dark:text-gray-200"
                  >
                    For 8 hours
                  </button>
                  <button
                    onClick={() => handleToggleMute(168)}
                    className="w-full text-left px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[11px] text-gray-700 dark:text-gray-200"
                  >
                    For 1 week
                  </button>
                  <button
                    onClick={() => handleToggleMute(null)}
                    className="w-full text-left px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-[11px] text-gray-700 dark:text-gray-200"
                  >
                    Always
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  onOpenDisappearingModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Clock size={16} />
                Disappearing messages
              </button>

              <button
                onClick={() => {
                  onOpenWallpaperModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Palette size={16} />
                Chat wallpaper
              </button>

              <button
                onClick={() => {
                  if (onOpenThemeModal) onOpenThemeModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Palette size={16} className="text-saylo-emerald" />
                Theme & bubble color
              </button>

              <button
                onClick={() => {
                  onOpenLockModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Lock size={16} />
                Lock chat
              </button>

              <button
                onClick={handleExportChat}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Download size={16} />
                Export chat
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowClearModal(true);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 text-red-500"
              >
                <Trash2 size={16} />
                Clear chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Chat?"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            Are you sure you want to clear all messages in this chat? This will remove all messages from your conversation thread.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowClearModal(false)}
              className="px-4 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={clearing}
              onClick={handleClearChat}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors"
            >
              {clearing ? 'Clearing...' : 'Clear Chat'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Group Call Link Modal */}
      <CallLinkModal
        isOpen={showCallLinkModal}
        onClose={() => setShowCallLinkModal(false)}
      />
    </div>
  );
};

export default ChatHeader;

