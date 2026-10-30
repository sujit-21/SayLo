const express = require('express');
const router = express.Router();
const {
  createStatus,
  getStatuses,
  viewStatus,
  deleteStatus,
} = require('../controllers/statusController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getStatuses);
router.post('/', protect, createStatus);
router.post('/:id/view', protect, viewStatus);
router.delete('/:id', protect, deleteStatus);

module.exports = router;
