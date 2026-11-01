import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, Filter, Check, CheckCheck, Pin, VolumeX, Archive, Lock, Unlock, X, Megaphone, MessageSquarePlus, Sparkles, Star } from 'lucide-react';
import Avatar from '../common/Avatar';
import BroadcastModal from './BroadcastModal';
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
    getContactNickname,
  } = useChat();

  const { onlineUsers, typingUsers } = useSocket();
  const [contextMenu, setContextMenu] = useState(null); // { x, y, conversation }
  const [isLockedFolderOpen, setIsLockedFolderOpen] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [chatLabels, setChatLabels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saylo_chat_labels')) || {};
    } catch {
      return {};
    }
  });

  // WhatsApp Real-Time Drafts Map
  const [draftsMap, setDraftsMap] = useState(() => {
    const map = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('saylo_draft_')) {
        const convId = key.replace('saylo_draft_', '');
        map[convId] = localStorage.getItem(key) || '';
      }
    }
    return map;
  });

  useEffect(() => {
    const handleDraftUpdate = (e) => {
      const { conversationId, draft } = e.detail || {};
      if (conversationId) {
        setDraftsMap((prev) => ({
          ...prev,
          [conversationId]: draft || '',
        }));
      }
    };
    window.addEventListener('saylo_draft_updated', handleDraftUpdate);
    return () => window.removeEventListener('saylo_draft_updated', handleDraftUpdate);
  }, []);

  // WhatsApp 2024 Dedicated Favorites Management
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saylo_favorite_chats')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleFavUpdate = (e) => {
      const { favorites: updatedFavs } = e.detail || {};
      if (Array.isArray(updatedFavs)) {
        setFavorites(updatedFavs);
      }
    };
    window.addEventListener('saylo_favorites_updated', handleFavUpdate);
    return () => window.removeEventListener('saylo_favorites_updated', handleFavUpdate);
  }, []);

  const handleToggleFavorite = (convId) => {
    let updated;
    if (favorites.includes(convId)) {
      updated = favorites.filter((id) => id !== convId);
    } else {
      updated = [...favorites, convId];
    }
    setFavorites(updated);
    localStorage.setItem('saylo_favorite_chats', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('saylo_favorites_updated', { detail: { favorites: updated } }));
    setContextMenu(null);
  };

  // WhatsApp 2024 Secret Code for Locked Chats
  const [secretCodeConfig, setSecretCodeConfig] = useState(() => ({
    enabled: localStorage.getItem('saylo_hide_locked_chats') === 'true',
    code: localStorage.getItem('saylo_chat_lock_secret_code') || '',
  }));

  useEffect(() => {
    const handleSecretUpdate = () => {
      setSecretCodeConfig({
        enabled: localStorage.getItem('saylo_hide_locked_chats') === 'true',
        code: localStorage.getItem('saylo_chat_lock_secret_code') || '',
      });
    };
    window.addEventListener('saylo_secret_code_updated', handleSecretUpdate);
    return () => window.removeEventListener('saylo_secret_code_updated', handleSecretUpdate);
  }, []);

  const isSecretCodeMatched = Boolean(
    secretCodeConfig.enabled &&
    secretCodeConfig.code &&
    searchQuery.trim().toLowerCase() === secretCodeConfig.code.toLowerCase()
  );

  const showBlueTicks = user?.privacy?.readReceipts !== false;

  const availableLabels = [
    { id: 'work', label: 'Work', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { id: 'personal', label: 'Personal', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { id: 'family', label: 'Family', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { id: 'vip', label: 'VIP', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { id: 'pending', label: 'Pending', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  ];

  const handleSetChatLabel = (convId, labelId) => {
    const updated = { ...chatLabels };
    if (!labelId) {
      delete updated[convId];
    } else {
      updated[convId] = labelId;
    }
    setChatLabels(updated);
    localStorage.setItem('saylo_chat_labels', JSON.stringify(updated));
    setContextMenu(null);
  };

  // WhatsApp Custom Chat Lists (2024/2025 feature)
  const [customLists, setCustomLists] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saylo_custom_chat_lists')) || [];
    } catch {
      return [];
    }
  });
  const [showCustomListModal, setShowCustomListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('📁');
  const [selectedConvIds, setSelectedConvIds] = useState([]);

  const handleSaveCustomList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const id = `list_${Date.now()}`;
    const updated = [
      ...customLists,
      {
        id,
        name: newListName.trim(),
        emoji: newListEmoji,
        conversationIds: selectedConvIds,
      },
    ];
    setCustomLists(updated);
    localStorage.setItem('saylo_custom_chat_lists', JSON.stringify(updated));
    setActiveTabFilter(id);
    setShowCustomListModal(false);
    setNewListName('');
    setSelectedConvIds([]);
  };

  const handleDeleteCustomList = (listId, e) => {
    e.stopPropagation();
    const updated = customLists.filter((l) => l.id !== listId);
    setCustomLists(updated);
    localStorage.setItem('saylo_custom_chat_lists', JSON.stringify(updated));
    if (activeTabFilter === listId) setActiveTabFilter('all');
  };

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

  const archivedCount = conversations.filter((c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user?._id);
    return !!p?.isArchived;
  }).length;

  const unreadChatsCount = conversations.filter((c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user?._id);
    return (p?.unreadCount || 0) > 0;
  }).length;

  const groupsCount = conversations.filter((c) => c.isGroup).length;

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
    if (activeTabFilter === 'favorites' && !participant?.isPinned && !favorites.includes(c._id)) {
      return false;
    }
    if (['work', 'personal', 'family', 'vip', 'pending'].includes(activeTabFilter)) {
      if (chatLabels[c._id] !== activeTabFilter) return false;
    }

    // Filter by custom list
    const customList = customLists.find((l) => l.id === activeTabFilter);
    if (customList) {
      if (!customList.conversationIds.includes(c._id)) return false;
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
  }).sort((a, b) => {
    const pA = a.participants?.find((p) => (p.user?._id || p.user) === user?._id)?.isPinned ? 1 : 0;
    const pB = b.participants?.find((p) => (p.user?._id || p.user) === user?._id)?.isPinned ? 1 : 0;
    if (pA !== pB) return pB - pA;
    return new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt);
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

  const handleToggleMute = async (c, hours = null) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user._id);
    const newMuted = !p?.isMuted;
    await api.put(`/conversations/${c._id}/preference`, {
      isMuted: newMuted,
      mutedDurationHours: hours,
    });
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

  // WhatsApp Meta AI Parity: Start/Open SAYLO AI Assistant
  const handleOpenSayloAi = async () => {
    try {
      const res = await api.post('/conversations/note-to-self');
      if (res.data.conversation) {
        await fetchConversations();
        selectConversation(res.data.conversation);
      }
    } catch (err) {
      console.error('Error starting SAYLO AI', err);
    }
  };

  return (
    <div
      className="w-full md:w-80 lg:w-96 h-full bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 select-none relative transition-colors duration-150"
      onClick={() => setContextMenu(null)}
    >
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide">Chats</h1>

        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
            title="New Broadcast List"
          >
            <Megaphone size={19} />
          </button>
          <button
            onClick={onOpenNewGroup}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
            title="New Group"
          >
            <Users size={20} />
          </button>
          <button
            onClick={onOpenNewChat}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full hover:text-saylo-emerald transition-colors"
            title="New Chat"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Search Bar & WhatsApp Meta AI Ring */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#111b21]">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask SAYLO AI or Search"
            className="w-full bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent rounded-xl pl-10 pr-10 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
          />
          {/* Animated WhatsApp Meta AI Gradient Ring */}
          <button
            type="button"
            onClick={handleOpenSayloAi}
            className="absolute right-2.5 p-1 rounded-full hover:scale-110 active:scale-95 transition-transform group"
            title="Ask SAYLO AI Assistant"
            aria-label="Ask SAYLO AI Assistant"
          >
            <div className="w-5 h-5 rounded-full p-[1.5px] bg-gradient-to-tr from-blue-500 via-purple-500 to-emerald-400 shadow-sm flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#202c33] flex items-center justify-center">
                <Sparkles size={11} className="text-saylo-emerald group-hover:rotate-12 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Filter Pills with WhatsApp Custom Chat Lists & '+' Button */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadChatsCount > 0 ? `Unread (${unreadChatsCount})` : 'Unread' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'groups', label: groupsCount > 0 ? `Groups (${groupsCount})` : 'Groups' },
            { id: 'work', label: '💼 Work' },
            { id: 'personal', label: '🌿 Personal' },
            { id: 'vip', label: '⭐ VIP' },
            { id: 'pending', label: '⏳ Pending' },
            ...customLists.map((l) => ({
              id: l.id,
              label: `${l.emoji} ${l.name}`,
              isCustom: true,
            })),
          ].map((tab) => (
            <div key={tab.id} className="relative flex-shrink-0 group/pill">
              <button
                onClick={() => setActiveTabFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTabFilter === tab.id
                    ? 'bg-saylo-emerald text-white shadow-sm'
                    : 'bg-[#f0f2f5] dark:bg-[#202c33] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.isCustom && (
                  <span
                    onClick={(e) => handleDeleteCustomList(tab.id, e)}
                    className="opacity-60 hover:opacity-100 hover:text-red-300 ml-0.5 text-[11px]"
                    title="Delete list"
                  >
                    ×
                  </span>
                )}
              </button>
            </div>
          ))}

          {/* WhatsApp '+' Add Custom List Button */}
          <button
            type="button"
            onClick={() => setShowCustomListModal(true)}
            className="p-1.5 px-2.5 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-saylo-emerald/15 text-gray-500 dark:text-gray-400 hover:text-saylo-emerald transition-colors flex items-center justify-center flex-shrink-0"
            title="Create Custom Chat List"
            aria-label="Create Custom Chat List"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-20">
        {/* WhatsApp 2024 Locked Chats Folder with Secret Code Support */}
        {lockedCount > 0 && (!secretCodeConfig.enabled || isSecretCodeMatched || isLockedFolderOpen) && (
          <div
            onClick={() => {
              if (isLockedFolderOpen) {
                setIsLockedFolderOpen(false);
              } else {
                setShowPinPrompt(true);
              }
            }}
            className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-colors ${
              isSecretCodeMatched
                ? 'bg-saylo-emerald/10 dark:bg-saylo-emerald/15 hover:bg-saylo-emerald/20 animate-fadeIn'
                : 'bg-gray-50 dark:bg-[#182229] hover:bg-gray-100 dark:hover:bg-[#202c33]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                  isSecretCodeMatched
                    ? 'bg-saylo-emerald text-white shadow-lg scale-105'
                    : 'bg-saylo-emerald/15 text-saylo-emerald'
                }`}
              >
                {isLockedFolderOpen || isSecretCodeMatched ? <Unlock size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Locked Chats</h4>
                  {isSecretCodeMatched && (
                    <span className="text-[10px] font-bold bg-saylo-emerald text-white px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      Code Match
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {isLockedFolderOpen
                    ? 'Unlocked • Tap to hide'
                    : isSecretCodeMatched
                    ? 'Revealed by Secret Code • Tap to open'
                    : `${lockedCount} chat(s) protected`}
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

        {/* WhatsApp Top Archived Chats Row */}
        {archivedCount > 0 && (
          <div
            onClick={() => setActiveTabFilter(activeTabFilter === 'archived' ? 'all' : 'archived')}
            className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-colors ${
              activeTabFilter === 'archived'
                ? 'bg-saylo-emerald/10 dark:bg-saylo-emerald/15'
                : 'bg-white dark:bg-[#111b21] hover:bg-gray-50 dark:hover:bg-[#202c33]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center">
                <Archive size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Archived</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {activeTabFilter === 'archived' ? 'Viewing archived • Tap to exit' : `${archivedCount} chat(s) archived`}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-saylo-emerald px-2 py-0.5 rounded-full bg-saylo-emerald/15">
              {archivedCount}
            </span>
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
                chatName = getContactNickname(other._id, other.name);
                chatAvatar = other.avatar;
                isOnline = onlineUsers.has(other._id?.toString());
              }
            } else if (c.isNoteToSelf) {
              chatName = 'Message Yourself';
            }

            const unreadCount = participant?.unreadCount || 0;
            const isPinned = participant?.isPinned;
            const isMuted = participant?.isMuted;

            // Draft message indicator (real-time synchronized)
            const draftText = draftsMap[c._id] ?? (localStorage.getItem(`saylo_draft_${c._id}`) || '');
            const hasDraft = draftText && draftText.trim().length > 0;

            // Typing indicator for this conversation
            const chatTyping = typingUsers?.[c._id];
            const isSomeoneTyping = Boolean(chatTyping && Object.keys(chatTyping).length > 0);

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
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800/40 transition-colors ${
                  isSelected
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
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
                    <div className="flex items-center gap-1.5 truncate mr-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{chatName}</h3>
                      {favorites.includes(c._id) && (
                        <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" title="Favorite Chat" />
                      )}
                      {chatLabels[c._id] && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider flex-shrink-0 ${
                            availableLabels.find((l) => l.id === chatLabels[c._id])?.bg || ''
                          }`}
                        >
                          {availableLabels.find((l) => l.id === chatLabels[c._id])?.label}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] whitespace-nowrap ${
                        unreadCount > 0 ? 'text-saylo-emerald font-semibold' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatSidebarTime(c.lastMessageAt || c.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs truncate">
                      {isSomeoneTyping ? (
                        <span className="truncate text-xs font-semibold text-saylo-emerald animate-pulse flex items-center gap-1">
                          <span>typing...</span>
                        </span>
                      ) : hasDraft ? (
                        <span className="truncate flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-saylo-emerald">Draft:</span>
                          <span className="text-gray-600 dark:text-gray-300 truncate">{draftText.trim()}</span>
                        </span>
                      ) : (
                        <>
                          {isLastSelf && (
                            <span className="flex-shrink-0">
                              {lastStatus === 'read' && showBlueTicks ? (
                                <CheckCheck size={14} className="text-[#53bdeb]" />
                              ) : lastStatus === 'delivered' || lastStatus === 'read' ? (
                                <CheckCheck size={14} className="text-gray-400" />
                              ) : (
                                <Check size={14} className="text-gray-400" />
                              )}
                            </span>
                          )}
                          <span className="truncate text-gray-600 dark:text-gray-400">{lastText}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isMuted && <VolumeX size={13} className="text-gray-400 dark:text-gray-500" />}
                      {isPinned && <Pin size={13} className="text-saylo-emerald fill-saylo-emerald transform -rotate-45" />}
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
          className="fixed z-50 w-48 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-2xl py-1 text-xs text-gray-800 dark:text-gray-200 animate-fadeIn"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleTogglePin(contextMenu.conversation)}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Pin size={14} />
            {contextMenu.conversation.participants?.find((p) => (p.user?._id || p.user) === user?._id)?.isPinned ? 'Unpin chat' : 'Pin chat'}
          </button>
          <button
            onClick={() => handleToggleFavorite(contextMenu.conversation._id)}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Star size={14} className={favorites.includes(contextMenu.conversation._id) ? "text-amber-400 fill-amber-400" : "text-amber-400"} />
            {favorites.includes(contextMenu.conversation._id) ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          {contextMenu.conversation.participants?.find((p) => (p.user?._id || p.user) === user?._id)?.isMuted ? (
            <button
              onClick={() => handleToggleMute(contextMenu.conversation)}
              className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
            >
              <VolumeX size={14} />
              Unmute chat
            </button>
          ) : (
            <div className="py-1 border-y border-gray-700/40">
              <span className="px-3 text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                Mute Notifications
              </span>
              <button
                onClick={() => handleToggleMute(contextMenu.conversation, 8)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-700/50 text-[11px] text-gray-200"
              >
                For 8 hours
              </button>
              <button
                onClick={() => handleToggleMute(contextMenu.conversation, 168)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-700/50 text-[11px] text-gray-200"
              >
                For 1 week
              </button>
              <button
                onClick={() => handleToggleMute(contextMenu.conversation, null)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-700/50 text-[11px] text-gray-200"
              >
                Always
              </button>
            </div>
          )}
          <button
            onClick={() => handleToggleArchive(contextMenu.conversation)}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Archive size={14} />
            {contextMenu.conversation.participants?.find((p) => (p.user?._id || p.user) === user?._id)?.isArchived ? 'Unarchive' : 'Archive chat'}
          </button>

          {/* Label Chat Menu */}
          <div className="py-1.5 border-t border-gray-700/40">
            <span className="px-3 text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
              Set Chat Label
            </span>
            <div className="grid grid-cols-2 gap-1 px-2.5 pb-1">
              {availableLabels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleSetChatLabel(contextMenu.conversation._id, l.id)}
                  className={`text-left px-2 py-1 rounded text-[11px] font-medium border ${l.bg} hover:opacity-80 transition-opacity`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {chatLabels[contextMenu.conversation._id] && (
              <button
                onClick={() => handleSetChatLabel(contextMenu.conversation._id, null)}
                className="w-full text-left px-3 py-1 text-[11px] text-red-400 hover:bg-gray-700/50"
              >
                Clear Label
              </button>
            )}
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#202c33] p-6 rounded-3xl max-w-xs w-full text-center border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-saylo-emerald/20 text-saylo-emerald flex items-center justify-center mb-3">
              <Lock size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Enter Security PIN</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Enter your 4-digit PIN to access locked chats</p>

            {pinError && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{pinError}</p>}

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
                className="w-full text-center tracking-widest text-xl font-mono bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-saylo-emerald"
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
                  className="flex-1 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"
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

      {/* WhatsApp Custom Chat List Creator Modal */}
      {showCustomListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#202c33] p-5 rounded-3xl max-w-sm w-full border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700/60">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create Custom List</h3>
              <button
                type="button"
                onClick={() => setShowCustomListModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomList} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  List Name
                </label>
                <div className="flex gap-2">
                  <select
                    value={newListEmoji}
                    onChange={(e) => setNewListEmoji(e.target.value)}
                    className="bg-gray-100 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-2 py-2 text-sm focus:outline-none"
                  >
                    {['📁', '🎓', '🏢', '🏠', '⚽', '🎯', '🚀', '💡', '🌟', '❤️', '✈️'].map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. College, Office, Project"
                    required
                    className="flex-1 bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-saylo-emerald"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Add Chats to this List ({selectedConvIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-gray-200 dark:border-gray-700/60 rounded-xl p-2 bg-gray-50/50 dark:bg-[#111b21]">
                  {conversations.map((c) => {
                    const other = c.participants?.find((p) => (p.user?._id || p.user) !== user?._id)?.user;
                    const cName = c.isGroup ? c.name : (other?.name || 'Chat');
                    const isChecked = selectedConvIds.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
                      >
                        <span className="truncate max-w-[200px] text-gray-800 dark:text-gray-200 font-medium">
                          {cName}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedConvIds((prev) => prev.filter((id) => id !== c._id));
                            } else {
                              setSelectedConvIds((prev) => [...prev, c._id]);
                            }
                          }}
                          className="rounded text-saylo-emerald focus:ring-saylo-emerald w-4 h-4"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomListModal(false)}
                  className="flex-1 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="flex-1 py-2 bg-saylo-emerald hover:bg-saylo-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
                >
                  Save List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />

      {/* WhatsApp Floating Action Button (New Chat / Contacts with Phone Numbers) */}
      <div className="fixed md:absolute bottom-20 md:bottom-6 right-5 md:right-6 z-40 pointer-events-auto">
        <button
          onClick={onOpenNewChat}
          className="w-[56px] h-[56px] md:w-[60px] md:h-[60px] rounded-full bg-[#00a884] hover:bg-[#029071] active:bg-[#008266] active:scale-90 text-white shadow-[0_6px_22px_rgba(0,168,132,0.6)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.85)] flex items-center justify-center transition-all duration-200 border-2 border-white/50 dark:border-white/20 ring-2 ring-black/10 dark:ring-white/10 group focus:outline-none"
          title="New Chat / Contacts"
          aria-label="New Chat / Contacts"
        >
          <MessageSquarePlus
            size={28}
            strokeWidth={2.5}
            className="text-white drop-shadow-sm group-hover:scale-110 transition-transform"
          />
        </button>
      </div>
    </div>
  );
};

export default ConversationList;

