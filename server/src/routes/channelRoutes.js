const express = require('express');
const router = express.Router();
const {
  getChannels,
  createChannel,
  toggleFollowChannel,
} = require('../controllers/channelController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getChannels);
router.post('/', protect, createChannel);
router.post('/:id/follow', protect, toggleFollowChannel);

module.exports = router;

