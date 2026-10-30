const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'voice'],
      default: 'text',
    },
    mediaDuration: {
      type: Number,
      default: 0,
    },
    content: {
      type: String, // Text message or media URL
      required: true,
    },
    caption: {
      type: String,
      default: '',
    },
    bgColor: {
      type: String,
      default: '#075e54',
    },
    fontStyle: {
      type: String,
      default: 'sans',
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    privacy: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody', 'whitelist', 'blacklist'],
      default: 'contacts',
    },
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deniedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Status', statusSchema);

