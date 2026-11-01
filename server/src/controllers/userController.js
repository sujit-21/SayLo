const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');

// @desc Search users
// @route GET /api/v1/users/search?q=query
exports.searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({ success: true, users: [] });
    }

    const currentUserId = req.user._id;
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name email phone avatar about isOnline lastSeen publicKey')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc Get user profile by ID with privacy enforcement
// @route GET /api/v1/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isContact = targetUser.contacts.some((c) => c.toString() === req.user._id.toString());
    const isSelf = targetUser._id.toString() === req.user._id.toString();

    // Check privacy
    const privacy = targetUser.privacy || {};
    let showLastSeen = isSelf || privacy.lastSeen === 'everyone' || (privacy.lastSeen === 'contacts' && isContact);
    let showAvatar = isSelf || privacy.profilePhoto === 'everyone' || (privacy.profilePhoto === 'contacts' && isContact);
    let showAbout = isSelf || privacy.about === 'everyone' || (privacy.about === 'contacts' && isContact);

    res.json({
      success: true,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: isSelf ? targetUser.email : undefined,
        phone: isSelf ? targetUser.phone : undefined,
        avatar: showAvatar ? targetUser.avatar : '',
        about: showAbout ? targetUser.about : 'Hey there! I am using SAYLO.',
        isOnline: showLastSeen ? targetUser.isOnline : false,
        lastSeen: showLastSeen ? targetUser.lastSeen : null,
        publicKey: targetUser.publicKey || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add contact
// @route POST /api/v1/contacts/add
exports.addContact = async (req, res, next) => {
  try {
    const { contactId } = req.body;
    if (contactId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself to contacts' });
    }

    const user = await User.findById(req.user._id);
    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }

    const updatedUser = await User.findById(req.user._id).populate('contacts', 'name email phone avatar about isOnline lastSeen');
    res.json({ success: true, contacts: updatedUser.contacts });
  } catch (error) {
    next(error);
  }
};

// @desc Remove contact
// @route POST /api/v1/contacts/remove
exports.removeContact = async (req, res, next) => {
  try {
    const { contactId } = req.body;
    const user = await User.findById(req.user._id);
    user.contacts = user.contacts.filter((c) => c.toString() !== contactId);
    await user.save();

    const updatedUser = await User.findById(req.user._id).populate('contacts', 'name email phone avatar about isOnline lastSeen');
    res.json({ success: true, contacts: updatedUser.contacts });
  } catch (error) {
    next(error);
  }
};

// @desc Get user contacts
// @route GET /api/v1/contacts
exports.getContacts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'contacts',
      'name email phone avatar about isOnline lastSeen publicKey'
    );
    res.json({ success: true, contacts: user.contacts });
  } catch (error) {
    next(error);
  }
};

// @desc Get private contact notes and nicknames for current user
// @route GET /api/v1/users/contacts/notes
exports.getContactNotes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('contactNotes');
    res.json({ success: true, contactNotes: user.contactNotes || [] });
  } catch (error) {
    next(error);
  }
};

// @desc Set private contact nickname & direct notes
// @route POST /api/v1/users/contacts/notes
exports.updateContactNote = async (req, res, next) => {
  try {
    const { contactId, nickname, notes } = req.body;
    if (!contactId) {
      return res.status(400).json({ success: false, message: 'Contact ID is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.contactNotes) {
      user.contactNotes = [];
    }

    const existingIdx = user.contactNotes.findIndex(
      (n) => n.user.toString() === contactId.toString()
    );

    if (existingIdx >= 0) {
      if (nickname !== undefined) user.contactNotes[existingIdx].nickname = nickname;
      if (notes !== undefined) user.contactNotes[existingIdx].notes = notes;
    } else {
      user.contactNotes.push({
        user: contactId,
        nickname: nickname || '',
        notes: notes || '',
      });
    }

    await user.save();
    const updatedNote = user.contactNotes.find(
      (n) => n.user.toString() === contactId.toString()
    );

    res.json({ success: true, contactNote: updatedNote });
  } catch (error) {
    next(error);
  }
};

// @desc Block or Unblock user
// @route POST /api/v1/users/block
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const user = await User.findById(req.user._id);

    const isBlocked = user.blockedUsers.includes(targetUserId);
    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== targetUserId);
    } else {
      user.blockedUsers.push(targetUserId);
    }

    await user.save();
    const updated = await User.findById(req.user._id).populate('blockedUsers', 'name email avatar');

    res.json({
      success: true,
      isBlocked: !isBlocked,
      blockedUsers: updated.blockedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get blocked users
// @route GET /api/v1/users/blocked
exports.getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name email avatar');
    res.json({ success: true, blockedUsers: user.blockedUsers });
  } catch (error) {
    next(error);
  }
};

// @desc Get linked device sessions
// @route GET /api/v1/users/devices
exports.getDeviceSessions = async (req, res, next) => {
  try {
    const sessions = await DeviceSession.find({ user: req.user._id }).sort({ lastActive: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc Revoke device session
// @route DELETE /api/v1/users/devices/:id
exports.revokeDeviceSession = async (req, res, next) => {
  try {
    await DeviceSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Device session revoked' });
  } catch (error) {
    next(error);
  }
};

// @desc Get storage media breakdown for current user
// @route GET /api/v1/users/storage-stats
exports.getStorageStats = async (req, res, next) => {
  try {
    const Message = require('../models/Message');
    const currentUserId = req.user._id;

    const messages = await Message.find({
      sender: currentUserId,
      mediaUrl: { $ne: '' },
    }).select('type mediaSize mediaName mediaUrl createdAt');

    let photosSize = 0, photosCount = 0;
    let videosSize = 0, videosCount = 0;
    let audioSize = 0, audioCount = 0;
    let docsSize = 0, docsCount = 0;
    const largeFiles = [];

    messages.forEach((m) => {
      const sz = m.mediaSize || 0;
      if (m.type === 'image') {
        photosSize += sz;
        photosCount++;
      } else if (m.type === 'video') {
        videosSize += sz;
        videosCount++;
      } else if (m.type === 'audio' || m.type === 'voice') {
        audioSize += sz;
        audioCount++;
      } else if (m.type === 'document') {
        docsSize += sz;
        docsCount++;
      }

      if (sz > 500 * 1024) { // Files > 500KB considered noteworthy
        largeFiles.push({
          id: m._id,
          name: m.mediaName || 'Media File',
          type: m.type,
          size: sz,
          url: m.mediaUrl,
          createdAt: m.createdAt,
        });
      }
    });

    const totalSize = photosSize + videosSize + audioSize + docsSize;

    res.json({
      success: true,
      stats: {
        totalSize,
        photos: { size: photosSize, count: photosCount },
        videos: { size: videosSize, count: videosCount },
        audio: { size: audioSize, count: audioCount },
        documents: { size: docsSize, count: docsCount },
        largeFiles: largeFiles.sort((a, b) => b.size - a.size).slice(0, 15),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Fetch OpenGraph / Metadata link preview for a URL
// @route POST /api/v1/users/link-preview
exports.getLinkPreview = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Valid HTTP/HTTPS URL required' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SAYLO-LinkBot/1.0' },
    });
    clearTimeout(timeout);

    const html = await response.text();

    const getMetaContent = (propName) => {
      const match =
        html.match(new RegExp(`<meta[^>]+property=["']${propName}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propName}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+name=["']${propName}["'][^>]+content=["']([^"']+)["']`, 'i'));
      return match ? match[1] : '';
    };

    let title = getMetaContent('og:title') || getMetaContent('twitter:title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : '';
    }

    const description =
      getMetaContent('og:description') ||
      getMetaContent('twitter:description') ||
      getMetaContent('description') ||
      '';

    let image = getMetaContent('og:image') || getMetaContent('twitter:image') || '';
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, url).href;
      } catch (e) {
        image = '';
      }
    }

    const siteName = getMetaContent('og:site_name') || new URL(url).hostname;

    res.json({
      success: true,
      preview: {
        url,
        title: title.slice(0, 120),
        description: description.slice(0, 200),
        image,
        siteName,
      },
    });
  } catch (error) {
    // Return graceful fallback without crashing
    res.json({
      success: true,
      preview: {
        url: req.body.url,
        title: req.body.url,
        description: '',
        image: '',
        siteName: '',
      },
    });
  }
};


