const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    customWallpaper: {
      type: String,
      default: '',
    },
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    isChannel: {
      type: Boolean,
      default: false,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    isNoteToSelf: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    participants: [participantSchema],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    disappearingTimer: {
      type: Number,
      default: 0, // 0 = off, 86400 = 24h, 604800 = 7d, 7776000 = 90d
    },
    inviteCode: {
      type: String,
      sparse: true,
    },
    groupSettings: {
      onlyAdminsCanSend: {
        type: Boolean,
        default: false,
      },
      onlyAdminsCanEditInfo: {
        type: Boolean,
        default: false,
      },
      approveNewMembers: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
