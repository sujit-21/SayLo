const crypto = require('crypto');
const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// @desc Register user
// @route POST /api/v1/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, avatar, about } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      about: about || 'Hey there! I am using SAYLO.',
    });

    const token = generateToken(user._id);

    // Create device session
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    await DeviceSession.create({
      user: user._id,
      deviceName: req.body.deviceName || 'Web Browser',
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Browser',
      os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux / Mobile',
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      token,
      isCurrent: true,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        about: user.about,
        role: user.role,
        privacy: user.privacy,
        theme: user.theme,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password, deviceName, twoFactorPin } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password +twoFactorPin');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorPin) {
        return res.status(200).json({
          success: true,
          requireTwoFactor: true,
          message: 'Two-factor PIN verification required',
        });
      }
      if (user.twoFactorPin !== twoFactorPin) {
        return res.status(400).json({ success: false, message: 'Incorrect two-factor verification PIN' });
      }
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Record session
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    await DeviceSession.create({
      user: user._id,
      deviceName: deviceName || 'Web Browser',
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Browser',
      os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux / Mobile',
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      token,
      isCurrent: true,
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        about: user.about,
        role: user.role,
        privacy: user.privacy,
        theme: user.theme,
        wallpaper: user.wallpaper,
        twoFactorEnabled: user.twoFactorEnabled,
        hasChatLockPin: !!user.chatLockPin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current logged in user
// @route GET /api/v1/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        about: user.about,
        role: user.role,
        privacy: user.privacy,
        theme: user.theme,
        wallpaper: user.wallpaper,
        twoFactorEnabled: user.twoFactorEnabled,
        hasChatLockPin: !!user.chatLockPin,
        contacts: user.contacts,
        blockedUsers: user.blockedUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile
// @route PUT /api/v1/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, about, avatar, phone, theme, wallpaper } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (about !== undefined) user.about = about;
    if (avatar) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (theme) user.theme = theme;
    if (wallpaper) user.wallpaper = wallpaper;

    await user.save();

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        about: user.about,
        role: user.role,
        privacy: user.privacy,
        theme: user.theme,
        wallpaper: user.wallpaper,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Forgot password
// @route POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Password reset link generated',
      resetToken, // for development ease and testing direct reset
    });
  } catch (error) {
    next(error);
  }
};

// @desc Reset password
// @route POST /api/v1/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successfully',
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify account
// @route POST /api/v1/auth/verify-account
exports.verifyAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isVerified = true;
    await user.save();
    res.json({ success: true, message: 'Account verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Setup two-factor PIN
// @route POST /api/v1/auth/two-factor
exports.setupTwoFactor = async (req, res, next) => {
  try {
    const { enable, pin } = req.body;
    const user = await User.findById(req.user._id);

    if (enable) {
      if (!pin || pin.length < 4) {
        return res.status(400).json({ success: false, message: 'PIN must be at least 4 digits' });
      }
      user.twoFactorEnabled = true;
      user.twoFactorPin = pin;
    } else {
      user.twoFactorEnabled = false;
      user.twoFactorPin = undefined;
    }

    await user.save();
    res.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled,
      message: user.twoFactorEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Setup / Verify chat lock PIN
// @route POST /api/v1/auth/chat-lock-pin
exports.setupChatLockPin = async (req, res, next) => {
  try {
    const { pin, action, enteredPin } = req.body;
    const user = await User.findById(req.user._id).select('+chatLockPin');

    if (action === 'verify') {
      const isValid = user.chatLockPin === enteredPin;
      return res.json({ success: true, verified: isValid });
    }

    user.chatLockPin = pin;
    await user.save();
    res.json({ success: true, message: 'Chat lock PIN set successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Update privacy settings
// @route PUT /api/v1/auth/privacy
exports.updatePrivacy = async (req, res, next) => {
  try {
    const { lastSeen, profilePhoto, about, readReceipts, disappearingDefaultTimer, silenceUnknownCallers } = req.body;
    const user = await User.findById(req.user._id);

    if (lastSeen) user.privacy.lastSeen = lastSeen;
    if (profilePhoto) user.privacy.profilePhoto = profilePhoto;
    if (about) user.privacy.about = about;
    if (readReceipts !== undefined) user.privacy.readReceipts = readReceipts;
    if (disappearingDefaultTimer !== undefined) user.privacy.disappearingDefaultTimer = disappearingDefaultTimer;
    if (silenceUnknownCallers !== undefined) user.privacy.silenceUnknownCallers = silenceUnknownCallers;

    await user.save();
    res.json({ success: true, privacy: user.privacy });
  } catch (error) {
    next(error);
  }
};

