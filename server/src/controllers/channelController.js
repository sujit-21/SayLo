const Channel = require('../models/Channel');

// @desc Get all channels
// @route GET /api/v1/channels
exports.getChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find()
      .populate('owner', 'name avatar')
      .populate({
        path: 'posts',
        options: { limit: 10, sort: { createdAt: -1 } },
        populate: { path: 'sender', select: 'name avatar' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, channels });
  } catch (error) {
    next(error);
  }
};

// @desc Create channel
// @route POST /api/v1/channels
exports.createChannel = async (req, res, next) => {
  try {
    const { name, description, avatar, handle } = req.body;
    const currentUserId = req.user._id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Channel name is required' });
    }

    const channel = await Channel.create({
      name,
      description: description || '',
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      owner: currentUserId,
      admins: [currentUserId],
      followers: [currentUserId],
      handle: handle || name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
    });

    res.status(201).json({ success: true, channel });
  } catch (error) {
    next(error);
  }
};

// @desc Follow / Unfollow channel
// @route POST /api/v1/channels/:id/follow
exports.toggleFollowChannel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const isFollowing = channel.followers.includes(currentUserId);
    if (isFollowing) {
      channel.followers = channel.followers.filter((uid) => uid.toString() !== currentUserId.toString());
    } else {
      channel.followers.push(currentUserId);
    }

    await channel.save();
    res.json({ success: true, isFollowing: !isFollowing, followerCount: channel.followers.length });
  } catch (error) {
    next(error);
  }
};

