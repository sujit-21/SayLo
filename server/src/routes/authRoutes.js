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

module.exports = router;

