const express = require('express');
const router = express.Router();
const { getCallHistory, logCall } = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCallHistory);
router.post('/', protect, logCall);

module.exports = router;

