const Status = require('../models/Status');
const User = require('../models/User');

// @desc Create a status story
// @route POST /api/v1/status
exports.createStatus = async (req, res, next) => {
  try {
    const { type, content, caption, bgColor, fontStyle } = req.body;
    const currentUserId = req.user._id;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Status content is required' });
    }

    const status = await Status.create({
      user: currentUserId,
      type: type || 'text',
      content,
      caption: caption || '',
      bgColor: bgColor || '#075e54',
      fontStyle: fontStyle || 'sans',
    });

    const populated = await Status.findById(status._id).populate('user', 'name avatar');
    res.status(201).json({ success: true, status: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Get active statuses (my status + contacts' statuses)
// @route GET /api/v1/status
exports.getStatuses = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);
    const contactIds = [...(currentUser.contacts || []), currentUserId];

    const statuses = await Status.find({
      user: { $in: contactIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'name avatar')
      .populate('viewers.user', 'name avatar')
      .sort({ createdAt: -1 });

    // Group statuses by user
    const grouped = {};
    statuses.forEach((st) => {
      const uid = st.user._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: st.user,
          isSelf: uid === currentUserId.toString(),
          items: [],
          hasUnviewed: false,
          lastUpdated: st.createdAt,
        };
      }
      grouped[uid].items.push(st);

      // Check if unviewed
      const viewed = st.viewers.some((v) => v.user?._id?.toString() === currentUserId.toString());
      if (!viewed && uid !== currentUserId.toString()) {
        grouped[uid].hasUnviewed = true;
      }
    });

    res.json({ success: true, statuses: Object.values(grouped) });
  } catch (error) {
    next(error);
  }
};

// @desc Mark status as viewed
// @route POST /api/v1/status/:id/view
exports.viewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const status = await Status.findById(id);
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    const alreadyViewed = status.viewers.some((v) => v.user.toString() === currentUserId.toString());
    if (!alreadyViewed) {
      status.viewers.push({ user: currentUserId, viewedAt: new Date() });
      await status.save();
    }

    res.json({ success: true, message: 'Status marked as viewed' });
  } catch (error) {
    next(error);
  }
};

// @desc Delete own status
// @route DELETE /api/v1/status/:id
exports.deleteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const status = await Status.findOneAndDelete({ _id: id, user: currentUserId });
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found or not authorized' });
    }

    res.json({ success: true, message: 'Status deleted successfully' });
  } catch (error) {
    next(error);
  }
};
