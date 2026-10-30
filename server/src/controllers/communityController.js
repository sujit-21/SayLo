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

// @desc Add a new sub-group to an existing Community
// @route POST /api/v1/communities/:id/groups
exports.createCommunityGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;
    const currentUserId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.owner.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Only community owner can create sub-groups' });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: 'Sub-group name is required' });
    }

    const subGroup = await Conversation.create({
      name,
      description: description || `Sub-group of ${community.name}`,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      isGroup: true,
      community: community._id,
      participants: [{ user: currentUserId, role: 'admin' }],
      admins: [currentUserId],
      createdBy: currentUserId,
    });

    community.groups.push(subGroup._id);
    await community.save();

    res.status(201).json({ success: true, group: subGroup });
  } catch (error) {
    next(error);
  }
};

