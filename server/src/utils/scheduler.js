const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * Periodically checks for due scheduled messages, marks them as active,
 * updates conversation previews, and broadcasts via Socket.io.
 */
const initMessageScheduler = (io) => {
  setInterval(async () => {
    try {
      const now = new Date();
      // Find messages scheduled at or before now that are still marked isScheduled
      const dueMessages = await Message.find({
        isScheduled: true,
        scheduledFor: { $lte: now },
      })
        .populate('sender', 'name avatar')
        .populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'name' },
        });

      if (dueMessages.length === 0) return;

      for (const msg of dueMessages) {
        msg.isScheduled = false;
        await msg.save();

        // Update conversation
        const conv = await Conversation.findById(msg.conversation);
        if (conv) {
          conv.lastMessage = msg._id;
          conv.lastMessageAt = msg.createdAt;

          conv.participants.forEach((p) => {
            if (p.user.toString() !== msg.sender._id.toString()) {
              p.unreadCount = (p.unreadCount || 0) + 1;
            }
          });

          await conv.save();

          // Broadcast via Socket.IO
          if (io) {
            io.to(`conversation_${conv._id}`).emit('message:new', {
              conversationId: conv._id,
              message: msg,
            });

            conv.participants.forEach((p) => {
              if (p.user.toString() !== msg.sender._id.toString()) {
                io.to(`user_${p.user}`).emit('notification:new_message', {
                  conversationId: conv._id,
                  message: msg,
                });
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error dispatching scheduled messages:', err.message);
    }
  }, 10000); // Check every 10 seconds
};

module.exports = { initMessageScheduler };
