const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyAccount,
  setupTwoFactor,
  setupChatLockPin,
  updatePrivacy,
  updatePublicKey,
  exportChatBackup,
  restoreChatBackup,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-account', protect, verifyAccount);
router.post('/two-factor', protect, setupTwoFactor);
router.post('/chat-lock-pin', protect, setupChatLockPin);
router.put('/privacy', protect, updatePrivacy);
router.put('/public-key', protect, updatePublicKey);
router.get('/backup', protect, exportChatBackup);
router.post('/restore', protect, restoreChatBackup);

module.exports = router;

