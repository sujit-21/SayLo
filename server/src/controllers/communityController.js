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

// @desc Get single community by ID
// @route GET /api/v1/communities/:id
exports.getCommunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id)
      .populate('owner', 'name avatar email isOnline')
      .populate('members', 'name avatar email isOnline')
      .populate({
        path: 'announcementGroup',
        select: 'name avatar lastMessage participants',
      })
      .populate('groups', 'name avatar participants lastMessage');

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    res.json({ success: true, community });
  } catch (error) {
    next(error);
  }
};

// @desc Delete community
// @route DELETE /api/v1/communities/:id
exports.deleteCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.owner.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Only community owner can delete the community' });
    }

    // Delete associated announcement group & sub-groups
    if (community.groups && community.groups.length > 0) {
      await Conversation.deleteMany({ _id: { $in: community.groups } });
    }
    if (community.announcementGroup) {
      await Conversation.findByIdAndDelete(community.announcementGroup);
    }

    await Community.findByIdAndDelete(id);

    res.json({ success: true, message: 'Community deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Join community
// @route POST /api/v1/communities/:id/join
exports.joinCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (!community.members.some((m) => m.toString() === currentUserId.toString())) {
      community.members.push(currentUserId);
      await community.save();

      // Also add to announcement group
      if (community.announcementGroup) {
        const annGroup = await Conversation.findById(community.announcementGroup);
        if (annGroup && !annGroup.participants.some((p) => p.user?.toString() === currentUserId.toString())) {
          annGroup.participants.push({ user: currentUserId, role: 'member' });
          await annGroup.save();
        }
      }
    }

    res.json({ success: true, message: 'Joined community successfully', community });
  } catch (error) {
    next(error);
  }
};

// @desc Leave community
// @route POST /api/v1/communities/:id/leave
exports.leaveCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.owner.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave community. Delete it instead.' });
    }

    community.members = community.members.filter((m) => m.toString() !== currentUserId.toString());
    await community.save();

    // Remove from announcement group
    if (community.announcementGroup) {
      const annGroup = await Conversation.findById(community.announcementGroup);
      if (annGroup) {
        annGroup.participants = annGroup.participants.filter(
          (p) => (p.user?._id || p.user || p).toString() !== currentUserId.toString()
        );
        await annGroup.save();
      }
    }

    res.json({ success: true, message: 'Left community successfully' });
  } catch (error) {
    next(error);
  }
};

