const Community = require('../models/Community');
const Conversation = require('../models/Conversation');

// @desc Get all communities
// @route GET /api/v1/communities
exports.getCommunities = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const communities = await Community.find({
      $or: [{ members: currentUserId }, { owner: currentUserId }],
    })
      .populate('owner', 'name avatar')
      .populate({
        path: 'announcementGroup',
        select: 'name avatar lastMessage',
        populate: { path: 'lastMessage', select: 'text createdAt' },
      })
      .populate('groups', 'name avatar participants')
      .sort({ createdAt: -1 });

    res.json({ success: true, communities });
  } catch (error) {
    next(error);
  }
};

// @desc Create community
// @route POST /api/v1/communities
exports.createCommunity = async (req, res, next) => {
  try {
    const { name, description, avatar } = req.body;
    const currentUserId = req.user._id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Community name is required' });
    }

    // Create an announcement group for this community
    const announcementGroup = await Conversation.create({
      name: `${name} Announcements`,
      description: `Official announcements for ${name}`,
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      isGroup: true,
      participants: [{ user: currentUserId, role: 'admin' }],
      admins: [currentUserId],
      createdBy: currentUserId,
      groupSettings: {
        onlyAdminsCanSend: true,
        onlyAdminsCanEditInfo: true,
      },
    });

    const community = await Community.create({
      name,
      description: description || '',
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      owner: currentUserId,
      announcementGroup: announcementGroup._id,
      groups: [announcementGroup._id],
      members: [currentUserId],
    });

    res.status(201).json({ success: true, community });
  } catch (error) {
    next(error);
  }
};
