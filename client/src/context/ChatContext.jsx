import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all', 'unread', 'favorites', 'groups'
  const [searchQuery, setSearchQuery] = useState('');
  const activeConversationRef = useRef(activeConversation);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

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
        setMessages(res.data.messages || []);

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

    try {
      const res = await api.post('/messages', {
        conversationId: activeConversation._id,
        replyTo: replyMessage?._id || null,
        ...payload,
      });

      const newMessage = res.data.message;

      // Append to current messages
      setMessages((prev) => [...prev, newMessage]);
      setReplyMessage(null);

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

  // Socket event listeners for real-time conversation updates
  useEffect(() => {
    if (!socket) return;

    // Incoming message
    const handleNewMessage = ({ conversationId, message }) => {
      // If we are currently inside this conversation
      if (activeConversationRef.current && activeConversationRef.current._id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
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
                lastMessage: message,
                lastMessageAt: message.createdAt,
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
        replyMessage,
        setReplyMessage,
        fetchConversations,
        activeTabFilter,
        setActiveTabFilter,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

