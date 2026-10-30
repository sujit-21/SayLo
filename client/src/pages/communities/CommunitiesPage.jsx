import React, { useState, useEffect } from 'react';
import { Users, Plus, ChevronRight, MessageSquare, Megaphone } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';

const CommunitiesPage = () => {
  const { selectConversation } = useChat();
  const [communities, setCommunities] = useState([]);
  const [channels, setChannels] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [comRes, chanRes] = await Promise.all([
        api.get('/communities'),
        api.get('/channels'),
      ]);
      setCommunities(comRes.data.communities || []);
      setChannels(chanRes.data.channels || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (e) {
      console.error(e);
      alert('Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-100">Communities & Channels</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
        >
          <Plus size={16} />
          New Community
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-8">
        {/* Communities Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Your Communities
          </h2>

          {communities.length === 0 ? (
            <div className="p-6 bg-[#202c33] rounded-2xl border border-gray-700/60 text-center">
              <Users size={32} className="mx-auto mb-2 text-saylo-emerald" />
              <h3 className="text-sm font-bold text-white mb-1">Stay connected with a community</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                Communities bring related groups together under one roof, with official announcement channels.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-saylo-emerald text-white rounded-xl text-xs font-semibold hover:bg-saylo-600"
              >
                Start your community
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {communities.map((c) => (
                <div
                  key={c._id}
                  className="p-4 bg-[#202c33] rounded-2xl border border-gray-700/60 shadow-md space-y-3"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar src={c.avatar} name={c.name} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-100">{c.name}</h3>
                      <p className="text-xs text-gray-400">{c.description || 'Community hub'}</p>
                    </div>
                  </div>

                  {/* Announcement Channel link */}
                  {c.announcementGroup && (
                    <div
                      onClick={() => selectConversation(c.announcementGroup._id)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 hover:bg-white/5 cursor-pointer border border-gray-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Megaphone size={16} className="text-saylo-emerald" />
                        <span className="text-xs font-medium text-gray-200">
                          {c.announcementGroup.name}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Channels Directory
            </h2>
            <span className="text-xs text-saylo-emerald font-medium">Explore & Follow</span>
          </div>

          <div className="space-y-2">
            {channels.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No channels found</p>
            ) : (
              channels.map((chan) => {
                const isFollowing = chan.followers?.some(
                  (f) => (f._id || f) === user?._id
                );

                return (
                  <div
                    key={chan._id}
                    className="flex items-center justify-between p-3.5 bg-[#202c33] rounded-2xl border border-gray-700/60 shadow-sm hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={chan.avatar} name={chan.name} size="md" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-100 flex items-center gap-1.5">
                          {chan.name}
                          {chan.isVerified && (
                            <span className="text-saylo-emerald font-bold text-xs" title="Verified">✓</span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-1">{chan.description || 'Public updates channel'}</p>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {chan.followers?.length || 0} followers
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.post(`/channels/${chan._id}/follow`);
                          await fetchData();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors shadow-sm ${
                        isFollowing
                          ? 'bg-white/10 hover:bg-white/15 text-gray-300'
                          : 'bg-saylo-emerald hover:bg-saylo-600 text-white'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Community Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Community"
      >
        <form onSubmit={handleCreateCommunity} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Community Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Enthusiasts, Neighborhood"
              required
              className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this community is for..."
              className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:bg-white/5 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CommunitiesPage;

