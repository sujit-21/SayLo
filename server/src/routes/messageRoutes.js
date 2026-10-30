const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  toggleStarMessage,
  getStarredMessages,
  togglePinMessage,
  markAsRead,
  votePoll,
  openViewOnce,
  rsvpEvent,
  forwardMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/starred', protect, getStarredMessages);
router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/forward', protect, forwardMessage);
router.put('/:id', protect, editMessage);
router.post('/:id/delete', protect, deleteMessage);
router.post('/:id/react', protect, reactToMessage);
router.post('/:id/star', protect, toggleStarMessage);
router.post('/:id/pin', protect, togglePinMessage);
router.post('/read', protect, markAsRead);
router.post('/:id/poll/vote', protect, votePoll);
router.post('/:id/event/rsvp', protect, rsvpEvent);
router.post('/:id/view-once', protect, openViewOnce);

module.exports = router;

