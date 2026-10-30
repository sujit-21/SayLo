import React, { useState } from 'react';
import { X, ShieldCheck, Clock, Trash2, Ban, UserPlus, LogOut, Link2, Copy, Check, Settings2, QrCode } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';

const ChatInfoPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { activeConversation, selectConversation, fetchConversations } = useChat();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen || !activeConversation) return null;

  const isGroup = activeConversation.isGroup;
  const isAdmin = activeConversation.admins?.some(
    (a) => (a._id || a) === user._id
  );

  let displayName = activeConversation.name;
  let displayAvatar = activeConversation.avatar;
  let displayAbout = activeConversation.description;
  let otherUser = null;

  if (!isGroup && !activeConversation.isNoteToSelf) {
    otherUser = activeConversation.participants?.find(
      (p) => (p.user?._id || p.user) !== user._id
    )?.user;
    if (otherUser) {
      displayName = otherUser.name;
      displayAvatar = otherUser.avatar;
      displayAbout = otherUser.about || 'Hey there! I am using SAYLO.';
    }
  }

  // Handle Add Member to Group
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      // Find user by email
      const searchRes = await api.get(`/users/search?q=${encodeURIComponent(newMemberEmail.trim())}`);
      const foundUser = searchRes.data.users?.[0];

      if (!foundUser) {
        alert('User with that email not found');
        return;
      }

      const res = await api.post(`/conversations/group/${activeConversation._id}/members`, {
        memberIds: [foundUser._id],
      });

      selectConversation(res.data.conversation);
      setNewMemberEmail('');
      setAddingMember(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add member to group');
    }
  };

  // Handle Remove Member or Leave Group
  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/conversations/group/${activeConversation._id}/members/${targetUserId}`);
      const res = await api.get(`/conversations/${activeConversation._id}`);
      selectConversation(res.data.conversation);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.delete(`/conversations/group/${activeConversation._id}/members/${user._id}`);
      await fetchConversations();
      onClose();
      window.location.href = '/chats';
    } catch (err) {
      console.error(err);
    }
  };

  // Copy Invite Link
  const handleCopyInviteLink = () => {
    const code = activeConversation.inviteCode || 'saylo2026';
    const link = `${window.location.origin}/chats?join=${code}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Toggle Group Permission Setting
  const handleToggleSetting = async (key) => {
    try {
      const current = activeConversation.groupSettings?.[key] || false;
      const res = await api.put(`/conversations/group/${activeConversation._id}`, {
        groupSettings: {
          [key]: !current,
        },
      });
      selectConversation(res.data.conversation);
    } catch (err) {
      console.error(err);
    }
  };

  // Block Contact
  const handleBlockUser = async () => {
    if (!otherUser) return;
    try {
      await api.post('/users/block', { targetUserId: otherUser._id });
      alert(`User status updated.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-80 h-full bg-[#111b21] border-l border-gray-800 flex flex-col z-30 overflow-y-auto animate-fadeIn">
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-200">
          {isGroup ? 'Group info' : 'Contact info'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-[#202c33] rounded-2xl border border-gray-700/40">
          <Avatar src={displayAvatar} name={displayName} size="2xl" className="mb-3" />
          <h2 className="text-base font-bold text-gray-100">{displayName}</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-[220px]">{displayAbout}</p>
        </div>

        {/* Security / Verification */}
        <div className="p-3 bg-[#202c33] rounded-2xl border border-gray-700/40 space-y-2">
          <div className="flex items-center gap-2.5 text-saylo-emerald">
            <ShieldCheck size={18} />
            <span className="text-xs font-semibold">Security & Privacy</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            All private conversations, calls, and group updates are protected by SAYLO TLS encryption & verified session tokens.
          </p>
        </div>

        {/* Disappearing Messages Settings Preview */}
        <div className="p-3 bg-[#202c33] rounded-2xl border border-gray-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-saylo-400" />
            <div>
              <span className="text-xs font-semibold text-gray-200 block">Disappearing messages</span>
              <span className="text-[11px] text-gray-400">
                {activeConversation.disappearingTimer === 86400
                  ? '24 hours'
                  : activeConversation.disappearingTimer === 604800
                  ? '7 days'
                  : activeConversation.disappearingTimer === 7776000
                  ? '90 days'
                  : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Group Invite Link & Permissions */}
        {isGroup && (
          <>
            <div className="p-3 bg-[#202c33] rounded-2xl border border-gray-700/40 space-y-2.5">
              <span className="text-xs font-semibold text-gray-200 block">Invite to group via link</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-gray-700/60">
                <div className="flex items-center gap-2 truncate mr-2">
                  <Link2 size={16} className="text-saylo-emerald flex-shrink-0" />
                  <span className="text-[11px] text-gray-300 font-mono truncate">
                    {window.location.origin}/chats?join={activeConversation.inviteCode || 'saylo2026'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="p-1 text-gray-400 hover:text-white rounded"
                    title="QR Code"
                  >
                    <QrCode size={15} />
                  </button>
                  <button
                    onClick={handleCopyInviteLink}
                    className="p-1 text-saylo-emerald hover:text-saylo-300 rounded"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {showQr && (
                <div className="p-3 bg-white rounded-xl text-center">
                  <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto">
                    <rect x="0" y="0" width="30" height="30" fill="black" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="10" y="10" width="10" height="10" fill="black" />
                    <rect x="70" y="0" width="30" height="30" fill="black" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="80" y="10" width="10" height="10" fill="black" />
                    <rect x="0" y="70" width="30" height="30" fill="black" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="10" y="80" width="10" height="10" fill="black" />
                    <rect x="40" y="40" width="20" height="20" fill="#00A884" />
                  </svg>
                  <span className="text-[10px] text-gray-700 font-bold block mt-1">Scan to join group</span>
                </div>
              )}
            </div>

            {/* Admin Permissions */}
            {isAdmin && (
              <div className="p-3 bg-[#202c33] rounded-2xl border border-gray-700/40 space-y-2.5">
                <div className="flex items-center gap-2 text-saylo-emerald">
                  <Settings2 size={16} />
                  <span className="text-xs font-semibold">Group Permissions</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-300">Only admins can send messages</span>
                  <input
                    type="checkbox"
                    checked={!!activeConversation.groupSettings?.onlyAdminsCanSend}
                    onChange={() => handleToggleSetting('onlyAdminsCanSend')}
                    className="rounded text-saylo-emerald focus:ring-saylo-emerald"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-300">Only admins can edit group info</span>
                  <input
                    type="checkbox"
                    checked={!!activeConversation.groupSettings?.onlyAdminsCanEditInfo}
                    onChange={() => handleToggleSetting('onlyAdminsCanEditInfo')}
                    className="rounded text-saylo-emerald focus:ring-saylo-emerald"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Group Participants Section */}
        {isGroup && (
          <div className="p-3 bg-[#202c33] rounded-2xl border border-gray-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">
                {activeConversation.participants?.length || 0} participants
              </span>
              {isAdmin && (
                <button
                  onClick={() => setAddingMember(!addingMember)}
                  className="flex items-center gap-1 text-[11px] text-saylo-emerald font-semibold hover:underline"
                >
                  <UserPlus size={14} />
                  Add Member
                </button>
              )}
            </div>

            {addingMember && (
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter email..."
                  required
                  className="flex-1 bg-[#111b21] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <button
                  type="submit"
                  className="bg-saylo-emerald text-white px-2.5 py-1 rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeConversation.participants?.map((p) => {
                const pUser = p.user;
                if (!pUser) return null;
                const isMemberAdmin = activeConversation.admins?.some(
                  (a) => (a._id || a) === pUser._id
                );
                return (
                  <div key={pUser._id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5 truncate">
                      <Avatar src={pUser.avatar} name={pUser.name} size="xs" />
                      <div className="truncate">
                        <span className="text-xs font-medium text-gray-200 block truncate">
                          {pUser.name} {pUser._id === user._id && '(You)'}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate">{pUser.about}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMemberAdmin && (
                        <span className="text-[10px] bg-saylo-emerald/20 text-saylo-emerald px-1.5 py-0.5 rounded font-semibold">
                          Admin
                        </span>
                      )}
                      {isAdmin && pUser._id !== user._id && (
                        <button
                          onClick={() => handleRemoveMember(pUser._id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                          title="Remove member"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons: Leave Group or Block User */}
        <div className="space-y-2 pt-2">
          {isGroup ? (
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-colors"
            >
              <LogOut size={16} />
              Exit Group
            </button>
          ) : (
            otherUser && (
              <button
                onClick={handleBlockUser}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-colors"
              >
                <Ban size={16} />
                Block {displayName}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInfoPanel;

