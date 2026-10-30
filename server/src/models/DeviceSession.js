const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
      default: 'Web Client',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    token: {
      type: String,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);
