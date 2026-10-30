const Call = require('../models/Call');

// @desc Get call history for current user
// @route GET /api/v1/calls
exports.getCallHistory = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const calls = await Call.find({
      $or: [{ caller: currentUserId }, { receiver: currentUserId }],
    })
      .populate('caller', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('conversation', 'name isGroup avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, calls });
  } catch (error) {
    next(error);
  }
};

// @desc Log a call (create or finish)
// @route POST /api/v1/calls
exports.logCall = async (req, res, next) => {
  try {
    const { receiverId, conversationId, type, status, duration } = req.body;
    const currentUserId = req.user._id;

    const call = await Call.create({
      caller: currentUserId,
      receiver: receiverId || null,
      conversation: conversationId || null,
      type: type || 'audio',
      status: status || 'completed',
      duration: duration || 0,
      endedAt: new Date(),
    });

    const populated = await Call.findById(call._id)
      .populate('caller', 'name avatar')
      .populate('receiver', 'name avatar');

    res.status(201).json({ success: true, call: populated });
  } catch (error) {
    next(error);
  }
};
