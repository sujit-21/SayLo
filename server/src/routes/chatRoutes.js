const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversationById,
  createOrGetDirectChat,
  createNoteToSelfChat,
  createGroup,
  updateGroup,
  updateMemberRole,
  addGroupMembers,
  removeGroupMember,
  updateParticipantPreference,
  setDisappearingTimer,
  joinByInviteCode,
  handleJoinRequest,
  clearChat,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getConversations);
router.post('/direct', protect, createOrGetDirectChat);
router.post('/note-to-self', protect, createNoteToSelfChat);
router.post('/group', protect, createGroup);
router.put('/group/:id', protect, updateGroup);
router.put('/group/:id/members/:userId/role', protect, updateMemberRole);
router.post('/group/:id/members', protect, addGroupMembers);
router.delete('/group/:id/members/:userId', protect, removeGroupMember);
router.post('/group/:id/join-requests/:userId/:action', protect, handleJoinRequest);
router.put('/:id/preference', protect, updateParticipantPreference);
router.put('/:id/disappearing', protect, setDisappearingTimer);
router.post('/join/:inviteCode', protect, joinByInviteCode);
router.delete('/:id/clear', protect, clearChat);
router.get('/:id', protect, getConversationById);

module.exports = router;

