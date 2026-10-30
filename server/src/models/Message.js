const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: '',
    },
    ciphertext: {
      type: String,
      default: '',
    },
    iv: {
      type: String,
      default: '',
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: [
        'text',
        'image',
        'video',
        'audio',
        'document',
        'voice',
        'poll',
        'event',
        'system',
        'location',
        'sticker',
        'gif',
        'contact',
      ],
      default: 'text',
    },
    contactCard: {
      name: String,
      phone: String,
      email: String,
      about: String,
      avatar: String,
    },
    linkPreview: {
      url: String,
      title: String,
      description: String,
      image: String,
      siteName: String,
    },
    scheduledFor: {
      type: Date,
      index: true,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaName: {
      type: String,
      default: '',
    },
    mediaSize: {
      type: Number,
      default: 0,
    },
    mediaMimeType: {
      type: String,
      default: '',
    },
    mediaDuration: {
      type: Number,
      default: 0,
    },
    viewOnce: {
      type: Boolean,
      default: false,
    },
    viewOnceOpenedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deliveredTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    forwarded: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: Date,
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // MongoDB TTL index handles automatic cleanup!
    },
    poll: {
      question: String,
      options: [
        {
          text: String,
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],
        },
      ],
      multipleAnswers: {
        type: Boolean,
        default: false,
      },
    },
    event: {
      title: String,
      description: String,
      startTime: Date,
      location: String,
      attendees: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          status: {
            type: String,
            enum: ['going', 'maybe', 'declined'],
            default: 'going',
          },
        },
      ],
    },
    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      address: String,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

