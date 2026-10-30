const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      default: 'Hey there! I am using SAYLO.',
      maxlength: [139, 'About cannot exceed 139 characters'],
    },
    publicKey: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorPin: {
      type: String,
      select: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    privacy: {
      lastSeen: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      profilePhoto: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      about: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone',
      },
      readReceipts: {
        type: Boolean,
        default: true,
      },
      disappearingDefaultTimer: {
        type: Number,
        default: 0, // 0 = off, 86400 (24h), 604800 (7d), 7776000 (90d)
      },
      silenceUnknownCallers: {
        type: Boolean,
        default: false,
      },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    theme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'dark',
    },
    wallpaper: {
      type: String,
      default: 'default',
    },
    chatLockPin: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

