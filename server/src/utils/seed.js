require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Status = require('../models/Status');
const Channel = require('../models/Channel');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saylo';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Status.deleteMany({});
    await Channel.deleteMany({});
    console.log('[Seed] Cleared existing data.');

    // 1. Create Users
    const alice = await User.create({
      name: 'Alice Morgan',
      email: 'alice@saylo.com',
      password: 'password123',
      phone: '+1 (555) 019-2831',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      about: 'Designing modern experiences 🚀',
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
    });

    const bob = await User.create({
      name: 'Bob Miller',
      email: 'bob@saylo.com',
      password: 'password123',
      phone: '+1 (555) 014-9921',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      about: 'Building full-stack real-time web apps ⚡',
      isVerified: true,
      isOnline: false,
      lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    });

    const charlie = await User.create({
      name: 'Charlie Davis',
      email: 'charlie@saylo.com',
      password: 'password123',
      phone: '+1 (555) 018-7744',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      about: 'At the gym 🏋️‍♂️ | Coffee enthusiast ☕',
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
    });

    // Cross-link contacts
    alice.contacts = [bob._id, charlie._id];
    bob.contacts = [alice._id, charlie._id];
    charlie.contacts = [alice._id, bob._id];
    await alice.save();
    await bob.save();
    await charlie.save();
    console.log('[Seed] Users and contacts created.');

    // 2. Note to Self for Alice
    const aliceSelfChat = await Conversation.create({
      isGroup: false,
      isNoteToSelf: true,
      name: 'Message Yourself',
      participants: [{ user: alice._id, role: 'admin' }],
      createdBy: alice._id,
    });

    const selfMsg = await Message.create({
      conversation: aliceSelfChat._id,
      sender: alice._id,
      text: '📌 Welcome to your personal notepad! Pin links, ideas, and reminders here.',
      type: 'text',
      status: 'read',
    });
    aliceSelfChat.lastMessage = selfMsg._id;
    aliceSelfChat.lastMessageAt = selfMsg.createdAt;
    await aliceSelfChat.save();

    // 3. Direct Conversation between Alice and Bob
    const aliceBobChat = await Conversation.create({
      isGroup: false,
      participants: [
        { user: alice._id, role: 'member', unreadCount: 0 },
        { user: bob._id, role: 'member', unreadCount: 1 },
      ],
      createdBy: alice._id,
    });

    const msg1 = await Message.create({
      conversation: aliceBobChat._id,
      sender: bob._id,
      text: 'Hey Alice! Have you tried the new SAYLO real-time features?',
      type: 'text',
      status: 'read',
      createdAt: new Date(Date.now() - 3600000),
    });

    const msg2 = await Message.create({
      conversation: aliceBobChat._id,
      sender: alice._id,
      text: 'Hey Bob! Yes! Voice messages, video calls, polls, and disappearing messages work smoothly ✨',
      type: 'text',
      replyTo: msg1._id,
      status: 'read',
      createdAt: new Date(Date.now() - 1800000),
    });

    const msg3 = await Message.create({
      conversation: aliceBobChat._id,
      sender: alice._id,
      text: 'Here is a quick poll to test the group voting feature:',
      type: 'poll',
      poll: {
        question: 'What time is our design review today?',
        options: [
          { text: '3:00 PM EST', votes: [alice._id] },
          { text: '4:30 PM EST', votes: [bob._id] },
          { text: 'Tomorrow morning', votes: [] },
        ],
        multipleAnswers: false,
      },
      status: 'sent',
      createdAt: new Date(Date.now() - 600000),
    });

    aliceBobChat.lastMessage = msg3._id;
    aliceBobChat.lastMessageAt = msg3.createdAt;
    await aliceBobChat.save();

    // 4. Group Conversation "SAYLO Product Launch"
    const groupChat = await Conversation.create({
      name: 'SAYLO Product Launch 🚀',
      description: 'Official group for the SAYLO platform release and feature updates.',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      isGroup: true,
      participants: [
        { user: alice._id, role: 'admin', unreadCount: 0 },
        { user: bob._id, role: 'member', unreadCount: 0 },
        { user: charlie._id, role: 'member', unreadCount: 0 },
      ],
      admins: [alice._id],
      createdBy: alice._id,
      inviteCode: 'saylo2026',
    });

    const groupMsg = await Message.create({
      conversation: groupChat._id,
      sender: alice._id,
      text: 'Welcome to the SAYLO launch squad everyone! 🎉 All core features are live.',
      type: 'text',
      status: 'read',
      reactions: [
        { user: bob._id, emoji: '🔥' },
        { user: charlie._id, emoji: '🚀' },
      ],
    });

    groupChat.lastMessage = groupMsg._id;
    groupChat.lastMessageAt = groupMsg.createdAt;
    await groupChat.save();

    // 5. Sample Status Stories
    await Status.create({
      user: alice._id,
      type: 'text',
      content: 'Launching SAYLO today! 🌟 Welcome to the future of messaging.',
      bgColor: '#005c4b',
      fontStyle: 'sans',
    });

    await Status.create({
      user: charlie._id,
      type: 'text',
      content: 'Early morning coffee run ☕ Ready for the sprint!',
      bgColor: '#128c7e',
      fontStyle: 'serif',
    });

    // 6. Sample Channel
    await Channel.create({
      name: 'SAYLO Official Announcements',
      description: 'Updates, news, and releases directly from the SAYLO engineering team.',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      owner: alice._id,
      admins: [alice._id],
      followers: [alice._id, bob._id, charlie._id],
      isVerified: true,
      handle: 'saylo_official',
    });

    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

