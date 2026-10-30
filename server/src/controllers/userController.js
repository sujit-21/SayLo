const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');

// @desc Search users
// @route GET /api/v1/users/search?q=query
exports.searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({ success: true, users: [] });
    }

    const currentUserId = req.user._id;
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name email phone avatar about isOnline lastSeen')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc Get user profile by ID with privacy enforcement
// @route GET /api/v1/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isContact = targetUser.contacts.some((c) => c.toString() === req.user._id.toString());
    const isSelf = targetUser._id.toString() === req.user._id.toString();

    // Check privacy
    const privacy = targetUser.privacy || {};
    let showLastSeen = isSelf || privacy.lastSeen === 'everyone' || (privacy.lastSeen === 'contacts' && isContact);
    let showAvatar = isSelf || privacy.profilePhoto === 'everyone' || (privacy.profilePhoto === 'contacts' && isContact);
    let showAbout = isSelf || privacy.about === 'everyone' || (privacy.about === 'contacts' && isContact);

    res.json({
      success: true,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: isSelf ? targetUser.email : undefined,
        phone: isSelf ? targetUser.phone : undefined,
        avatar: showAvatar ? targetUser.avatar : '',
        about: showAbout ? targetUser.about : 'Hey there! I am using SAYLO.',
        isOnline: showLastSeen ? targetUser.isOnline : false,
        lastSeen: showLastSeen ? targetUser.lastSeen : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add contact
// @route POST /api/v1/contacts/add
exports.addContact = async (req, res, next) => {
  try {
    const { contactId } = req.body;
    if (contactId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself to contacts' });
    }

    const user = await User.findById(req.user._id);
    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }

    const updatedUser = await User.findById(req.user._id).populate('contacts', 'name email avatar about isOnline lastSeen');
    res.json({ success: true, contacts: updatedUser.contacts });
  } catch (error) {
    next(error);
  }
};

// @desc Remove contact
// @route POST /api/v1/contacts/remove
exports.removeContact = async (req, res, next) => {
  try {
    const { contactId } = req.body;
    const user = await User.findById(req.user._id);
    user.contacts = user.contacts.filter((c) => c.toString() !== contactId);
    await user.save();

    const updatedUser = await User.findById(req.user._id).populate('contacts', 'name email avatar about isOnline lastSeen');
    res.json({ success: true, contacts: updatedUser.contacts });
  } catch (error) {
    next(error);
  }
};

// @desc Get user contacts
// @route GET /api/v1/contacts
exports.getContacts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'contacts',
      'name email phone avatar about isOnline lastSeen'
    );
    res.json({ success: true, contacts: user.contacts });
  } catch (error) {
    next(error);
  }
};

// @desc Block or Unblock user
// @route POST /api/v1/users/block
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const user = await User.findById(req.user._id);

    const isBlocked = user.blockedUsers.includes(targetUserId);
    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== targetUserId);
    } else {
      user.blockedUsers.push(targetUserId);
    }

    await user.save();
    const updated = await User.findById(req.user._id).populate('blockedUsers', 'name email avatar');

    res.json({
      success: true,
      isBlocked: !isBlocked,
      blockedUsers: updated.blockedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get blocked users
// @route GET /api/v1/users/blocked
exports.getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name email avatar');
    res.json({ success: true, blockedUsers: user.blockedUsers });
  } catch (error) {
    next(error);
  }
};

// @desc Get linked device sessions
// @route GET /api/v1/users/devices
exports.getDeviceSessions = async (req, res, next) => {
  try {
    const sessions = await DeviceSession.find({ user: req.user._id }).sort({ lastActive: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc Revoke device session
// @route DELETE /api/v1/users/devices/:id
exports.revokeDeviceSession = async (req, res, next) => {
  try {
    await DeviceSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Device session revoked' });
  } catch (error) {
    next(error);
  }
};
