const jwt = require('jsonwebtoken');
const User = require('../models/User');

const activeSockets = new Map(); // userId -> Set of socketIds

const initSocketIO = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'saylo_secret_fallback_key');
      const user = await User.findById(decoded.id).select('name email avatar');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);

    // Track active socket
    if (!activeSockets.has(userId)) {
      activeSockets.set(userId, new Set());
    }
    activeSockets.get(userId).add(socket.id);

    // Update user status to online in database
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Join personal room for direct notifications
    socket.join(`user_${userId}`);

    // Broadcast online presence to everyone
    io.emit('presence:update', {
      userId,
      isOnline: true,
      lastSeen: new Date(),
    });

    // 1. Join Conversation Room
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    // 2. Leave Conversation Room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // 3. New Message Broadcast
    socket.on('message:send', ({ conversationId, message, recipientIds }) => {
      // Emit to everyone in conversation room
      socket.to(`conversation_${conversationId}`).emit('message:new', {
        conversationId,
        message,
      });

      // Also notify recipients if they are outside the chat room
      if (Array.isArray(recipientIds)) {
        recipientIds.forEach((rId) => {
          if (rId !== userId) {
            io.to(`user_${rId}`).emit('notification:new_message', {
              conversationId,
              message,
            });
          }
        });
      }
    });

    // 4. Message Edited
    socket.on('message:edit', ({ conversationId, message }) => {
      io.to(`conversation_${conversationId}`).emit('message:edited', {
        conversationId,
        message,
      });
    });

    // 5. Message Deleted
    socket.on('message:delete', ({ conversationId, messageId, deleteForEveryone }) => {
      io.to(`conversation_${conversationId}`).emit('message:deleted', {
        conversationId,
        messageId,
        deleteForEveryone,
      });
    });

    // 6. Message Reaction
    socket.on('message:react', ({ conversationId, message }) => {
      io.to(`conversation_${conversationId}`).emit('message:reaction_update', {
        conversationId,
        message,
      });
    });

    // 7. Message Read Receipt
    socket.on('message:read', ({ conversationId, readByUserId }) => {
      socket.to(`conversation_${conversationId}`).emit('message:read_receipt', {
        conversationId,
        readByUserId,
      });
    });

    // 8. Typing Indicators
    socket.on('typing:start', ({ conversationId, userName }) => {
      socket.to(`conversation_${conversationId}`).emit('typing:status', {
        conversationId,
        userId,
        userName: userName || socket.user.name,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('typing:status', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // 9. Poll Vote Update
    socket.on('poll:vote', ({ conversationId, message }) => {
      io.to(`conversation_${conversationId}`).emit('poll:update', {
        conversationId,
        message,
      });
    });

    // 9b. Event RSVP Update
    socket.on('event:rsvp', ({ conversationId, message }) => {
      io.to(`conversation_${conversationId}`).emit('event:update', {
        conversationId,
        message,
      });
    });

    // 10. WebRTC Audio / Video Calls Signaling
    socket.on('call:initiate', ({ receiverId, conversationId, callType, offer }) => {
      io.to(`user_${receiverId}`).emit('call:incoming', {
        caller: {
          _id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
        conversationId,
        callType,
        offer,
      });
    });

    socket.on('call:accept', ({ callerId, answer }) => {
      io.to(`user_${callerId}`).emit('call:accepted', {
        receiver: socket.user,
        answer,
      });
    });

    socket.on('call:reject', ({ callerId }) => {
      io.to(`user_${callerId}`).emit('call:rejected', {
        receiverId: userId,
      });
    });

    socket.on('call:ice_candidate', ({ targetUserId, candidate }) => {
      io.to(`user_${targetUserId}`).emit('call:ice_candidate', {
        fromUserId: userId,
        candidate,
      });
    });

    socket.on('call:end', ({ targetUserId }) => {
      if (targetUserId) {
        io.to(`user_${targetUserId}`).emit('call:ended', {
          endedBy: userId,
        });
      }
    });

    // 10b. Screen Share Toggle Signaling
    socket.on('call:screen_share', ({ targetUserId, isSharing }) => {
      if (targetUserId) {
        io.to(`user_${targetUserId}`).emit('call:screen_share', {
          userId,
          isSharing,
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.user.name}`);
      const userSockets = activeSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeSockets.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
          io.emit('presence:update', {
            userId,
            isOnline: false,
            lastSeen,
          });
        }
      }
    });
  });
};

module.exports = { initSocketIO };

