const express = require('express');
const router = express.Router();
const {
  getCommunities,
  createCommunity,
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCommunities);
router.post('/', protect, createCommunity);

module.exports = router;
