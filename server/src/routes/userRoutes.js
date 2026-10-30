const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getUserById,
  addContact,
  removeContact,
  getContacts,
  toggleBlockUser,
  getBlockedUsers,
  getDeviceSessions,
  revokeDeviceSession,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.get('/contacts', protect, getContacts);
router.post('/contacts/add', protect, addContact);
router.post('/contacts/remove', protect, removeContact);
router.get('/blocked', protect, getBlockedUsers);
router.post('/block', protect, toggleBlockUser);
router.get('/devices', protect, getDeviceSessions);
router.delete('/devices/:id', protect, revokeDeviceSession);
router.get('/:id', protect, getUserById);

module.exports = router;

