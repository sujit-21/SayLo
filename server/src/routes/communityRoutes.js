const express = require('express');
const router = express.Router();
const {
  getCommunities,
  createCommunity,
  createCommunityGroup,
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCommunities);
router.post('/', protect, createCommunity);
router.post('/:id/groups', protect, createCommunityGroup);

module.exports = router;

