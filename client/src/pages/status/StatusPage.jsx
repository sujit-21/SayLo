import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { format } from 'date-fns';

const StatusPage = () => {
  const { user } = useAuth();
  const [statusGroups, setStatusGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create status state
  const [newContent, setNewContent] = useState('');
  const [bgColor, setBgColor] = useState('#005c4b');
  const [fontStyle, setFontStyle] = useState('sans');
  const [loading, setLoading] = useState(false);

  const bgColors = ['#005c4b', '#128c7e', '#7c3aed', '#b91c1c', '#b45309', '#1e293b'];

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/status');
      setStatusGroups(res.data.statuses || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  // Open story group viewer
  const handleOpenGroup = (group) => {
    setSelectedGroup(group);
    setActiveStoryIndex(0);

    // Mark active story as viewed if not own
    if (!group.isSelf && group.items[0]) {
      api.post(`/status/${group.items[0]._id}/view`).catch(console.error);
    }
  };

  // Next story
  const nextStory = () => {
    if (!selectedGroup) return;
    if (activeStoryIndex < selectedGroup.items.length - 1) {
      const nextIdx = activeStoryIndex + 1;
      setActiveStoryIndex(nextIdx);
      if (!selectedGroup.isSelf) {
        api.post(`/status/${selectedGroup.items[nextIdx]._id}/view`).catch(console.error);
      }
    } else {
      setSelectedGroup(null);
    }
  };

  // Prev story
  const prevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  // Create Status Story
  const handleCreateStatus = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setLoading(true);
    try {
      await api.post('/status', {
        type: 'text',
        content: newContent.trim(),
        bgColor,
        fontStyle,
      });
      setShowCreateModal(false);
      setNewContent('');
      await fetchStatuses();
    } catch (e) {
      console.error(e);
      alert('Failed to post status update');
    } finally {
      setLoading(false);
    }
  };

  // Delete Status
  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm('Delete this status update?')) return;
    try {
      await api.delete(`/status/${statusId}`);
      setSelectedGroup(null);
      await fetchStatuses();
    } catch (e) {
      console.error(e);
    }
  };

  const myGroup = statusGroups.find((g) => g.isSelf);
  const otherGroups = statusGroups.filter((g) => !g.isSelf);

  return (
    <div className="flex-1 h-full flex overflow-hidden select-none bg-[#111b21]">
      {/* Left List of Statuses */}
      <div className="w-full md:w-96 h-full bg-[#111b21] border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
          <h1 className="text-xl font-bold text-gray-100">Status</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-full transition-transform active:scale-95 shadow-md"
            title="Add Status"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* My Status */}
          <div
            onClick={() => {
              if (myGroup && myGroup.items.length > 0) {
                handleOpenGroup(myGroup);
              } else {
                setShowCreateModal(true);
              }
            }}
            className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#202c33] border border-gray-700/60 cursor-pointer hover:border-saylo-emerald transition-colors"
          >
            <div className="relative">
              <Avatar src={user?.avatar} name={user?.name || 'You'} size="md" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-saylo-emerald text-white flex items-center justify-center border-2 border-[#202c33]">
                <Plus size={12} strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-100">My Status</h3>
              <p className="text-xs text-gray-400">
                {myGroup && myGroup.items.length > 0
                  ? `${myGroup.items.length} update(s)`
                  : 'Tap to add status update'}
              </p>
            </div>
          </div>

          {/* Recent Updates */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Recent Updates
            </h4>

            {otherGroups.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">
                No recent status updates from your contacts.
              </p>
            ) : (
              <div className="space-y-1">
                {otherGroups.map((group) => (
                  <div
                    key={group.user?._id}
                    onClick={() => handleOpenGroup(group)}
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#202c33] cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div
                        className={`rounded-full p-0.5 ${
                          group.hasUnviewed
                            ? 'ring-2 ring-saylo-emerald'
                            : 'ring-1 ring-gray-600'
                        }`}
                      >
                        <Avatar src={group.user?.avatar} name={group.user?.name} size="md" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-100 truncate">
                        {group.user?.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {format(new Date(group.lastUpdated || Date.now()), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right / Main Story Viewer Area */}
      <div className="hidden md:flex flex-1 h-full items-center justify-center bg-[#0b141a] p-6 relative">
        {selectedGroup ? (
          <div className="w-full max-w-sm h-[85vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-gray-800 animate-fadeIn">
            {/* Story Top Progress Bars */}
            <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
              {selectedGroup.items.map((item, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all ${
                      idx < activeStoryIndex
                        ? 'w-full'
                        : idx === activeStoryIndex
                        ? 'w-full animate-pulse'
                        : 'w-0'
                    }`}
                  ></div>
                </div>
              ))}
            </div>

            {/* Top Bar (Author info & close) */}
            <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={selectedGroup.user?.avatar}
                  name={selectedGroup.user?.name}
                  size="sm"
                />
                <div>
                  <h4 className="text-xs font-bold leading-tight">
                    {selectedGroup.isSelf ? 'My Status' : selectedGroup.user?.name}
                  </h4>
                  <span className="text-[10px] text-white/70">
                    {format(
                      new Date(selectedGroup.items[activeStoryIndex]?.createdAt || Date.now()),
                      'HH:mm'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedGroup.isSelf && (
                  <button
                    onClick={() =>
                      handleDeleteStatus(selectedGroup.items[activeStoryIndex]?._id)
                    }
                    className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-red-400"
                    title="Delete status"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Story Content Canvas */}
            <div
              className="flex-1 flex items-center justify-center p-8 text-center"
              style={{
                backgroundColor:
                  selectedGroup.items[activeStoryIndex]?.bgColor || '#005c4b',
              }}
            >
              <p
                className={`text-xl font-medium text-white max-w-xs break-words leading-relaxed select-text ${
                  selectedGroup.items[activeStoryIndex]?.fontStyle === 'serif'
                    ? 'font-serif'
                    : 'font-sans'
                }`}
              >
                {selectedGroup.items[activeStoryIndex]?.content}
              </p>
            </div>

            {/* Tap areas for previous / next */}
            <button
              onClick={prevStory}
              className="absolute left-0 inset-y-16 w-1/3 z-20 focus:outline-none"
            ></button>
            <button
              onClick={nextStory}
              className="absolute right-0 inset-y-16 w-1/3 z-20 focus:outline-none"
            ></button>

            {/* Bottom Views Counter (If own status) */}
            {selectedGroup.isSelf && (
              <div className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-1.5 text-xs text-white bg-black/40 py-1.5 backdrop-blur-sm">
                <Eye size={16} />
                <span>
                  {selectedGroup.items[activeStoryIndex]?.viewers?.length || 0} views
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="text-sm">Select a contact to view their status update</p>
          </div>
        )}
      </div>

      {/* Create Status Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Status Update"
      >
        <form onSubmit={handleCreateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">What's on your mind?</label>
            <textarea
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Type your status..."
              required
              style={{ backgroundColor: bgColor }}
              className={`w-full rounded-2xl p-4 text-white placeholder-white/60 focus:outline-none shadow-inner resize-none text-base ${
                fontStyle === 'serif' ? 'font-serif' : 'font-sans'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">Background Color</label>
            <div className="flex items-center gap-2">
              {bgColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBgColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    bgColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">Font Style</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFontStyle('sans')}
                className={`px-4 py-1.5 rounded-xl text-xs font-sans border transition-colors ${
                  fontStyle === 'sans'
                    ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald font-bold'
                    : 'border-gray-700 text-gray-400'
                }`}
              >
                Sans Serif
              </button>
              <button
                type="button"
                onClick={() => setFontStyle('serif')}
                className={`px-4 py-1.5 rounded-xl text-xs font-serif border transition-colors ${
                  fontStyle === 'serif'
                    ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald font-bold'
                    : 'border-gray-700 text-gray-400'
                }`}
              >
                Serif
              </button>
            </div>
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
              {loading ? 'Posting...' : 'Post Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StatusPage;

