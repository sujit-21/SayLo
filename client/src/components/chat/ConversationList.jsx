import React, { useState } from 'react';
import { Search, Plus, Users, Filter, Check, CheckCheck, Pin, VolumeX, Archive, Lock, Unlock, X } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { format, isToday, isYesterday } from 'date-fns';
import api from '../../services/api';

const ConversationList = ({ onOpenNewChat, onOpenNewGroup }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    activeTabFilter,
    setActiveTabFilter,
    searchQuery,
    setSearchQuery,
    fetchConversations,
  } = useChat();

  const { onlineUsers } = useSocket();
  const [contextMenu, setContextMenu] = useState(null); // { x, y, conversation }
  const [isLockedFolderOpen, setIsLockedFolderOpen] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Format timestamp for sidebar
  const formatSidebarTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yyyy');
  };

  // Filter conversations
  const lockedCount = conversations.filter((c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user?._id);
    return !!p?.isLocked;
  }).length;

  const filteredConversations = conversations.filter((c) => {
    const participant = c.participants?.find(
      (p) => (p.user?._id || p.user) === user?._id
    );

    // Filter out locked chats if folder is closed
    if (participant?.isLocked && !isLockedFolderOpen) {
      return false;
    }

    // Filter out archived unless viewing archived
    if (participant?.isArchived && activeTabFilter !== 'archived') {
      return false;
    }

    // Filter by tab
    if (activeTabFilter === 'unread' && (!participant?.unreadCount || participant.unreadCount === 0)) {
      return false;
    }
    if (activeTabFilter === 'groups' && !c.isGroup) {
      return false;
    }
    if (activeTabFilter === 'favorites' && !participant?.isPinned) {
      return false;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const chatName = (c.name || '').toLowerCase();
      const otherUser = c.participants?.find(
        (p) => (p.user?._id || p.user) !== user?._id
      )?.user;
      const otherUserName = (otherUser?.name || '').toLowerCase();
      const lastMsgText = (c.lastMessage?.text || '').toLowerCase();

      return chatName.includes(q) || otherUserName.includes(q) || lastMsgText.includes(q);
    }

    return true;
  });

  // Handle Participant Preference toggles
  const handleTogglePin = async (c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user._id);
    const newPinned = !p?.isPinned;
    await api.put(`/conversations/${c._id}/preference`, { isPinned: newPinned });
    fetchConversations();
    setContextMenu(null);
  };

  const handleToggleArchive = async (c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user._id);
    const newArchived = !p?.isArchived;
    await api.put(`/conversations/${c._id}/preference`, { isArchived: newArchived });
    fetchConversations();
    setContextMenu(null);
  };

  const handleToggleMute = async (c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user._id);
    const newMuted = !p?.isMuted;
    await api.put(`/conversations/${c._id}/preference`, { isMuted: newMuted });
    fetchConversations();
    setContextMenu(null);
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setPinError('');
    try {
      const res = await api.post('/auth/chat-lock-pin', {
        action: 'verify',
        enteredPin,
      });
      if (res.data.verified) {
        setIsLockedFolderOpen(true);
        setShowPinPrompt(false);
        setEnteredPin('');
      } else {
        setPinError('Incorrect PIN');
      }
    } catch (err) {
      setPinError('Verification error');
    }
  };

  return (
    <div
      className="w-full md:w-96 h-full bg-[#111b21] dark:bg-[#111b21] border-r border-gray-800 flex flex-col flex-shrink-0 select-none relative"
      onClick={() => setContextMenu(null)}
    >
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-100 tracking-wide">Chats</h1>

        <div className="flex items-center gap-2 text-gray-300">
          <button
            onClick={onOpenNewGroup}
            className="p-2 hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
            title="New Group"
          >
            <Users size={20} />
          </button>
          <button
            onClick={onOpenNewChat}
            className="p-2 hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
            title="New Chat"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-800/80">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full bg-[#202c33] border border-transparent rounded-xl pl-10 pr-4 py-2 text-xs text-gray-100 placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'groups', label: 'Groups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTabFilter === tab.id
                  ? 'bg-saylo-emerald text-white'
                  : 'bg-[#202c33] text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Locked Chats Folder */}
        {lockedCount > 0 && (
          <div
            onClick={() => {
              if (isLockedFolderOpen) {
                setIsLockedFolderOpen(false);
              } else {
                setShowPinPrompt(true);
              }
            }}
            className="flex items-center justify-between px-4 py-3 bg-[#182229] border-b border-gray-800 cursor-pointer hover:bg-[#202c33] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center">
                {isLockedFolderOpen ? <Unlock size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-100">Locked Chats</h4>
                <p className="text-[11px] text-gray-400">
                  {isLockedFolderOpen ? 'Unlocked • Tap to hide' : `${lockedCount} chat(s) protected`}
                </p>
              </div>
            </div>
            {isLockedFolderOpen && (
              <span className="text-[10px] text-saylo-emerald font-semibold uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <p className="text-xs text-gray-500 mb-3">No conversations found</p>
            <button
              onClick={onOpenNewChat}
              className="text-xs font-semibold text-saylo-emerald hover:underline"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isSelected = activeConversation?._id === c._id;
            const participant = c.participants?.find(
              (p) => (p.user?._id || p.user) === user?._id
            );

            // Determine title and avatar
            let chatName = c.name;
            let chatAvatar = c.avatar;
            let isOnline = false;

            if (!c.isGroup && !c.isNoteToSelf) {
              const other = c.participants?.find(
                (p) => (p.user?._id || p.user) !== user?._id
              )?.user;
              if (other) {
                chatName = other.name;
                chatAvatar = other.avatar;
                isOnline = onlineUsers.has(other._id?.toString());
              }
            } else if (c.isNoteToSelf) {
              chatName = 'Message Yourself';
            }

            const unreadCount = participant?.unreadCount || 0;
            const isPinned = participant?.isPinned;
            const isMuted = participant?.isMuted;

            // Last message text preview
            let lastText = 'No messages yet';
            let isLastSelf = false;
            let lastStatus = 'sent';

            if (c.lastMessage) {
              isLastSelf =
                c.lastMessage.sender?._id === user?._id ||
                c.lastMessage.sender === user?._id;
              lastStatus = c.lastMessage.status;

              if (c.lastMessage.deletedForEveryone) {
                lastText = 'This message was deleted';
              } else if (c.lastMessage.type === 'poll') {
                lastText = `📊 Poll: ${c.lastMessage.poll?.question || 'Poll'}`;
              } else if (c.lastMessage.type === 'image') {
                lastText = '📷 Photo';
              } else if (c.lastMessage.type === 'video') {
                lastText = '🎥 Video';
              } else if (c.lastMessage.type === 'voice') {
                lastText = '🎤 Voice note';
              } else if (c.lastMessage.type === 'document') {
                lastText = '📄 Document';
              } else {
                lastText = c.lastMessage.text || '';
              }
            }

            return (
              <div
                key={c._id}
                onClick={() => selectConversation(c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, conversation: c });
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-800/40 transition-colors ${
                  isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                }`}
              >
                <Avatar
                  src={chatAvatar}
                  name={chatName || 'Chat'}
                  size="md"
                  isOnline={isOnline}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-100 truncate">{chatName}</h3>
                    <span
                      className={`text-[11px] whitespace-nowrap ${
                        unreadCount > 0 ? 'text-saylo-emerald font-semibold' : 'text-gray-400'
                      }`}
                    >
                      {formatSidebarTime(c.lastMessageAt || c.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                      {isLastSelf && (
                        <span className="flex-shrink-0">
                          {lastStatus === 'read' ? (
                            <CheckCheck size={14} className="text-saylo-300" />
                          ) : (
                            <Check size={14} className="text-gray-400" />
                          )}
                        </span>
                      )}
                      <span className="truncate">{lastText}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isMuted && <VolumeX size={13} className="text-gray-500" />}
                      {isPinned && <Pin size={13} className="text-gray-400 fill-gray-400" />}
                      {unreadCount > 0 && (
                        <span className="bg-saylo-emerald text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu on Right Click */}
      {contextMenu && (
        <div
          className="fixed z-50 w-44 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl py-1 text-xs text-gray-200 animate-fadeIn"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleTogglePin(contextMenu.conversation)}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Pin size={14} />
            Toggle Pin
          </button>
          <button
            onClick={() => handleToggleMute(contextMenu.conversation)}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <VolumeX size={14} />
            Toggle Mute
          </button>
          <button
            onClick={() => handleToggleArchive(contextMenu.conversation)}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Archive size={14} />
            Archive chat
          </button>
        </div>
      )}

      {/* PIN Verification Modal */}
      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#202c33] p-6 rounded-3xl max-w-xs w-full text-center border border-gray-700 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-saylo-emerald/20 text-saylo-emerald flex items-center justify-center mb-3">
              <Lock size={22} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Enter Security PIN</h3>
            <p className="text-xs text-gray-400 mb-4">Enter your 4-digit PIN to access locked chats</p>

            {pinError && <p className="text-xs text-red-400 mb-3">{pinError}</p>}

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
                className="w-full text-center tracking-widest text-xl font-mono bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-saylo-emerald"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinPrompt(false);
                    setEnteredPin('');
                    setPinError('');
                  }}
                  className="flex-1 py-2 text-xs text-gray-400 hover:bg-white/5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;

