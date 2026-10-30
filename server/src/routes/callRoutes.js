const express = require('express');
const router = express.Router();
const { getCallHistory, logCall, createCallLink } = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCallHistory);
router.post('/', protect, logCall);
router.post('/link', protect, createCallLink);

module.exports = router;

