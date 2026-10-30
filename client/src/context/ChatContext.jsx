import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { sound } from '../utils/sound';
import { getSharedKey, encryptTextMessage, decryptTextMessage } from '../utils/e2ee';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, e2eeKeyPair } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all', 'unread', 'favorites', 'groups'
  const [searchQuery, setSearchQuery] = useState('');
  const [contactNotes, setContactNotes] = useState({});
  const activeConversationRef = useRef(activeConversation);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch private contact notes & nicknames
  const fetchContactNotes = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/users/contacts/notes');
      if (res.data?.contactNotes) {
        const notesMap = {};
        res.data.contactNotes.forEach((n) => {
          const uId = (n.user?._id || n.user)?.toString();
          if (uId) {
            notesMap[uId] = { nickname: n.nickname || '', notes: n.notes || '' };
          }
        });
        setContactNotes(notesMap);
      }
    } catch (err) {
      console.error('Failed to fetch contact notes', err);
    }
  }, [user]);

  useEffect(() => {
    fetchContactNotes();
  }, [fetchContactNotes]);

  const updateContactNote = async (contactId, nickname, notes) => {
    try {
      const res = await api.post('/users/contacts/notes', { contactId, nickname, notes });
      if (res.data?.success) {
        setContactNotes((prev) => ({
          ...prev,
          [contactId.toString()]: { nickname, notes },
        }));
      }
      return res.data;
    } catch (err) {
      console.error('Failed to update contact note', err);
      throw err;
    }
  };

  const getContactNickname = (contactId, fallbackName) => {
    if (!contactId) return fallbackName;
    return contactNotes[contactId.toString()]?.nickname || fallbackName;
  };

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // E2EE: Helper to identify recipient in 1-on-1 direct conversation
  const getOtherParticipant = (conv) => {
    if (!conv || conv.isGroup || conv.isNoteToSelf) return null;
    return conv.participants?.find((p) => (p.user?._id || p.user) !== user?._id)?.user;
  };

  // E2EE: Decrypt an array of messages
  const decryptMessagesList = async (msgList, conv) => {
    const other = getOtherParticipant(conv);
    if (!other?.publicKey || !e2eeKeyPair?.privateKey) {
      return msgList;
    }

    const sharedKey = await getSharedKey(e2eeKeyPair.privateKey, other.publicKey);
    if (!sharedKey) return msgList;

    const decrypted = await Promise.all(
      msgList.map(async (m) => {
        if (m.isEncrypted && m.ciphertext && m.iv) {
          const plain = await decryptTextMessage(m.ciphertext, m.iv, sharedKey);
          return {
            ...m,
            text: plain !== null ? plain : (m.text || '[Encrypted Message]'),
          };
        }
        return m;
      })
    );
    return decrypted;
  };

  // E2EE: Decrypt a single incoming message
  const decryptSingleMessage = async (msg, conv) => {
    if (!msg?.isEncrypted || !msg?.ciphertext || !msg?.iv) return msg;
    const other = getOtherParticipant(conv);
    if (!other?.publicKey || !e2eeKeyPair?.privateKey) return msg;

    const sharedKey = await getSharedKey(e2eeKeyPair.privateKey, other.publicKey);
    if (!sharedKey) return msg;

    const plain = await decryptTextMessage(msg.ciphertext, msg.iv, sharedKey);
    return {
      ...msg,
      text: plain !== null ? plain : (msg.text || '[Encrypted Message]'),
    };
  };

  // Select a conversation and load its messages
  const selectConversation = useCallback(
    async (convOrId) => {
      let conversation = convOrId;
      if (typeof convOrId === 'string') {
        conversation = conversations.find((c) => c._id === convOrId);
        if (!conversation) {
          try {
            const res = await api.get(`/conversations/${convOrId}`);
            conversation = res.data.conversation;
          } catch (e) {
            console.error('Failed to load conversation by id', e);
            return;
          }
        }
      }

      if (!conversation) return;

      // Leave previous socket room if any
      if (activeConversationRef.current && socket) {
        socket.emit('conversation:leave', activeConversationRef.current._id);
      }

      setActiveConversation(conversation);
      setReplyMessage(null);
      setLoadingMessages(true);

      // Join new socket room
      if (socket) {
        socket.emit('conversation:join', conversation._id);
      }

      try {
        const res = await api.get(`/messages/${conversation._id}`);
        const rawMessages = res.data.messages || [];
        const decryptedMessages = await decryptMessagesList(rawMessages, conversation);
        setMessages(decryptedMessages);

        // Mark messages as read in DB and reset local unread badge
        await api.post('/messages/read', { conversationId: conversation._id });

        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === conversation._id) {
              const updatedParticipants = c.participants?.map((p) =>
                p.user?._id === user?._id || p.user === user?._id ? { ...p, unreadCount: 0 } : p
              );
              return { ...c, participants: updatedParticipants };
            }
            return c;
          })
        );

        if (socket) {
          socket.emit('message:read', {
            conversationId: conversation._id,
            readByUserId: user._id,
          });
        }
      } catch (err) {
        console.error('Failed to fetch messages for conversation', err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [conversations, socket, user]
  );

  // Send message
  const sendMessage = async (payload) => {
    if (!activeConversation) return;

    let sendPayload = { ...payload };
    const originalText = payload.text;

    // E2EE: Encrypt text messages if recipient has an established public key
    const other = getOtherParticipant(activeConversation);
    if (
      other?.publicKey &&
      e2eeKeyPair?.privateKey &&
      payload.text &&
      (!payload.type || payload.type === 'text')
    ) {
      const sharedKey = await getSharedKey(e2eeKeyPair.privateKey, other.publicKey);
      if (sharedKey) {
        const encrypted = await encryptTextMessage(payload.text, sharedKey);
        if (encrypted) {
          sendPayload = {
            ...payload,
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            isEncrypted: true,
            text: '', // securely strip plaintext before sending to server
          };
        }
      }
    }

    try {
      const res = await api.post('/messages', {
        conversationId: activeConversation._id,
        replyTo: replyMessage?._id || null,
        ...sendPayload,
      });

      const newMessage = {
        ...res.data.message,
        text: originalText || res.data.message.text, // preserve plaintext for sender UI
      };

      // Append to current messages
      setMessages((prev) => [...prev, newMessage]);
      setReplyMessage(null);
      sound.playMessageSent();

      // Update conversation lastMessage preview
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c._id === activeConversation._id) {
            return {
              ...c,
              lastMessage: newMessage,
              lastMessageAt: newMessage.createdAt,
            };
          }
          return c;
        });
        // Sort by lastMessageAt descending
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });

      // Broadcast via socket
      if (socket) {
        const recipientIds = activeConversation.participants
          ?.map((p) => p.user?._id || p.user)
          ?.filter((id) => id?.toString() !== user?._id?.toString());

        socket.emit('message:send', {
          conversationId: activeConversation._id,
          message: newMessage,
          recipientIds,
        });
      }

      return newMessage;
    } catch (err) {
      console.error('Failed to send message', err);
      throw err;
    }
  };

  // Edit message
  const editMessage = async (messageId, newText) => {
    try {
      const res = await api.put(`/messages/${messageId}`, { text: newText });
      const updated = res.data.message;

      setMessages((prev) => prev.map((m) => (m._id === messageId ? updated : m)));

      if (socket && activeConversation) {
        socket.emit('message:edit', {
          conversationId: activeConversation._id,
          message: updated,
        });
      }
    } catch (err) {
      console.error('Failed to edit message', err);
    }
  };

  // Delete message
  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      await api.post(`/messages/${messageId}/delete`, { deleteForEveryone });

      if (deleteForEveryone) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, deletedForEveryone: true, text: 'This message was deleted', mediaUrl: '', reactions: [] }
              : m
          )
        );

        if (socket && activeConversation) {
          socket.emit('message:delete', {
            conversationId: activeConversation._id,
            messageId,
            deleteForEveryone: true,
          });
        }
      } else {
        // Delete for me
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // React to message with emoji
  const reactToMessage = async (messageId, emoji) => {
    try {
      const res = await api.post(`/messages/${messageId}/react`, { emoji });
      const updated = res.data.message;

      setMessages((prev) => prev.map((m) => (m._id === messageId ? updated : m)));

      if (socket && activeConversation) {
        socket.emit('message:react', {
          conversationId: activeConversation._id,
          message: updated,
        });
      }
    } catch (err) {
      console.error('Failed to react to message', err);
    }
  };

  // Star / unstar message
  const toggleStarMessage = async (messageId) => {
    try {
      const res = await api.post(`/messages/${messageId}/star`);
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) {
            const hasStar = m.starredBy?.includes(user._id);
            return {
              ...m,
              starredBy: hasStar
                ? m.starredBy.filter((id) => id !== user._id)
                : [...(m.starredBy || []), user._id],
            };
          }
          return m;
        })
      );
      return res.data.isStarred;
    } catch (err) {
      console.error('Failed to toggle star', err);
    }
  };

  // Vote in poll
  const votePoll = async (messageId, optionIndex) => {
    try {
      const res = await api.post(`/messages/${messageId}/poll/vote`, { optionIndex });
      const updated = res.data.message;

      setMessages((prev) => prev.map((m) => (m._id === messageId ? updated : m)));

      if (socket && activeConversation) {
        socket.emit('poll:vote', {
          conversationId: activeConversation._id,
          message: updated,
        });
      }
    } catch (err) {
      console.error('Failed to vote in poll', err);
    }
  };

  // RSVP to event
  const rsvpEvent = async (messageId, status) => {
    try {
      const res = await api.post(`/messages/${messageId}/event/rsvp`, { status });
      const updated = res.data.message;

      setMessages((prev) => prev.map((m) => (m._id === messageId ? updated : m)));

      if (socket && activeConversation) {
        socket.emit('event:rsvp', {
          conversationId: activeConversation._id,
          message: updated,
        });
      }
    } catch (err) {
      console.error('Failed to RSVP to event', err);
    }
  };

  // Open view-once media
  const openViewOnce = async (messageId) => {
    try {
      const res = await api.post(`/messages/${messageId}/view-once`);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, viewOnceOpenedBy: [...(m.viewOnceOpenedBy || []), user._id] }
            : m
        )
      );
      return res.data.mediaUrl;
    } catch (err) {
      console.error('Failed to open view-once', err);
      throw err;
    }
  };

  // Forward message to one or more conversations
  const forwardMessage = async (messageId, conversationIds, customCaption = '') => {
    try {
      const res = await api.post('/messages/forward', { messageId, conversationIds, customCaption });
      await fetchConversations();
      return res.data;
    } catch (err) {
      console.error('Failed to forward message', err);
      throw err;
    }
  };

  // Toggle Pin message
  const togglePinMessage = async (messageId) => {
    try {
      const res = await api.post(`/messages/${messageId}/pin`);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, pinned: res.data.pinned, pinnedAt: res.data.pinned ? new Date() : null }
            : m
        )
      );
      return res.data;
    } catch (err) {
      console.error('Failed to toggle pin message', err);
      throw err;
    }
  };

  // Keep or unkeep message from expiring (disappearing messages)
  const keepMessage = async (messageId) => {
    try {
      const res = await api.post(`/messages/${messageId}/keep`);
      const updated = res.data.message;
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, ...updated } : m)));
      return updated;
    } catch (err) {
      console.error('Failed to toggle keep message', err);
      throw err;
    }
  };

  // Clear conversation messages for current user
  const clearChat = async (conversationId) => {
    try {
      await api.delete(`/conversations/${conversationId}/clear`);
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId ? { ...c, lastMessage: null } : c
        )
      );
      return true;
    } catch (err) {
      console.error('Failed to clear chat', err);
      throw err;
    }
  };

  // Socket event listeners for real-time conversation updates
  useEffect(() => {
    if (!socket) return;

    // Incoming message
    const handleNewMessage = async ({ conversationId, message }) => {
      if (message.sender?._id !== user?._id && message.sender !== user?._id) {
        const chatTone =
          localStorage.getItem(`saylo_tone_${conversationId}`) ||
          localStorage.getItem('saylo_notification_tone') ||
          'chime';
        sound.playMessageIncoming(chatTone);
      }

      let processedMessage = message;
      const targetConv =
        activeConversationRef.current?._id === conversationId
          ? activeConversationRef.current
          : conversations.find((c) => c._id === conversationId);

      if (message.isEncrypted && targetConv) {
        processedMessage = await decryptSingleMessage(message, targetConv);
      }

      // If we are currently inside this conversation
      if (activeConversationRef.current && activeConversationRef.current._id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === processedMessage._id)) return prev;
          return [...prev, processedMessage];
        });

        // Mark as read immediately
        api.post('/messages/read', { conversationId });
        socket.emit('message:read', { conversationId, readByUserId: user?._id });
      }

      // Update sidebar conversation list
      setConversations((prev) => {
        const found = prev.find((c) => c._id === conversationId);
        if (found) {
          const updated = prev.map((c) => {
            if (c._id === conversationId) {
              const isCurrentChat = activeConversationRef.current?._id === conversationId;
              const updatedParticipants = c.participants?.map((p) => {
                if (p.user?._id === user?._id || p.user === user?._id) {
                  return {
                    ...p,
                    unreadCount: isCurrentChat ? 0 : (p.unreadCount || 0) + 1,
                  };
                }
                return p;
              });

              return {
                ...c,
                lastMessage: processedMessage,
                lastMessageAt: processedMessage.createdAt,
                participants: updatedParticipants,
              };
            }
            return c;
          });
          return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        } else {
          // If conversation is new, fetch conversations list
          fetchConversations();
          return prev;
        }
      });
    };

    // Edited message
    const handleMessageEdited = ({ message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    // Deleted message
    const handleMessageDeleted = ({ messageId, deleteForEveryone }) => {
      if (deleteForEveryone) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, deletedForEveryone: true, text: 'This message was deleted', mediaUrl: '', reactions: [] }
              : m
          )
        );
      }
    };

    // Reaction update
    const handleReactionUpdate = ({ message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    // Read receipts update
    const handleReadReceipt = ({ conversationId }) => {
      if (activeConversationRef.current && activeConversationRef.current._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.sender?._id === user?._id ? { ...m, status: 'read' } : m))
        );
      }
    };

    // Poll update
    const handlePollUpdate = ({ message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    // Event update
    const handleEventUpdate = ({ message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('notification:new_message', handleNewMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:reaction_update', handleReactionUpdate);
    socket.on('message:read_receipt', handleReadReceipt);
    socket.on('poll:update', handlePollUpdate);
    socket.on('event:update', handleEventUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('notification:new_message', handleNewMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:reaction_update', handleReactionUpdate);
      socket.off('message:read_receipt', handleReadReceipt);
      socket.off('poll:update', handlePollUpdate);
      socket.off('event:update', handleEventUpdate);
    };
  }, [socket, user, fetchConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation,
        messages,
        setMessages,
        loadingMessages,
        selectConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        toggleStarMessage,
        votePoll,
        rsvpEvent,
        openViewOnce,
        forwardMessage,
        togglePinMessage,
        keepMessage,
        clearChat,
        replyMessage,
        setReplyMessage,
        fetchConversations,
        activeTabFilter,
        setActiveTabFilter,
        searchQuery,
        setSearchQuery,
        contactNotes,
        fetchContactNotes,
        updateContactNote,
        getContactNickname,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

