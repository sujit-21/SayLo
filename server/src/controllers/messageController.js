const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc Get messages for a conversation
// @route GET /api/v1/messages/:conversationId
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    // Verify user is in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied or conversation does not exist' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: { $ne: currentUserId },
      isScheduled: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .populate('readBy.user', 'name avatar')
      .populate('deliveredTo.user', 'name avatar')
      .populate('keptBy', 'name avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      });

    const total = await Message.countDocuments({
      conversation: conversationId,
      deletedFor: { $ne: currentUserId },
      isScheduled: { $ne: true },
    });

    res.json({
      success: true,
      messages,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Send a message
// @route POST /api/v1/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const {
      conversationId,
      text,
      type = 'text',
      mediaUrl,
      mediaName,
      mediaSize,
      mediaMimeType,
      mediaDuration,
      viewOnce,
      replyTo,
      forwarded,
      poll,
      event,
      location,
      contactCard,
      linkPreview,
      scheduledFor,
      ciphertext,
      iv,
      isEncrypted,
    } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Conversation not found or access denied' });
    }

    // Check if group has onlyAdminsCanSend restriction
    if (conversation.isGroup && conversation.groupSettings?.onlyAdminsCanSend) {
      const isAdmin = conversation.admins.some((a) => a.toString() === currentUserId.toString());
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Only admins can send messages in this group' });
      }
    }

    // Calculate expiry date if disappearing messages are enabled
    let expiresAt = null;
    if (conversation.disappearingTimer > 0) {
      expiresAt = new Date(Date.now() + conversation.disappearingTimer * 1000);
    }

    // Check if message is scheduled for future
    const isFutureSchedule = scheduledFor && new Date(scheduledFor) > new Date();

    const message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      text: text || '',
      type,
      mediaUrl: mediaUrl || '',
      mediaName: mediaName || '',
      mediaSize: mediaSize || 0,
      mediaMimeType: mediaMimeType || '',
      mediaDuration: mediaDuration || 0,
      viewOnce: !!viewOnce,
      replyTo: replyTo || null,
      forwarded: !!forwarded,
      expiresAt,
      poll: poll || undefined,
      event: event || undefined,
      location: location || undefined,
      contactCard: contactCard || undefined,
      linkPreview: linkPreview || undefined,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      isScheduled: isFutureSchedule,
      ciphertext: ciphertext || '',
      iv: iv || '',
      isEncrypted: !!isEncrypted,
    });

    if (!isFutureSchedule) {
      // Update conversation lastMessage and timestamp
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = message.createdAt;

      // Increment unread count for other participants
      conversation.participants.forEach((p) => {
        if (p.user.toString() !== currentUserId.toString()) {
          p.unreadCount = (p.unreadCount || 0) + 1;
        }
      });

      await conversation.save();
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('readBy.user', 'name avatar')
      .populate('deliveredTo.user', 'name avatar')
      .populate('keptBy', 'name avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      });

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// @desc Edit message
// @route PUT /api/v1/messages/:id
exports.editMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
    }

    message.text = text;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const updated = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('readBy.user', 'name avatar')
      .populate('deliveredTo.user', 'name avatar')
      .populate('keptBy', 'name avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      });

    res.json({ success: true, message: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Delete message
// @route POST /api/v1/messages/:id/delete
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deleteForEveryone } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (deleteForEveryone) {
      if (message.sender.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: 'Only sender can delete for everyone' });
      }
      message.deletedForEveryone = true;
      message.text = 'This message was deleted';
      message.mediaUrl = '';
      message.reactions = [];
      await message.save();
    } else {
      if (!message.deletedFor.includes(currentUserId)) {
        message.deletedFor.push(currentUserId);
        await message.save();
      }
    }

    res.json({ success: true, messageId: id, deleteForEveryone: !!deleteForEveryone });
  } catch (error) {
    next(error);
  }
};

// @desc React to message with emoji
// @route POST /api/v1/messages/:id/react
exports.reactToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === currentUserId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Toggle off if same emoji clicked again
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Replace with new emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: currentUserId, emoji });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('readBy.user', 'name avatar')
      .populate('deliveredTo.user', 'name avatar')
      .populate('keptBy', 'name avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' },
      });

    res.json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Star / Unstar message
// @route POST /api/v1/messages/:id/star
exports.toggleStarMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isStarred = message.starredBy.includes(currentUserId);
    if (isStarred) {
      message.starredBy = message.starredBy.filter((uid) => uid.toString() !== currentUserId.toString());
    } else {
      message.starredBy.push(currentUserId);
    }

    await message.save();
    res.json({ success: true, isStarred: !isStarred, messageId: id });
  } catch (error) {
    next(error);
  }
};

// @desc Get all starred messages for user
// @route GET /api/v1/messages/starred
exports.getStarredMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const messages = await Message.find({
      starredBy: currentUserId,
      deletedFor: { $ne: currentUserId },
    })
      .populate('sender', 'name avatar')
      .populate('conversation', 'name isGroup avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc Pin / Unpin message
// @route POST /api/v1/messages/:id/pin
exports.togglePinMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.pinned = !message.pinned;
    message.pinnedAt = message.pinned ? new Date() : null;
    await message.save();

    res.json({ success: true, pinned: message.pinned, messageId: id });
  } catch (error) {
    next(error);
  }
};

// @desc Mark messages as read in conversation
// @route POST /api/v1/messages/read
exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const currentUserId = req.user._id;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: currentUserId },
        'readBy.user': { $ne: currentUserId },
      },
      {
        $set: { status: 'read' },
        $push: { readBy: { user: currentUserId, readAt: new Date() } },
      }
    );

    // Reset unreadCount in conversation
    await Conversation.updateOne(
      { _id: conversationId, 'participants.user': currentUserId },
      { $set: { 'participants.$.unreadCount': 0 } }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc Vote in poll
// @route POST /api/v1/messages/:id/poll/vote
exports.votePoll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message || !message.poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    const { options, multipleAnswers } = message.poll;
    if (!options[optionIndex]) {
      return res.status(400).json({ success: false, message: 'Invalid option' });
    }

    if (!multipleAnswers) {
      // Clear previous votes by this user in other options
      options.forEach((opt) => {
        opt.votes = opt.votes.filter((uid) => uid.toString() !== currentUserId.toString());
      });
    }

    const voteIndex = options[optionIndex].votes.findIndex(
      (uid) => uid.toString() === currentUserId.toString()
    );

    if (voteIndex > -1) {
      // Toggle vote off
      options[optionIndex].votes.splice(voteIndex, 1);
    } else {
      options[optionIndex].votes.push(currentUserId);
    }

    await message.save();

    const populated = await Message.findById(message._id).populate('sender', 'name avatar');
    res.json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Open view-once media
// @route POST /api/v1/messages/:id/view-once
exports.openViewOnce = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message || !message.viewOnce) {
      return res.status(404).json({ success: false, message: 'View-once media not found' });
    }

    if (message.viewOnceOpenedBy.includes(currentUserId)) {
      return res.status(403).json({ success: false, message: 'Media has already been viewed' });
    }

    message.viewOnceOpenedBy.push(currentUserId);
    await message.save();

    res.json({ success: true, mediaUrl: message.mediaUrl, messageId: id });
  } catch (error) {
    next(error);
  }
};

// @desc RSVP to Group Event
// @route POST /api/v1/messages/:id/event/rsvp
exports.rsvpEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'going', 'maybe', 'declined'
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message || !message.event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existingIndex = message.event.attendees.findIndex(
      (a) => a.user.toString() === currentUserId.toString()
    );

    if (existingIndex > -1) {
      message.event.attendees[existingIndex].status = status;
    } else {
      message.event.attendees.push({ user: currentUserId, status });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('event.attendees.user', 'name avatar');

    res.json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Forward a message to one or more conversations
// @route POST /api/v1/messages/forward
exports.forwardMessage = async (req, res, next) => {
  try {
    const { messageId, conversationIds, customCaption } = req.body;
    const currentUserId = req.user._id;

    if (!messageId || !conversationIds || !conversationIds.length) {
      return res.status(400).json({ success: false, message: 'Message ID and conversation IDs are required' });
    }

    const original = await Message.findById(messageId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original message not found' });
    }

    const forwardedMessages = [];
    for (const convId of conversationIds) {
      const conv = await Conversation.findOne({
        _id: convId,
        'participants.user': currentUserId,
      });
      if (!conv) continue;

      let expiresAt = null;
      if (conv.disappearingTimer > 0) {
        expiresAt = new Date(Date.now() + conv.disappearingTimer * 1000);
      }

      const msg = await Message.create({
        conversation: convId,
        sender: currentUserId,
        text: customCaption !== undefined && customCaption.trim() ? customCaption.trim() : (original.text || ''),
        type: original.type,
        mediaUrl: original.mediaUrl || '',
        mediaName: original.mediaName || '',
        mediaSize: original.mediaSize,
        mediaMimeType: original.mediaMimeType,
        mediaDuration: original.mediaDuration,
        location: original.location,
        poll: original.poll,
        event: original.event,
        contactCard: original.contactCard,
        linkPreview: original.linkPreview,
        ciphertext: original.ciphertext || '',
        iv: original.iv || '',
        isEncrypted: !!original.isEncrypted,
        forwarded: true,
        expiresAt,
      });

      await Conversation.findByIdAndUpdate(convId, {
        lastMessage: msg._id,
        lastMessageAt: new Date(),
      });

      const populated = await Message.findById(msg._id)
        .populate('sender', 'name avatar')
        .populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'name' },
        });

      forwardedMessages.push(populated);
    }

    res.json({ success: true, forwardedMessages });
  } catch (error) {
    next(error);
  }
};

// @desc Send broadcast message to multiple individual contacts
// @route POST /api/v1/messages/broadcast
exports.sendBroadcast = async (req, res, next) => {
  try {
    const { recipientIds, text, type, mediaUrl, mediaName, mediaMimeType, mediaSize } = req.body;
    const currentUserId = req.user._id;

    if (!recipientIds || !recipientIds.length) {
      return res.status(400).json({ success: false, message: 'Recipient IDs are required for broadcast' });
    }

    const broadcastMessages = [];

    for (const recipientId of recipientIds) {
      if (recipientId.toString() === currentUserId.toString()) continue;

      // Find or create direct 1-on-1 conversation
      let conv = await Conversation.findOne({
        isGroup: false,
        isNoteToSelf: false,
        'participants.user': { $all: [currentUserId, recipientId] },
      });

      if (!conv) {
        conv = await Conversation.create({
          isGroup: false,
          participants: [
            { user: currentUserId, role: 'member' },
            { user: recipientId, role: 'member' },
          ],
        });
      }

      const msg = await Message.create({
        conversation: conv._id,
        sender: currentUserId,
        text: text || '',
        type: type || 'text',
        mediaUrl: mediaUrl || '',
        mediaName: mediaName || '',
        mediaMimeType: mediaMimeType || '',
        mediaSize: mediaSize || 0,
        status: 'sent',
      });

      await Conversation.findByIdAndUpdate(conv._id, {
        lastMessage: msg._id,
        lastMessageAt: new Date(),
      });

      const populated = await Message.findById(msg._id).populate('sender', 'name avatar');
      broadcastMessages.push(populated);
    }

    res.json({ success: true, count: broadcastMessages.length, messages: broadcastMessages });
  } catch (error) {
    next(error);
  }
};

// @desc Get scheduled messages for current user
// @route GET /api/v1/messages/scheduled
exports.getScheduledMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const scheduled = await Message.find({
      sender: currentUserId,
      isScheduled: true,
      scheduledFor: { $gt: new Date() },
    })
      .sort({ scheduledFor: 1 })
      .populate('conversation', 'name avatar isGroup');

    res.json({ success: true, messages: scheduled });
  } catch (error) {
    next(error);
  }
};

// @desc Cancel / Delete a scheduled message
// @route DELETE /api/v1/messages/scheduled/:id
exports.cancelScheduledMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findOne({ _id: id, sender: currentUserId, isScheduled: true });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Scheduled message not found' });
    }

    await Message.deleteOne({ _id: id });
    res.json({ success: true, message: 'Scheduled message cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc Get detailed message info (read receipts & delivery per member)
// @route GET /api/v1/messages/:id/info
exports.getMessageInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(id)
      .populate('sender', 'name avatar')
      .populate('readBy.user', 'name avatar phone email')
      .populate('deliveredTo.user', 'name avatar phone email')
      .populate('keptBy', 'name avatar');

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversation,
      'participants.user': currentUserId,
    }).populate('participants.user', 'name avatar phone email');

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      message,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Keep or unkeep message from expiring (disappearing messages)
// @route POST /api/v1/messages/:id/keep
exports.keepMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversation,
      'participants.user': currentUserId,
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Toggle keep
    const willKeep = !message.isKept;
    message.isKept = willKeep;
    if (willKeep) {
      message.keptBy = currentUserId;
      message.keptAt = new Date();
      message.expiresAt = undefined;
    } else {
      message.keptBy = undefined;
      message.keptAt = undefined;
      // If conversation has disappearing messages enabled, restore expiresAt
      if (conversation.disappearingTimer && conversation.disappearingTimer > 0) {
        message.expiresAt = new Date(Date.now() + conversation.disappearingTimer * 1000);
      }
    }

    await message.save();
    await message.populate('sender', 'name avatar');
    await message.populate('keptBy', 'name avatar');

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};



