const express = require('express');
const router = express.Router();
const {
  getCommunities,
  createCommunity,
  getCommunityById,
  deleteCommunity,
  createCommunityGroup,
  joinCommunity,
  leaveCommunity,
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCommunities);
router.post('/', protect, createCommunity);
router.get('/:id', protect, getCommunityById);
router.delete('/:id', protect, deleteCommunity);
router.post('/:id/groups', protect, createCommunityGroup);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;

