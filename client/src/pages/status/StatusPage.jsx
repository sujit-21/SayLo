import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Eye, Image, Video, Type, Globe, Users, Lock, ShieldCheck, Mic, Square, Play, Pause, RotateCcw, Send } from 'lucide-react';
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
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Create status state
  const [createMode, setCreateMode] = useState('text'); // 'text' | 'media' | 'voice'
  const [newContent, setNewContent] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [bgColor, setBgColor] = useState('#005c4b');
  const [fontStyle, setFontStyle] = useState('sans');
  const [privacy, setPrivacy] = useState('contacts'); // 'contacts' | 'everyone' | 'nobody'
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Voice Status State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordTime, setVoiceRecordTime] = useState(0);
  const [voiceAudioBlob, setVoiceAudioBlob] = useState(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState(null);
  const voiceRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);

  const startRecordingVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceRecorderRef.current = new MediaRecorder(stream);
      voiceChunksRef.current = [];

      voiceRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };

      voiceRecorderRef.current.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        setVoiceAudioBlob(blob);
        setVoiceAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      voiceRecorderRef.current.start();
      setIsRecordingVoice(true);
      setVoiceRecordTime(0);

      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordTime((prev) => {
          if (prev >= 30) {
            stopRecordingVoice();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Microphone access denied');
    }
  };

  const stopRecordingVoice = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setIsRecordingVoice(false);
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== 'inactive') {
      voiceRecorderRef.current.stop();
    }
  };

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
    setShowViewersSheet(false);

    // Mark active story as viewed if not own
    if (!group.isSelf && group.items[0]) {
      api.post(`/status/${group.items[0]._id}/view`).catch(console.error);
    }
  };

  // Next story
  const nextStory = () => {
    if (!selectedGroup) return;
    setShowViewersSheet(false);
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
    setShowViewersSheet(false);
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  // Reply to status story directly into DM chat
  const handleSendStatusReply = async (messageText) => {
    if (!messageText || !selectedGroup?.user?._id) return;
    const currentItem = selectedGroup.items[activeStoryIndex];
    const storyPreview =
      currentItem?.type === 'text'
        ? currentItem.content
        : currentItem?.caption || (currentItem?.type === 'voice' ? 'Voice note status' : 'Photo/Video status');

    try {
      const directRes = await api.post('/conversations/direct', {
        recipientId: selectedGroup.user._id,
      });
      const convId = directRes.data?.conversation?._id;
      if (convId) {
        await api.post('/messages', {
          conversationId: convId,
          text: `${messageText}\n\n↳ 📷 Replying to status: "${storyPreview.slice(0, 50)}${storyPreview.length > 50 ? '...' : ''}"`,
        });
        alert('Reply sent to chat!');
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to reply to status', err);
      alert('Could not send reply');
    }
  };

  // Handle media selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    const isVid = file.type.startsWith('video');
    setMediaType(isVid ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };

  // Create Status Story
  const handleCreateStatus = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (createMode === 'media') {
        if (!mediaFile) {
          alert('Please choose an image or video file');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', mediaFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadRes.data?.file?.url;

        await api.post('/status', {
          type: mediaType,
          content: uploadedUrl,
          caption: caption.trim(),
          privacy,
        });
      } else if (createMode === 'voice') {
        if (!voiceAudioBlob) {
          alert('Please record a voice note first');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', voiceAudioBlob, `voice_status_${Date.now()}.webm`);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadRes.data?.file?.url;

        await api.post('/status', {
          type: 'voice',
          content: uploadedUrl,
          bgColor,
          privacy,
          mediaDuration: voiceRecordTime,
        });
      } else {
        if (!newContent.trim()) {
          setLoading(false);
          return;
        }

        await api.post('/status', {
          type: 'text',
          content: newContent.trim(),
          bgColor,
          fontStyle,
          privacy,
        });
      }

      setShowCreateModal(false);
      setNewContent('');
      setCaption('');
      setMediaFile(null);
      setMediaPreview(null);
      setVoiceAudioBlob(null);
      setVoiceAudioUrl(null);
      setVoiceRecordTime(0);
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
    <div className="flex-1 h-full flex overflow-hidden select-none bg-[#f0f2f5] dark:bg-[#111b21]">
      {/* Left List of Statuses */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 ${
          selectedGroup ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Status</h1>
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
            className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/60 cursor-pointer hover:border-saylo-emerald transition-colors"
          >
            <div className="relative">
              <Avatar src={user?.avatar} name={user?.name || 'You'} size="md" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-saylo-emerald text-white flex items-center justify-center border-2 border-white dark:border-[#202c33]">
                <Plus size={12} strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">My Status</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {myGroup && myGroup.items.length > 0
                  ? `${myGroup.items.length} update(s)`
                  : 'Tap to add status update'}
              </p>
            </div>
          </div>

          {/* Recent Updates */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
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
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div
                        className={`rounded-full p-0.5 ${
                          group.hasUnviewed
                            ? 'ring-2 ring-saylo-emerald'
                            : 'ring-1 ring-gray-400 dark:ring-gray-600'
                        }`}
                      >
                        <Avatar src={group.user?.avatar} name={group.user?.name} size="md" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {group.user?.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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
      <div
        className={`${
          selectedGroup ? 'flex fixed inset-0 z-50 md:relative md:inset-auto md:z-auto' : 'hidden md:flex'
        } flex-1 h-full items-center justify-center bg-[#efeae2] dark:bg-[#0b141a] p-0 md:p-6 relative`}
      >
        {selectedGroup ? (
          <div className="w-full h-full md:max-w-sm md:h-[85vh] md:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border-0 md:border md:border-gray-800 animate-fadeIn bg-black">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  className="md:hidden p-1.5 -ml-1 text-white hover:bg-white/20 rounded-full transition-colors"
                  title="Back to status list"
                >
                  <ChevronLeft size={22} />
                </button>
                <Avatar
                  src={selectedGroup.user?.avatar}
                  name={selectedGroup.user?.name}
                  size="sm"
                />
                <div>
                  <h4 className="text-xs font-bold leading-tight truncate max-w-[130px] sm:max-w-[160px]">
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
              className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
              style={{
                backgroundColor:
                  selectedGroup.items[activeStoryIndex]?.type === 'text' ||
                  selectedGroup.items[activeStoryIndex]?.type === 'voice'
                    ? selectedGroup.items[activeStoryIndex]?.bgColor || '#005c4b'
                    : '#000000',
              }}
            >
              {selectedGroup.items[activeStoryIndex]?.type === 'image' ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={selectedGroup.items[activeStoryIndex]?.content}
                    alt="Status story"
                    className="max-h-[75vh] max-w-full object-contain rounded-2xl"
                  />
                  {selectedGroup.items[activeStoryIndex]?.caption && (
                    <p className="mt-3 text-sm text-white bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm max-w-xs">
                      {selectedGroup.items[activeStoryIndex].caption}
                    </p>
                  )}
                </div>
              ) : selectedGroup.items[activeStoryIndex]?.type === 'video' ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <video
                    src={selectedGroup.items[activeStoryIndex]?.content}
                    autoPlay
                    controls
                    className="max-h-[75vh] max-w-full object-contain rounded-2xl"
                  />
                  {selectedGroup.items[activeStoryIndex]?.caption && (
                    <p className="mt-3 text-sm text-white bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm max-w-xs">
                      {selectedGroup.items[activeStoryIndex].caption}
                    </p>
                  )}
                </div>
              ) : selectedGroup.items[activeStoryIndex]?.type === 'voice' ? (
                <div className="flex flex-col items-center justify-center space-y-5 animate-fadeIn">
                  <div className="w-24 h-24 rounded-full bg-black/30 border-2 border-white/20 flex items-center justify-center shadow-2xl">
                    <Mic size={40} className="text-white animate-pulse" />
                  </div>
                  <div className="p-4 bg-black/40 rounded-2xl backdrop-blur-md border border-white/10 w-72 flex flex-col items-center gap-2">
                    <audio
                      src={selectedGroup.items[activeStoryIndex]?.content}
                      controls
                      autoPlay
                      className="w-full h-10 accent-saylo-emerald"
                    />
                    <span className="text-[11px] text-white/80 font-mono">
                      Voice Status ({selectedGroup.items[activeStoryIndex]?.mediaDuration || 0}s)
                    </span>
                  </div>
                  {selectedGroup.items[activeStoryIndex]?.caption && (
                    <p className="mt-2 text-sm text-white bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm max-w-xs">
                      {selectedGroup.items[activeStoryIndex].caption}
                    </p>
                  )}
                </div>
              ) : (
                <p
                  className={`text-xl font-medium text-white max-w-xs break-words leading-relaxed select-text ${
                    selectedGroup.items[activeStoryIndex]?.fontStyle === 'serif'
                      ? 'font-serif'
                      : 'font-sans'
                  }`}
                >
                  {selectedGroup.items[activeStoryIndex]?.content}
                </p>
              )}
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
              <div
                onClick={() => setShowViewersSheet(true)}
                className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-1.5 text-xs text-white bg-black/50 hover:bg-black/70 cursor-pointer py-2 px-4 backdrop-blur-sm transition-all rounded-full mx-auto w-fit border border-white/10 shadow-lg active:scale-95"
                title="Tap to see who viewed your status"
              >
                <Eye size={16} className="text-saylo-emerald" />
                <span className="font-medium">
                  {selectedGroup.items[activeStoryIndex]?.viewers?.length || 0} views
                </span>
                <span className="text-[10px] text-gray-300 ml-1">▲ View list</span>
              </div>
            )}

            {/* Bottom Reply Bar & Quick Reactions (If contact's status) */}
            {!selectedGroup.isSelf && (
              <div className="absolute bottom-4 inset-x-3 z-30 flex flex-col gap-2 max-w-sm mx-auto animate-in slide-in-from-bottom duration-200">
                {/* Quick Emoji Reactions */}
                <div className="flex items-center justify-around bg-black/60 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/10 shadow-xl">
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendStatusReply(emoji)}
                      className="text-xl hover:scale-130 transition-transform active:scale-95 p-1"
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Text Reply Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendStatusReply(replyText);
                  }}
                  className="flex items-center gap-2 bg-black/75 backdrop-blur-md p-1.5 pl-4 rounded-full border border-white/20 shadow-2xl"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedGroup.user?.name || 'status'}...`}
                    className="flex-1 bg-transparent text-xs text-white placeholder-white/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="w-8 h-8 rounded-full bg-saylo-emerald hover:bg-saylo-600 disabled:opacity-30 text-white flex items-center justify-center transition-all shadow-md active:scale-95 flex-shrink-0"
                    title="Send reply"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* Bottom Viewers Slide-up Modal / Drawer */}
            {selectedGroup.isSelf && showViewersSheet && (
              <div className="absolute inset-x-0 bottom-0 max-h-[60%] bg-[#1f2c34] border-t border-gray-700/80 rounded-t-3xl z-40 p-4 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-saylo-emerald" />
                    <h4 className="text-sm font-bold text-gray-100">
                      Viewed by {selectedGroup.items[activeStoryIndex]?.viewers?.length || 0}
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowViewersSheet(false)}
                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mt-2 divide-y divide-gray-800/60 max-h-64">
                  {(!selectedGroup.items[activeStoryIndex]?.viewers ||
                    selectedGroup.items[activeStoryIndex].viewers.length === 0) ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      No views yet. When contacts view your status, they will appear here.
                    </div>
                  ) : (
                    selectedGroup.items[activeStoryIndex].viewers.map((viewerRecord, idx) => {
                      const viewerUser = viewerRecord.user || {};
                      const timeStr = viewerRecord.viewedAt
                        ? format(new Date(viewerRecord.viewedAt), 'MMM d, h:mm a')
                        : 'Recently';
                      return (
                        <div key={idx} className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={viewerUser.avatar}
                              name={viewerUser.name || 'Contact'}
                              size="sm"
                            />
                            <div>
                              <p className="text-xs font-semibold text-gray-100">
                                {viewerUser.name || 'Unknown Contact'}
                              </p>
                              <p className="text-[10px] text-gray-400">Viewed {timeStr}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
        onClose={() => {
          setShowCreateModal(false);
          setMediaPreview(null);
          setMediaFile(null);
        }}
        title="Create Status Update"
      >
        <form onSubmit={handleCreateStatus} className="space-y-4">
          {/* Tab selector: Text vs Photo/Video vs Voice Story */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#111b21] rounded-2xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setCreateMode('text')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                createMode === 'text'
                  ? 'bg-saylo-emerald text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Type size={15} />
              <span>Text</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateMode('media');
                fileInputRef.current?.click();
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                createMode === 'media'
                  ? 'bg-saylo-emerald text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Image size={15} />
              <span>Media</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('voice')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                createMode === 'voice'
                  ? 'bg-saylo-emerald text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mic size={15} />
              <span>Voice Note</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {createMode === 'text' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  What's on your mind?
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Type your status..."
                  required={createMode === 'text'}
                  style={{ backgroundColor: bgColor }}
                  className={`w-full rounded-2xl p-4 text-white placeholder-white/60 focus:outline-none shadow-inner resize-none text-base ${
                    fontStyle === 'serif' ? 'font-serif' : 'font-sans'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Background Color
                </label>
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
            </>
          ) : createMode === 'voice' ? (
            <div className="space-y-4">
              <div
                className="p-6 rounded-2xl flex flex-col items-center justify-center text-center transition-all relative overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                {!voiceAudioBlob && !isRecordingVoice && (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={startRecordingVoice}
                      className="w-16 h-16 rounded-full bg-saylo-emerald hover:bg-saylo-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    >
                      <Mic size={28} />
                    </button>
                    <span className="text-xs text-white/90 font-medium">
                      Tap mic to record audio status (up to 30s)
                    </span>
                  </div>
                )}

                {isRecordingVoice && (
                  <div className="flex flex-col items-center gap-3 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl animate-bounce">
                      <Mic size={28} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                      <span className="text-sm font-bold text-white font-mono">
                        00:{voiceRecordTime < 10 ? `0${voiceRecordTime}` : voiceRecordTime} / 00:30
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecordingVoice}
                      className="mt-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-sm"
                    >
                      <Square size={14} /> Stop Recording
                    </button>
                  </div>
                )}

                {voiceAudioBlob && !isRecordingVoice && (
                  <div className="w-full flex flex-col items-center gap-3">
                    <audio src={voiceAudioUrl} controls className="w-full h-10 accent-saylo-emerald" />
                    <div className="flex items-center justify-between w-full px-2">
                      <span className="text-[11px] text-white/80 font-mono">
                        Duration: {voiceRecordTime}s
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceAudioBlob(null);
                          setVoiceAudioUrl(null);
                          setVoiceRecordTime(0);
                        }}
                        className="text-xs text-white/90 hover:text-white flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                      >
                        <RotateCcw size={12} /> Re-record
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Status Background Color
                </label>
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
                <label className="block text-xs font-medium text-gray-300 mb-1">Caption (optional)</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a voice caption..."
                  className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mediaPreview ? (
                <div className="relative rounded-2xl overflow-hidden bg-black max-h-56 flex items-center justify-center">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} controls className="max-h-56 max-w-full" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="max-h-56 max-w-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPreview(null);
                      setMediaFile(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-saylo-emerald rounded-2xl p-8 text-center cursor-pointer transition-colors"
                >
                  <Image size={32} className="mx-auto mb-2 text-saylo-emerald" />
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Click to select photo or video</p>
                  <p className="text-[11px] text-gray-500 mt-1">Supports PNG, JPG, MP4, WebM</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Caption (optional)</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
                />
              </div>
            </div>
          )}

          {/* Status Audience / Privacy Settings */}
          <div className="pt-2 border-t border-gray-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-saylo-emerald" /> Who can see this status:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrivacy('contacts')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  privacy === 'contacts'
                    ? 'border-saylo-emerald bg-saylo-emerald/15 text-saylo-emerald font-semibold shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111b21] text-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <Users size={16} className={`mb-1 ${privacy === 'contacts' ? 'text-saylo-emerald' : 'text-gray-400'}`} />
                <span className="text-[11px]">My Contacts</span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('everyone')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  privacy === 'everyone'
                    ? 'border-saylo-emerald bg-saylo-emerald/15 text-saylo-emerald font-semibold shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111b21] text-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <Globe size={16} className={`mb-1 ${privacy === 'everyone' ? 'text-saylo-emerald' : 'text-gray-400'}`} />
                <span className="text-[11px]">Everyone</span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('nobody')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  privacy === 'nobody'
                    ? 'border-saylo-emerald bg-saylo-emerald/15 text-saylo-emerald font-semibold shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111b21] text-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <Lock size={16} className={`mb-1 ${privacy === 'nobody' ? 'text-saylo-emerald' : 'text-gray-400'}`} />
                <span className="text-[11px]">Only Me</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setMediaPreview(null);
                setMediaFile(null);
              }}
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

