const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getUserById,
  addContact,
  removeContact,
  getContacts,
  getContactNotes,
  updateContactNote,
  toggleBlockUser,
  getBlockedUsers,
  getDeviceSessions,
  revokeDeviceSession,
  getStorageStats,
  getLinkPreview,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.get('/', protect, getContacts);
router.post('/add', protect, addContact);
router.post('/remove', protect, removeContact);
router.get('/contacts', protect, getContacts);
router.get('/contacts/notes', protect, getContactNotes);
router.post('/contacts/notes', protect, updateContactNote);
router.post('/contacts/add', protect, addContact);
router.post('/contacts/remove', protect, removeContact);
router.get('/blocked', protect, getBlockedUsers);
router.post('/block', protect, toggleBlockUser);
router.get('/devices', protect, getDeviceSessions);
router.delete('/devices/:id', protect, revokeDeviceSession);
router.get('/storage-stats', protect, getStorageStats);
router.post('/link-preview', protect, getLinkPreview);
router.get('/:id', protect, getUserById);

module.exports = router;

