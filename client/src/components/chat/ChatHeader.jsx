import React, { useState } from 'react';
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
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';

const ChatHeader = ({
  onToggleSearch,
  onOpenInfoPanel,
  onOpenDisappearingModal,
  onOpenWallpaperModal,
  onOpenThemeModal,
  onOpenLockModal,
}) => {
  const { user } = useAuth();
  const { activeConversation, messages, deleteMessage, clearChat, getContactNickname } = useChat();
  const { onlineUsers, typingUsers } = useSocket();
  const { startCall } = useCall();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  // Export chat transcript to .txt file
  const handleExportChat = () => {
    let transcript = `SAYLO Chat Export: ${name}\nGenerated: ${new Date().toLocaleString()}\n----------------------------------------\n\n`;
    messages.forEach((m) => {
      const senderName = m.sender?.name || 'User';
      const time = format(new Date(m.createdAt || Date.now()), 'yyyy-MM-dd HH:mm');
      transcript += `[${time}] ${senderName}: ${m.text || `[Attachment: ${m.type}]`}\n`;
    });

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAYLO_chat_${name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDropdown(false);
  };

  return (
    <div className="h-16 bg-[#202c33] dark:bg-[#202c33] border-b border-gray-800 flex items-center justify-between px-4 z-20 select-none">
      {/* Contact info click opens info panel */}
      <div
        onClick={onOpenInfoPanel}
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 flex-1 min-w-0"
      >
        <Avatar src={avatar} name={name} size="md" isOnline={isOnline} />
        <div className="truncate">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-100 truncate">{name}</h3>
            {otherParticipant?.publicKey && (
              <span
                className="flex items-center gap-1 text-[10px] text-saylo-emerald bg-saylo-emerald/10 border border-saylo-emerald/20 px-1.5 py-0.5 rounded font-medium"
                title="End-to-End Encrypted with ECDH P-256 and AES-GCM 256"
              >
                <Lock size={10} />
                <span>E2EE</span>
              </span>
            )}
            {activeConversation.disappearingTimer > 0 && (
              <Clock size={13} className="text-saylo-emerald flex-shrink-0" title="Disappearing messages on" />
            )}
          </div>
          <p
            className={`text-xs truncate ${
              statusText === 'typing...' || statusText === 'online'
                ? 'text-saylo-emerald font-medium'
                : 'text-gray-400'
            }`}
          >
            {statusText}
          </p>
        </div>
      </div>

      {/* Header action buttons */}
      <div className="flex items-center gap-1 text-gray-400">
        {!activeConversation.isNoteToSelf && otherParticipant && (
          <>
            {/* Audio Call */}
            <button
              onClick={() => startCall(otherParticipant, 'audio', activeConversation._id)}
              className="p-2 hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
              title="Voice call"
            >
              <Phone size={19} />
            </button>

            {/* Video Call */}
            <button
              onClick={() => startCall(otherParticipant, 'video', activeConversation._id)}
              className="p-2 hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
              title="Video call"
            >
              <Video size={19} />
            </button>
          </>
        )}

        {/* Search within conversation */}
        <button
          onClick={onToggleSearch}
          className="p-2 hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
          title="Search in chat"
        >
          <Search size={19} />
        </button>

        {/* More options menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-white/5 rounded-full hover:text-white transition-colors"
            title="More options"
          >
            <MoreVertical size={19} />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-11 w-52 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl py-2 z-40 text-xs text-gray-200 animate-fadeIn"
              onMouseLeave={() => setShowDropdown(false)}
            >
              <button
                onClick={() => {
                  onOpenInfoPanel();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Info size={16} />
                Contact / Group info
              </button>

              <button
                onClick={() => {
                  onOpenDisappearingModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Clock size={16} />
                Disappearing messages
              </button>

              <button
                onClick={() => {
                  onOpenWallpaperModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Palette size={16} />
                Chat wallpaper
              </button>

              <button
                onClick={() => {
                  if (onOpenThemeModal) onOpenThemeModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Palette size={16} className="text-saylo-emerald" />
                Theme & bubble color
              </button>

              <button
                onClick={() => {
                  onOpenLockModal();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Lock size={16} />
                Lock chat
              </button>

              <button
                onClick={handleExportChat}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3"
              >
                <Download size={16} />
                Export chat
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowClearModal(true);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3 text-red-400"
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
    </div>
  );
};

export default ChatHeader;

