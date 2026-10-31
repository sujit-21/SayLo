import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  ChevronRight,
  MessageSquare,
  Megaphone,
  Radio,
  Check,
  Copy,
  Trash2,
  LogOut,
  Info,
  Shield,
  Compass,
  Share2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CommunitiesPage = () => {
  const navigate = useNavigate();
  const { selectConversation, fetchConversations } = useChat();
  const { user } = useAuth();

  const [communities, setCommunities] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeTab, setActiveTab] = useState('communities'); // 'communities' | 'channels'

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);
  const [showCommunityInfoModal, setShowCommunityInfoModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subgroupName, setSubgroupName] = useState('');
  const [subgroupDesc, setSubgroupDesc] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelHandle, setChannelHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchData = async () => {
    try {
      const [comRes, chanRes] = await Promise.all([
        api.get('/communities'),
        api.get('/channels'),
      ]);
      setCommunities(comRes.data.communities || []);
      setChannels(chanRes.data.channels || []);
    } catch (e) {
      console.error('Failed to load communities or channels', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenConversation = async (conversationId) => {
    try {
      await selectConversation(conversationId);
      navigate(`/chats/${conversationId}`);
    } catch (err) {
      console.error('Failed to open group conversation', err);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await api.post('/communities', {
        name: name.trim(),
        description: description.trim(),
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      await fetchData();
      await fetchConversations();
    } catch (e) {
      console.error(e);
      alert('Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubgroup = async (e) => {
    e.preventDefault();
    if (!subgroupName.trim() || !selectedCommunity) return;
    setLoading(true);
    try {
      await api.post(`/communities/${selectedCommunity._id}/groups`, {
        name: subgroupName.trim(),
        description: subgroupDesc.trim(),
      });
      setShowSubgroupModal(false);
      setSubgroupName('');
      setSubgroupDesc('');
      await fetchData();
      await fetchConversations();
    } catch (err) {
      console.error(err);
      alert('Failed to create sub-group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setLoading(true);
    try {
      await api.post('/channels', {
        name: channelName.trim(),
        description: channelDesc.trim(),
        handle: channelHandle.trim(),
      });
      setShowCreateChannelModal(false);
      setChannelName('');
      setChannelDesc('');
      setChannelHandle('');
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollowChannel = async (chanId) => {
    try {
      const res = await api.post(`/channels/${chanId}/follow`);
      setChannels((prev) =>
        prev.map((c) =>
          c._id === chanId
            ? {
                ...c,
                followers: res.data.isFollowing
                  ? [...(c.followers || []), user?._id]
                  : (c.followers || []).filter((f) => (f._id || f) !== user?._id),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to toggle follow channel', err);
    }
  };

  const handleDeleteCommunity = async (commId) => {
    if (!window.confirm('Are you sure you want to delete this community? All topic groups and announcements will be removed.')) {
      return;
    }
    try {
      await api.delete(`/communities/${commId}`);
      setShowCommunityInfoModal(false);
      setSelectedCommunity(null);
      await fetchData();
      await fetchConversations();
    } catch (err) {
      console.error('Failed to delete community', err);
      alert('Failed to delete community');
    }
  };

  const handleLeaveCommunity = async (commId) => {
    if (!window.confirm('Are you sure you want to leave this community?')) {
      return;
    }
    try {
      await api.post(`/communities/${commId}/leave`);
      setShowCommunityInfoModal(false);
      setSelectedCommunity(null);
      await fetchData();
      await fetchConversations();
    } catch (err) {
      console.error('Failed to leave community', err);
      alert(err.response?.data?.message || 'Failed to leave community');
    }
  };

  const handleCopyInviteLink = (commId) => {
    const inviteUrl = `${window.location.origin}/communities/join/${commId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Communities & Channels</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              WhatsApp-style topic hubs, official announcements, and broadcast channels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'communities' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Plus size={16} />
              <span>New Community</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateChannelModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Radio size={15} />
              <span>Create Channel</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('communities')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'communities'
                ? 'bg-saylo-emerald text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users size={16} />
            <span>Communities ({communities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'channels'
                ? 'bg-saylo-emerald text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Radio size={16} />
            <span>Channels ({channels.length})</span>
          </button>
        </div>

        {/* COMMUNITIES TAB CONTENT */}
        {activeTab === 'communities' && (
          <div className="space-y-4">
            {communities.length === 0 ? (
              <div className="p-8 bg-white dark:bg-[#202c33] rounded-3xl border border-gray-200 dark:border-gray-700/60 text-center shadow-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center">
                  <Users size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                  Bring Related Groups Together
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
                  Communities help neighborhoods, workplaces, schools, and hobby clubs organize multiple sub-groups under one single umbrella with broadcast announcements.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-saylo-emerald text-white rounded-xl text-xs font-semibold hover:bg-saylo-600 shadow-md transition-all active:scale-95"
                >
                  Start Your Community
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {communities.map((c) => {
                  const isOwner = (c.owner?._id || c.owner) === user?._id;
                  const topicGroups = (c.groups || []).filter((g) => g._id !== c.announcementGroup?._id);

                  return (
                    <div
                      key={c._id}
                      className="p-5 bg-white dark:bg-[#202c33] rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-md space-y-4 transition-all"
                    >
                      {/* Community Info Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <Avatar src={c.avatar} name={c.name} size="lg" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                {c.name}
                              </h3>
                              {isOwner && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saylo-emerald/15 text-saylo-emerald border border-saylo-emerald/30">
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {c.description || 'Community Hub'} • {c.members?.length || 1} member{c.members?.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCommunity(c);
                            setShowCommunityInfoModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                          title="Community Info & Options"
                        >
                          <Info size={18} />
                        </button>
                      </div>

                      {/* Official Announcement Channel */}
                      {c.announcementGroup && (
                        <div
                          onClick={() => handleOpenConversation(c.announcementGroup._id)}
                          className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-black/20 hover:bg-saylo-emerald/10 cursor-pointer border border-gray-200 dark:border-gray-700/40 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-saylo-emerald/20 text-saylo-emerald flex items-center justify-center flex-shrink-0">
                              <Megaphone size={16} />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-saylo-emerald transition-colors block">
                                {c.announcementGroup.name}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                Official announcements (Only admins post)
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}

                      {/* Topic Sub-groups List */}
                      <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800/80">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Topic Groups ({topicGroups.length})
                          </span>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCommunity(c);
                                setShowSubgroupModal(true);
                              }}
                              className="text-[11px] text-saylo-emerald hover:underline font-semibold flex items-center gap-1"
                            >
                              <Plus size={13} />
                              <span>Add Topic Group</span>
                            </button>
                          )}
                        </div>

                        {topicGroups.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 dark:bg-[#182229] rounded-2xl">
                            No topic sub-groups yet. {isOwner && 'Click above to create one!'}
                          </div>
                        ) : (
                          topicGroups.map((grp) => (
                            <div
                              key={grp._id}
                              onClick={() => handleOpenConversation(grp._id)}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 dark:bg-black/10 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer border border-gray-200/80 dark:border-gray-800/60 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                <MessageSquare size={16} className="text-gray-400 group-hover:text-saylo-emerald transition-colors" />
                                <span className="text-xs text-gray-800 dark:text-gray-300 font-medium">
                                  {grp.name}
                                </span>
                              </div>
                              <ChevronRight size={15} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CHANNELS TAB CONTENT */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Channels Directory
                </h2>
                <p className="text-[11px] text-gray-400">Discover and follow public update channels</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateChannelModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <Plus size={14} />
                <span>New Channel</span>
              </button>
            </div>

            {channels.length === 0 ? (
              <div className="p-8 bg-white dark:bg-[#202c33] rounded-3xl border border-gray-200 dark:border-gray-700/60 text-center shadow-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center">
                  <Radio size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                  Stay Updated with Channels
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
                  Channels are a one-way broadcast tool for admins to send text, photos, videos, and polls to unlimited followers.
                </p>
                <button
                  onClick={() => setShowCreateChannelModal(true)}
                  className="px-5 py-2.5 bg-saylo-emerald text-white rounded-xl text-xs font-semibold hover:bg-saylo-600 shadow-md transition-all active:scale-95"
                >
                  Create Your First Channel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((chan) => {
                  const isFollowing = (chan.followers || []).some(
                    (f) => (f._id || f) === user?._id
                  );

                  return (
                    <div
                      key={chan._id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm hover:border-saylo-emerald/50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar src={chan.avatar} name={chan.name} size="md" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 truncate">
                            {chan.name}
                            {chan.isVerified && (
                              <span className="text-saylo-emerald font-bold text-xs" title="Verified Channel">
                                ✓
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {chan.description || 'Public updates and announcements'}
                          </p>
                          <span className="text-[10px] text-saylo-600 dark:text-saylo-300 font-semibold">
                            {chan.followers?.length || 0} follower{chan.followers?.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFollowChannel(chan._id)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 ${
                          isFollowing
                            ? 'bg-gray-100 dark:bg-white/10 hover:bg-red-500/10 text-gray-700 dark:text-gray-300 hover:text-red-500 border border-gray-200 dark:border-gray-700'
                            : 'bg-saylo-emerald hover:bg-saylo-600 text-white shadow-md active:scale-95'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <Check size={14} />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE COMMUNITY MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Community"
      >
        <form onSubmit={handleCreateCommunity} className="space-y-4 select-none">
          <div className="p-3 bg-saylo-emerald/10 border border-saylo-emerald/20 rounded-2xl flex items-center gap-2.5 text-saylo-emerald text-xs">
            <Users size={18} className="flex-shrink-0" />
            <span>
              Your community will automatically include an Official Announcement Group for broadcasting to all members.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Community Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Enthusiasts, Neighborhood Club"
              required
              className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this community is for and guidelines..."
              className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE SUB-GROUP MODAL */}
      <Modal
        isOpen={showSubgroupModal}
        onClose={() => {
          setShowSubgroupModal(false);
          setSubgroupName('');
          setSubgroupDesc('');
        }}
        title={`Add Topic Group to ${selectedCommunity?.name || 'Community'}`}
      >
        <form onSubmit={handleCreateSubgroup} className="space-y-4 select-none">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Topic Group Name
            </label>
            <input
              type="text"
              value={subgroupName}
              onChange={(e) => setSubgroupName(e.target.value)}
              placeholder="e.g. Design Critiques, Project Alpha"
              required
              className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={subgroupDesc}
              onChange={(e) => setSubgroupDesc(e.target.value)}
              placeholder="What should be discussed in this sub-group?"
              className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowSubgroupModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Topic Group'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE CHANNEL MODAL */}
      <Modal
        isOpen={showCreateChannelModal}
        onClose={() => {
          setShowCreateChannelModal(false);
          setChannelName('');
          setChannelDesc('');
          setChannelHandle('');
        }}
        title="Create New Channel"
      >
        <form onSubmit={handleCreateChannel} className="space-y-4 select-none">
          <div className="p-3 bg-saylo-emerald/10 border border-saylo-emerald/20 rounded-2xl flex items-center gap-2.5 text-saylo-emerald text-xs">
            <Radio size={18} className="flex-shrink-0" />
            <span>
              Anyone can discover your channel and read updates. Your phone number is never shown to followers.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Channel Name
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. Daily Tech Highlights, Official Updates"
              required
              className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Handle (Optional)
            </label>
            <input
              type="text"
              value={channelHandle}
              onChange={(e) => setChannelHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="e.g. saylo_tech"
              className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={channelDesc}
              onChange={(e) => setChannelDesc(e.target.value)}
              placeholder="Describe what followers can expect from this channel..."
              className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowCreateChannelModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* COMMUNITY INFO & MANAGEMENT MODAL */}
      {selectedCommunity && (
        <Modal
          isOpen={showCommunityInfoModal}
          onClose={() => {
            setShowCommunityInfoModal(false);
            setSelectedCommunity(null);
          }}
          title="Community Information"
        >
          <div className="space-y-5 select-none">
            {/* Header / Avatar */}
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-[#111b21] rounded-2xl border border-gray-200 dark:border-gray-800">
              <Avatar src={selectedCommunity.avatar} name={selectedCommunity.name} size="2xl" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-3">
                {selectedCommunity.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                {selectedCommunity.description || 'Community hub for topic discussions and announcements.'}
              </p>
            </div>

            {/* Invite Link Box */}
            <div className="p-3 bg-gray-50 dark:bg-[#182229] rounded-2xl border border-gray-200 dark:border-gray-700/60 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Invite Link
                </span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate block">
                  {`${window.location.origin}/communities/join/${selectedCommunity._id}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyInviteLink(selectedCommunity._id)}
                className="p-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm flex-shrink-0"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Danger / Member Actions */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
              {(selectedCommunity.owner?._id || selectedCommunity.owner) === user?._id ? (
                <button
                  type="button"
                  onClick={() => handleDeleteCommunity(selectedCommunity._id)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                  <span>Delete Community</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLeaveCommunity(selectedCommunity._id)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Leave Community</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CommunitiesPage;
