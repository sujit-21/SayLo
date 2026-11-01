import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  Trash2,
  Ban,
  UserPlus,
  LogOut,
  Link2,
  Copy,
  Check,
  Settings2,
  QrCode,
  Image,
  FileText,
  ExternalLink,
  FileEdit,
  Edit3,
  Search,
  Music,
  Volume2,
  Play,
  Download,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sound } from '../../utils/sound';
import api from '../../services/api';

const ChatInfoPanel = ({ isOpen, onClose, onOpenMedia }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    selectConversation,
    fetchConversations,
    messages,
    contactNotes,
    updateContactNote,
    getContactNickname,
    clearChat,
  } = useChat();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [shareRecentHistory, setShareRecentHistory] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [mediaTab, setMediaTab] = useState('media'); // 'media', 'docs', 'links'

  // Nickname & Notes State
  const [nicknameInput, setNicknameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Group Participants Search Filter & Custom Sound & Clear Chat
  const [participantSearch, setParticipantSearch] = useState('');
  const [customTone, setCustomTone] = useState('chime');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);

  useEffect(() => {
    if (activeConversation?._id) {
      const savedTone =
        localStorage.getItem(`saylo_tone_${activeConversation._id}`) ||
        localStorage.getItem('saylo_notification_tone') ||
        'chime';
      setCustomTone(savedTone);
      setParticipantSearch('');
    }
  }, [activeConversation?._id]);

  const handleSelectTone = (toneId) => {
    setCustomTone(toneId);
    if (activeConversation?._id) {
      localStorage.setItem(`saylo_tone_${activeConversation._id}`, toneId);
    }
    sound.playTone(toneId);
  };

  const handleExecuteClearChat = async () => {
    if (!activeConversation?._id) return;
    try {
      setClearingChat(true);
      await clearChat(activeConversation._id);
      setShowClearModal(false);
    } catch (e) {
      alert('Failed to clear conversation messages');
    } finally {
      setClearingChat(false);
    }
  };

  const isGroup = activeConversation?.isGroup;
  const isAdmin = activeConversation?.admins?.some(
    (a) => (a._id || a) === user?._id
  );

  let displayName = activeConversation?.name;
  let displayAvatar = activeConversation?.avatar;
  let displayAbout = activeConversation?.description;
  let otherUser = null;

  if (activeConversation && !isGroup && !activeConversation.isNoteToSelf) {
    otherUser = activeConversation.participants?.find(
      (p) => (p.user?._id || p.user) !== user?._id
    )?.user;
    if (otherUser) {
      displayName = getContactNickname(otherUser._id, otherUser.name);
      displayAvatar = otherUser.avatar;
      displayAbout = otherUser.about || 'Hey there! I am using SAYLO.';
    }
  }

  // Synchronize contact notes input
  useEffect(() => {
    if (otherUser?._id) {
      const uId = otherUser._id.toString();
      setNicknameInput(contactNotes?.[uId]?.nickname || '');
      setNotesInput(contactNotes?.[uId]?.notes || '');
    }
  }, [otherUser?._id, contactNotes]);

  if (!isOpen || !activeConversation) return null;

  const handleSaveContactDetails = async (e) => {
    e.preventDefault();
    if (!otherUser?._id) return;
    setSavingNote(true);
    try {
      await updateContactNote(otherUser._id, nicknameInput.trim(), notesInput.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save contact details');
    } finally {
      setSavingNote(false);
    }
  };

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
  const handleToggleAdminRole = async (targetUserId, newRole) => {
    try {
      const res = await api.put(
        `/conversations/group/${activeConversation._id}/members/${targetUserId}/role`,
        { role: newRole }
      );
      selectConversation(res.data.conversation);
      fetchConversations();
    } catch (err) {
      console.error(err);
      alert('Failed to update admin status');
    }
  };

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

  // Export full chat history
  const handleExportChat = (fileType = 'txt') => {
    if (!messages || messages.length === 0) {
      alert('No messages to export in this conversation.');
      return;
    }

    let fileContent = '';
    let mimeType = 'text/plain;charset=utf-8';
    let extension = 'txt';

    if (fileType === 'json') {
      fileContent = JSON.stringify(messages, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      fileContent =
        `========================================\nSAYLO CHAT EXPORT: ${displayName}\nDate of Export: ${new Date().toLocaleString()}\nMessages Count: ${messages.length}\n========================================\n\n` +
        messages
          .map((m) => {
            const time = new Date(m.createdAt || Date.now()).toLocaleString();
            const senderName =
              m.sender?.name ||
              ((m.sender?._id || m.sender) === user?._id ? user?.name : 'Participant');
            const msgBody = m.deletedForEveryone
              ? '[This message was deleted]'
              : m.text || (m.mediaUrl ? `[Attachment: ${m.type || 'Media'}]` : '');
            return `[${time}] ${senderName}: ${msgBody}`;
          })
          .join('\n');
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAYLO_${displayName.replace(/[^a-zA-Z0-9]/g, '_')}_chat.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter media items for gallery
  const chatMedia = (messages || []).filter((m) => m.type === 'image' || m.type === 'video');
  const chatDocs = (messages || []).filter((m) => m.type === 'document');
  const chatLinks = (messages || []).filter((m) => m.linkPreview || (m.text && m.text.match(/https?:\/\/[^\s]+/i)));
  const chatStarred = (messages || []).filter(
    (m) => m.isStarred || (m.starredBy && m.starredBy.some((id) => (id._id || id) === user?._id))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed md:relative inset-y-0 right-0 w-full sm:w-80 lg:w-96 h-full bg-white dark:bg-[#111b21] border-l border-gray-200 dark:border-gray-800 flex flex-col z-40 md:z-30 overflow-y-auto animate-fadeIn shadow-2xl md:shadow-none">
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="md:hidden p-1.5 -ml-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            title="Close info"
          >
            <X size={20} />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">
            {isGroup ? 'Group info' : 'Contact info'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="hidden md:flex p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          title="Close panel"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40">
          <Avatar src={displayAvatar} name={displayName} size="2xl" className="mb-3" />
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
          {otherUser?.username && (
            <p className="text-xs text-saylo-emerald dark:text-saylo-400 font-mono font-medium mt-0.5">
              @{otherUser.username}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[220px]">{displayAbout}</p>
        </div>

        {/* Media, Docs, Links & Starred Gallery Section */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700/50">
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">Shared Content</span>
            <span className="text-[11px] text-saylo-emerald font-semibold">
              {chatMedia.length + chatDocs.length + chatLinks.length + chatStarred.length} items
            </span>
          </div>

          {/* Sub-tabs */}
          <div className="grid grid-cols-4 gap-1 bg-white dark:bg-[#111b21] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setMediaTab('media')}
              className={`py-1 text-[11px] font-semibold rounded-lg transition-colors truncate ${
                mediaTab === 'media'
                  ? 'bg-saylo-emerald text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Media ({chatMedia.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTab('docs')}
              className={`py-1 text-[11px] font-semibold rounded-lg transition-colors truncate ${
                mediaTab === 'docs'
                  ? 'bg-saylo-emerald text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Docs ({chatDocs.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTab('links')}
              className={`py-1 text-[11px] font-semibold rounded-lg transition-colors truncate ${
                mediaTab === 'links'
                  ? 'bg-saylo-emerald text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Links ({chatLinks.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTab('starred')}
              className={`py-1 text-[11px] font-semibold rounded-lg transition-colors truncate ${
                mediaTab === 'starred'
                  ? 'bg-saylo-emerald text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              ⭐ Starred ({chatStarred.length})
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="max-h-52 overflow-y-auto">
            {mediaTab === 'media' && (
              chatMedia.length === 0 ? (
                <p className="text-center py-6 text-[11px] text-gray-500">No photos or videos shared yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {chatMedia.map((m) => (
                    <div
                      key={m._id}
                      onClick={() => onOpenMedia && onOpenMedia(m.mediaUrl, m.mediaName || 'Media', m.type)}
                      className="aspect-square rounded-xl overflow-hidden bg-black/10 dark:bg-black/40 cursor-pointer hover:opacity-80 transition-opacity relative group"
                    >
                      {m.type === 'video' ? (
                        <video src={m.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.mediaUrl} alt={m.mediaName} className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {mediaTab === 'docs' && (
              chatDocs.length === 0 ? (
                <p className="text-center py-6 text-[11px] text-gray-500">No documents shared yet</p>
              ) : (
                <div className="space-y-1.5">
                  {chatDocs.map((m) => (
                    <a
                      key={m._id}
                      href={m.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-xl bg-black/5 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-black/40 transition-colors"
                    >
                      <FileText size={16} className="text-saylo-emerald flex-shrink-0" />
                      <div className="truncate flex-1">
                        <p className="text-xs text-gray-800 dark:text-gray-200 truncate font-medium">{m.mediaName || 'File'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {m.mediaSize ? `${(m.mediaSize / 1024).toFixed(1)} KB` : 'Document'}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )
            )}

            {mediaTab === 'links' && (
              chatLinks.length === 0 ? (
                <p className="text-center py-6 text-[11px] text-gray-500">No web links shared yet</p>
              ) : (
                <div className="space-y-1.5">
                  {chatLinks.map((m) => {
                    const url = m.linkPreview?.url || m.text?.match(/https?:\/\/[^\s]+/i)?.[0];
                    return (
                      <a
                        key={m._id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-xl bg-black/5 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-black/40 transition-colors"
                      >
                        <ExternalLink size={16} className="text-saylo-emerald flex-shrink-0" />
                        <div className="truncate flex-1">
                          <p className="text-xs text-gray-800 dark:text-gray-200 truncate font-medium">
                            {m.linkPreview?.title || url}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{url}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )
            )}

            {mediaTab === 'starred' && (
              chatStarred.length === 0 ? (
                <p className="text-center py-6 text-[11px] text-gray-500">No starred messages in this chat</p>
              ) : (
                <div className="space-y-1.5">
                  {chatStarred.map((m) => (
                    <div
                      key={m._id}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-black/25 hover:bg-black/10 dark:hover:bg-black/40 border border-amber-500/20 text-xs space-y-1 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] text-amber-500 dark:text-amber-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Star size={11} className="fill-amber-400" />
                          {m.sender?.name || 'Message'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-normal">
                          {format(new Date(m.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 line-clamp-2">
                        {m.text || `[Attachment: ${m.type || 'Media'}]`}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Contact Nickname & Private Notes Card (1-on-1 Chats) */}
        {otherUser && (
          <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-saylo-emerald">
                <FileEdit size={16} />
                <span className="text-xs font-semibold">Private Nickname & Notes</span>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">Only visible to you</span>
            </div>

            <form onSubmit={handleSaveContactDetails} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Nickname
                </label>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder={`Set private nickname for ${otherUser.name}...`}
                  maxLength={50}
                  className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Private Direct Notes
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Met at tech conference, works on client team..."
                  maxLength={1000}
                  className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700/80 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {savedSuccess ? (
                  <span className="text-xs text-saylo-emerald flex items-center gap-1 font-medium">
                    <Check size={14} /> Saved privately
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500">Doesn't affect their profile</span>
                )}
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-3.5 py-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingNote ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security / Verification */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-2">
          <div className="flex items-center gap-2.5 text-saylo-emerald">
            <ShieldCheck size={18} />
            <span className="text-xs font-semibold">Security & Privacy</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            All private conversations, calls, and group updates are protected by SAYLO TLS encryption & verified session tokens.
          </p>
        </div>

        {/* Disappearing Messages Settings Preview */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-saylo-600 dark:text-saylo-400" />
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 block">Disappearing messages</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
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
            <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-2.5">
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 block">Invite to group via link</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-black/20 border border-gray-200 dark:border-gray-700/60">
                <div className="flex items-center gap-2 truncate mr-2">
                  <Link2 size={16} className="text-saylo-emerald flex-shrink-0" />
                  <span className="text-[11px] text-gray-700 dark:text-gray-300 font-mono truncate">
                    {window.location.origin}/chats?join={activeConversation.inviteCode || 'saylo2026'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                    title="QR Code"
                  >
                    <QrCode size={15} />
                  </button>
                  <button
                    onClick={handleCopyInviteLink}
                    className="p-1 text-saylo-emerald hover:text-saylo-600 dark:hover:text-saylo-300 rounded"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {showQr && (
                <div className="p-3 bg-white rounded-xl text-center border border-gray-200">
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
              <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-2.5">
                <div className="flex items-center gap-2 text-saylo-emerald">
                  <Settings2 size={16} />
                  <span className="text-xs font-semibold">Group Permissions</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-700 dark:text-gray-300">Only admins can send messages</span>
                  <input
                    type="checkbox"
                    checked={!!activeConversation.groupSettings?.onlyAdminsCanSend}
                    onChange={() => handleToggleSetting('onlyAdminsCanSend')}
                    className="rounded text-saylo-emerald focus:ring-saylo-emerald"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-700 dark:text-gray-300">Only admins can edit group info</span>
                  <input
                    type="checkbox"
                    checked={!!activeConversation.groupSettings?.onlyAdminsCanEditInfo}
                    onChange={() => handleToggleSetting('onlyAdminsCanEditInfo')}
                    className="rounded text-saylo-emerald focus:ring-saylo-emerald"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-700 dark:text-gray-300">Approve new members (Join queue)</span>
                  <input
                    type="checkbox"
                    checked={!!activeConversation.groupSettings?.approveNewMembers}
                    onChange={() => handleToggleSetting('approveNewMembers')}
                    className="rounded text-saylo-emerald focus:ring-saylo-emerald"
                  />
                </div>
              </div>
            )}

            {/* Pending Member Join Requests Queue */}
            {isAdmin && activeConversation.joinRequests && activeConversation.joinRequests.length > 0 && (
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Pending Join Requests ({activeConversation.joinRequests.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {activeConversation.joinRequests.map((req) => {
                    const u = req.user;
                    if (!u) return null;
                    return (
                      <div key={u._id} className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-black/30">
                        <div className="flex items-center gap-2 truncate mr-2">
                          <Avatar src={u.avatar} name={u.name} size="xs" />
                          <span className="text-xs text-gray-800 dark:text-gray-200 font-medium truncate">{u.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await api.post(
                                  `/conversations/group/${activeConversation._id}/join-requests/${u._id}/approve`
                                );
                                selectConversation(res.data.conversation);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-2 py-1 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-lg text-[10px] font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await api.post(
                                  `/conversations/group/${activeConversation._id}/join-requests/${u._id}/reject`
                                );
                                selectConversation(res.data.conversation);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-[10px] font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Group Participants Section */}
        {isGroup && (
          <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
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
              <form onSubmit={handleAddMember} className="space-y-2 bg-gray-100 dark:bg-[#182229] p-2.5 rounded-xl border border-gray-200 dark:border-gray-700/60 animate-fadeIn">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Search name, @username, or email..."
                    required
                    className="flex-1 bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="bg-saylo-emerald hover:bg-saylo-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Add
                  </button>
                </div>

                {/* WhatsApp Share Recent Chat History Toggle (2025 feature) */}
                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={shareRecentHistory}
                    onChange={(e) => setShareRecentHistory(e.target.checked)}
                    className="mt-0.5 rounded text-saylo-emerald focus:ring-saylo-emerald w-3.5 h-3.5"
                  />
                  <div>
                    <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 block leading-tight">
                      Share recent chat history
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block leading-snug">
                      Allows new member to read the recent 50 messages to catch up on group context.
                    </span>
                  </div>
                </label>
              </form>
            )}

            {/* Participant Instant Search Filter */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search participants..."
                className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeConversation.participants
                ?.filter((p) => {
                  if (!participantSearch.trim()) return true;
                  const q = participantSearch.toLowerCase();
                  return (
                    p.user?.name?.toLowerCase().includes(q) ||
                    p.user?.email?.toLowerCase().includes(q) ||
                    p.user?.about?.toLowerCase().includes(q)
                  );
                })
                .map((p) => {
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
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block truncate">
                          {pUser.name} {pUser._id === user._id && '(You)'}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{pUser.about}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMemberAdmin && (
                        <span className="text-[10px] bg-saylo-emerald/20 text-saylo-emerald px-1.5 py-0.5 rounded font-semibold">
                          Admin
                        </span>
                      )}
                      {isAdmin && pUser._id !== user._id && (
                        <>
                          <button
                            onClick={() =>
                              handleToggleAdminRole(pUser._id, isMemberAdmin ? 'member' : 'admin')
                            }
                            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                              isMemberAdmin
                                ? 'border-amber-500/40 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10'
                                : 'border-saylo-emerald/40 text-saylo-emerald hover:bg-saylo-emerald/10'
                            }`}
                            title={isMemberAdmin ? 'Dismiss as admin' : 'Make group admin'}
                          >
                            {isMemberAdmin ? 'Dismiss' : 'Make admin'}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(pUser._id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remove member"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Notification Tone */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-1.5">
              <Volume2 size={15} className="text-saylo-emerald" />
              Custom Notification Tone
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium capitalize">{customTone}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'chime', name: 'Emerald Chime' },
              { id: 'droplet', name: 'Water Droplet' },
              { id: 'bell', name: 'Modern Bell' },
              { id: 'cosmic', name: 'Cosmic Ping' },
              { id: 'pop', name: 'Bubble Pop' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTone(t.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                  customTone === t.id
                    ? 'bg-saylo-emerald text-white font-semibold shadow-sm'
                    : 'bg-white dark:bg-[#111b21] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700/50'
                }`}
              >
                <span className="truncate">{t.name}</span>
                <Play size={10} className={customTone === t.id ? 'fill-white' : 'fill-gray-400'} />
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Export Chat, Clear Chat, Leave Group or Block User */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700/40">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExportChat('txt')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-100 dark:bg-white/5 hover:bg-saylo-emerald/15 hover:text-saylo-emerald text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors border border-gray-200 dark:border-gray-700/60"
              title="Export as formatted text file"
            >
              <Download size={15} />
              <span>Export (.txt)</span>
            </button>
            <button
              onClick={() => handleExportChat('json')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-100 dark:bg-white/5 hover:bg-saylo-emerald/15 hover:text-saylo-emerald text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors border border-gray-200 dark:border-gray-700/60"
              title="Export as structured JSON data"
            >
              <FileText size={15} />
              <span>Export (.json)</span>
            </button>
          </div>

          <button
            onClick={() => setShowClearModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold rounded-xl transition-colors"
          >
            <Trash2 size={16} />
            Clear Chat
          </button>

          {isGroup ? (
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold rounded-xl transition-colors"
            >
              <LogOut size={16} />
              Exit Group
            </button>
          ) : (
            otherUser && (
              <button
                onClick={handleBlockUser}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold rounded-xl transition-colors"
              >
                <Ban size={16} />
                Block {displayName}
              </button>
            )
          )}
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Chat?"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            Are you sure you want to clear all messages in this chat? All messages in this conversation thread will be removed from your view.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowClearModal(false)}
              className="px-4 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={clearingChat}
              onClick={handleExecuteClearChat}
              className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors"
            >
              {clearingChat ? 'Clearing...' : 'Clear Chat'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatInfoPanel;

