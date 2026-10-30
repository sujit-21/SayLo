const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isGroupCall: {
      type: Boolean,
      default: false,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: Date,
        leftAt: Date,
      },
    ],
    type: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio',
    },
    callLink: {
      type: String,
      sparse: true,
      index: true,
    },
    screenSharing: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'accepted', 'rejected', 'missed', 'ended', 'completed'],
      default: 'initiated',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

callSchema.index({ caller: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Call', callSchema);
