const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// @desc Get all conversations for current user
// @route GET /api/v1/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      'participants.user': currentUserId,
    })
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .populate('admins', 'name avatar')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

// @desc Get single conversation by ID
// @route GET /api/v1/conversations/:id
exports.getConversationById = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': currentUserId,
    })
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    res.json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// @desc Create or get 1-on-1 direct conversation
// @route POST /api/v1/conversations/direct
exports.createOrGetDirectChat = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (recipientId === currentUserId.toString()) {
      return exports.createNoteToSelfChat(req, res, next);
    }

    // Check if direct conversation already exists between these 2 users
    let conversation = await Conversation.findOne({
      isGroup: false,
      isChannel: false,
      isNoteToSelf: false,
      'participants.user': { $all: [currentUserId, recipientId] },
    })
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate('lastMessage');

    if (!conversation) {
      // Create new direct conversation
      conversation = await Conversation.create({
        isGroup: false,
        participants: [
          { user: currentUserId, role: 'member' },
          { user: recipientId, role: 'member' },
        ],
        createdBy: currentUserId,
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants.user',
        'name email avatar about isOnline lastSeen'
      );
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// @desc Create or get Note to Self conversation
// @route POST /api/v1/conversations/note-to-self
exports.createNoteToSelfChat = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    let conversation = await Conversation.findOne({
      isNoteToSelf: true,
      'participants.user': currentUserId,
    })
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        isNoteToSelf: true,
        name: 'Message Yourself',
        participants: [{ user: currentUserId, role: 'admin' }],
        createdBy: currentUserId,
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants.user',
        'name email avatar about isOnline lastSeen'
      );
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// @desc Create Group conversation
// @route POST /api/v1/conversations/group
exports.createGroup = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { name, description, avatar, participantIds, disappearingTimer } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const uniqueParticipants = Array.from(new Set([currentUserId.toString(), ...(participantIds || [])]));

    const participants = uniqueParticipants.map((id) => ({
      user: id,
      role: id === currentUserId.toString() ? 'admin' : 'member',
    }));

    const inviteCode = uuidv4().slice(0, 8);

    const group = await Conversation.create({
      name,
      description: description || '',
      avatar: avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}`,
      isGroup: true,
      participants,
      admins: [currentUserId],
      createdBy: currentUserId,
      disappearingTimer: disappearingTimer || 0,
      inviteCode,
    });

    // Create system message
    await Message.create({
      conversation: group._id,
      sender: currentUserId,
      type: 'system',
      text: `${req.user.name} created group "${name}"`,
    });

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate('admins', 'name avatar');

    res.status(201).json({ success: true, conversation: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc Update Group
// @route PUT /api/v1/conversations/group/:id
exports.updateGroup = async (req, res, next) => {
  try {
    const { name, description, avatar, groupSettings } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = conversation.admins.some((adminId) => adminId.toString() === req.user._id.toString());
    if (conversation.groupSettings?.onlyAdminsCanEditInfo && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can edit group info' });
    }

    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (avatar) conversation.avatar = avatar;
    if (groupSettings && isAdmin) {
      conversation.groupSettings = { ...conversation.groupSettings, ...groupSettings };
    }

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate('admins', 'name avatar');

    res.json({ success: true, conversation: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Update member role (admin/member)
// @route PUT /api/v1/conversations/group/:id/members/:userId/role
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body; // 'admin' | 'member'
    const conversation = await Conversation.findById(id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const currentIsAdmin = conversation.admins.some((a) => a.toString() === req.user._id.toString());
    if (!currentIsAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can change member roles' });
    }

    const participant = conversation.participants.find((p) => p.user.toString() === userId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Member not found in group' });
    }

    participant.role = role === 'admin' ? 'admin' : 'member';
    if (role === 'admin') {
      if (!conversation.admins.some((a) => a.toString() === userId)) {
        conversation.admins.push(userId);
      }
    } else {
      conversation.admins = conversation.admins.filter((a) => a.toString() !== userId);
    }

    await conversation.save();

    const targetUser = await User.findById(userId).select('name');
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      type: 'system',
      text:
        role === 'admin'
          ? `${targetUser?.name || 'A member'} is now an admin`
          : `${targetUser?.name || 'A member'} is no longer an admin`,
    });

    const updated = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate('admins', 'name avatar');

    res.json({ success: true, conversation: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Add group members
// @route POST /api/v1/conversations/group/:id/members
exports.addGroupMembers = async (req, res, next) => {
  try {
    const { memberIds } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const existingUserIds = conversation.participants.map((p) => p.user.toString());
    const newMembers = memberIds.filter((id) => !existingUserIds.includes(id));

    newMembers.forEach((id) => {
      conversation.participants.push({ user: id, role: 'member' });
    });

    await conversation.save();

    // Create system message
    const addedUsers = await User.find({ _id: { $in: newMembers } }).select('name');
    const names = addedUsers.map((u) => u.name).join(', ');
    if (names) {
      await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        type: 'system',
        text: `${req.user.name} added ${names}`,
      });
    }

    const updated = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email avatar about isOnline lastSeen publicKey')
      .populate('admins', 'name avatar');

    res.json({ success: true, conversation: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Remove member or leave group
// @route DELETE /api/v1/conversations/group/:id/members/:userId
exports.removeGroupMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const conversation = await Conversation.findById(id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = conversation.admins.some((a) => a.toString() === req.user._id.toString());
    const isSelf = userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Only admins can remove other members' });
    }

    conversation.participants = conversation.participants.filter((p) => p.user.toString() !== userId);
    conversation.admins = conversation.admins.filter((a) => a.toString() !== userId);

    // If no admins left and members exist, promote the first member
    if (conversation.admins.length === 0 && conversation.participants.length > 0) {
      conversation.admins.push(conversation.participants[0].user);
      conversation.participants[0].role = 'admin';
    }

    await conversation.save();

    const removedUser = await User.findById(userId).select('name');
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      type: 'system',
      text: isSelf ? `${req.user.name} left the group` : `${req.user.name} removed ${removedUser?.name || 'a member'}`,
    });

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle participant setting (archive, pin, mute, lock, wallpaper)
// @route PUT /api/v1/conversations/:id/preference
exports.updateParticipantPreference = async (req, res, next) => {
  try {
    const { isArchived, isPinned, isMuted, isLocked, customWallpaper } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const participant = conversation.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({ success: false, message: 'Not a participant of this conversation' });
    }

    if (isArchived !== undefined) participant.isArchived = isArchived;
    if (isPinned !== undefined) participant.isPinned = isPinned;
    if (isMuted !== undefined) participant.isMuted = isMuted;
    if (isLocked !== undefined) participant.isLocked = isLocked;
    if (customWallpaper !== undefined) participant.customWallpaper = customWallpaper;

    await conversation.save();
    res.json({ success: true, preference: participant });
  } catch (error) {
    next(error);
  }
};

// @desc Set disappearing messages timer
// @route PUT /api/v1/conversations/:id/disappearing
exports.setDisappearingTimer = async (req, res, next) => {
  try {
    const { timer } = req.body; // 0, 86400, 604800, 7776000
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    conversation.disappearingTimer = Number(timer) || 0;
    await conversation.save();

    let timerText = 'turned off';
    if (timer === 86400) timerText = '24 hours';
    else if (timer === 604800) timerText = '7 days';
    else if (timer === 7776000) timerText = '90 days';

    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      type: 'system',
      text: `${req.user.name} set disappearing messages to ${timerText}`,
    });

    res.json({ success: true, disappearingTimer: conversation.disappearingTimer });
  } catch (error) {
    next(error);
  }
};

// @desc Join group via invite link code
// @route POST /api/v1/conversations/join/:inviteCode
exports.joinByInviteCode = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ inviteCode: req.params.inviteCode });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite code' });
    }

    const currentUserId = req.user._id;
    const isMember = conversation.participants.some(
      (p) => p.user.toString() === currentUserId.toString()
    );

    if (!isMember) {
      conversation.participants.push({ user: currentUserId, role: 'member' });
      await conversation.save();

      await Message.create({
        conversation: conversation._id,
        sender: currentUserId,
        type: 'system',
        text: `${req.user.name} joined using this group's invite link`,
      });
    }

    res.json({ success: true, conversationId: conversation._id });
  } catch (error) {
    next(error);
  }
};

// @desc Clear all messages in chat for current user
// @route DELETE /api/v1/conversations/:id/clear
exports.clearChat = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    await Message.updateMany(
      { conversation: req.params.id },
      { $addToSet: { deletedFor: currentUserId } }
    );
    res.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    next(error);
  }
};

