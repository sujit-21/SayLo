import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  X,
  Image,
  FileText,
  BarChart2,
  MapPin,
  Trash2,
  Calendar,
  Sparkles,
  Sticker,
  Film,
  Clock,
  User,
  ExternalLink,
  Video,
  Camera,
  Plus,
  Upload,
  FolderHeart,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MessageInput = ({
  onOpenPollModal,
  onOpenEventModal,
  onOpenScheduleModal,
  onOpenShareContactModal,
  onOpenDoodleEditor,
}) => {
  const { activeConversation, sendMessage, replyMessage, setReplyMessage } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('emoji'); // 'emoji', 'gif', 'sticker'
  const [stickerPack, setStickerPack] = useState('moods'); // 'moods', 'animals', 'dev', 'custom'
  const [customStickers, setCustomStickers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saylo_custom_stickers')) || [];
    } catch {
      return [];
    }
  });
  const [viewOnce, setViewOnce] = useState(false);
  const [isHdQuality, setIsHdQuality] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [draftAudioUrl, setDraftAudioUrl] = useState(null);
  const [isPlayingDraft, setIsPlayingDraft] = useState(false);
  const draftAudioRef = useRef(null);
  const [recordMode, setRecordMode] = useState('audio'); // 'audio' | 'video'
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoPreviewStream, setVideoPreviewStream] = useState(null);
  const videoPreviewRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState(null); // null or string
  const [pendingVideo, setPendingVideo] = useState(null); // { file, url, isMuted }

  const quickReplies = [
    { shortcut: '/thanks', text: 'Thank you very much! Appreciate your help. 🙏' },
    { shortcut: '/busy', text: 'In a meeting right now, will reply shortly.' },
    { shortcut: '/meeting', text: 'Are you free for a quick sync / call?' },
    { shortcut: '/agree', text: 'Sounds like a great plan! Let’s proceed.' },
    { shortcut: '/hello', text: 'Hey! Hope you are having a wonderful day. 👋' },
    { shortcut: '/call', text: 'Can we hop on a quick SAYLO call?' },
    { shortcut: '/done', text: 'Task completed and verified! 🚀' },
  ];

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const stickerInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Emojis list
  const emojiList = [
    '😀', '😂', '😍', '🥳', '😎', '🤩', '🤔', '🙌',
    '👍', '👏', '🔥', '🚀', '✨', '🎉', '❤️', '💯',
    '☕', '🍕', '💻', '💡', '🌟', '💪', '🤝', '🌈',
    '🙏', '👀', '🎯', '⚡', '🎈', '🏆', '🥑', '🏖️'
  ];

  // Curated GIFs
  const gifList = [
    { title: 'Celebrate', url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif' },
    { title: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
    { title: 'Dance Party', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
    { title: 'Laughing', url: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif' },
    { title: 'Popcorn', url: 'https://media.giphy.com/media/t3dLl0TGHCxTG/giphy.gif' },
    { title: 'Mind Blown', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
  ];

  // Curated Sticker Packs
  const stickerPacks = {
    moods: [
      { name: 'Wave Hello', emoji: '👋', bg: 'bg-amber-500/20 text-amber-300' },
      { name: 'Pure Fire', emoji: '🔥', bg: 'bg-red-500/20 text-red-400' },
      { name: 'To The Moon', emoji: '🚀', bg: 'bg-blue-500/20 text-blue-400' },
      { name: 'Sparkling Heart', emoji: '💖', bg: 'bg-pink-500/20 text-pink-400' },
      { name: 'Bullseye', emoji: '🎯', bg: 'bg-emerald-500/20 text-emerald-400' },
      { name: 'Coffee Time', emoji: '☕', bg: 'bg-yellow-500/20 text-yellow-400' },
      { name: 'Party Popper', emoji: '🎉', bg: 'bg-purple-500/20 text-purple-300' },
      { name: '100 Percent', emoji: '💯', bg: 'bg-rose-500/20 text-rose-400' },
      { name: 'High Five', emoji: '🙌', bg: 'bg-cyan-500/20 text-cyan-300' },
    ],
    animals: [
      { name: 'Cool Cat', emoji: '🐱', bg: 'bg-amber-500/20 text-amber-300' },
      { name: 'Puppy Love', emoji: '🐶', bg: 'bg-blue-500/20 text-blue-300' },
      { name: 'Sneaky Fox', emoji: '🦊', bg: 'bg-orange-500/20 text-orange-400' },
      { name: 'Panda Hug', emoji: '🐼', bg: 'bg-emerald-500/20 text-emerald-300' },
      { name: 'Sleepy Koala', emoji: '🐨', bg: 'bg-gray-500/20 text-gray-300' },
      { name: 'Party Parrot', emoji: '🦜', bg: 'bg-green-500/20 text-green-300' },
    ],
    dev: [
      { name: 'Ship It!', emoji: '🚢', bg: 'bg-emerald-500/20 text-emerald-300' },
      { name: 'Bug or Feature?', emoji: '🐛', bg: 'bg-amber-500/20 text-amber-300' },
      { name: 'Git Push Force', emoji: '⚡', bg: 'bg-red-500/20 text-red-400' },
      { name: 'LGTM 👍', emoji: '✅', bg: 'bg-green-500/20 text-green-300' },
      { name: 'Need Coffee', emoji: '☕', bg: 'bg-yellow-500/20 text-yellow-400' },
      { name: '404 Brain', emoji: '🧠', bg: 'bg-purple-500/20 text-purple-300' },
    ],
    avatars: [
      { name: 'Happy Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Happy', bg: 'bg-emerald-500/10' },
      { name: 'Cool Shades', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cool', bg: 'bg-blue-500/10' },
      { name: 'Mind Blown', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shock', bg: 'bg-purple-500/10' },
      { name: 'Super Hero', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hero', bg: 'bg-amber-500/10' },
      { name: 'Gamer Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer', bg: 'bg-rose-500/10' },
      { name: 'Love Struck', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Love', bg: 'bg-pink-500/10' },
      { name: 'Cyber Ninja', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ninja', bg: 'bg-cyan-500/10' },
      { name: 'Party Champ', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Party', bg: 'bg-yellow-500/10' },
    ],
  };

  // Draft persistence per conversation
  useEffect(() => {
    if (activeConversation?._id) {
      const saved = localStorage.getItem(`saylo_draft_${activeConversation._id}`) || '';
      setText(saved);
    }
  }, [activeConversation?._id]);

  // Auto-focus and resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Typing event and mention detection
  const handleTyping = (e) => {
    const val = e.target.value;
    setText(val);

    if (activeConversation?._id) {
      localStorage.setItem(`saylo_draft_${activeConversation._id}`, val);
    }

    // Mention detection in groups
    if (activeConversation?.isGroup) {
      const lastAt = val.lastIndexOf('@');
      if (lastAt !== -1 && lastAt >= val.length - 15) {
        setMentionQuery(val.slice(lastAt + 1).toLowerCase());
      } else {
        setMentionQuery(null);
      }
    }

    if (socket && activeConversation) {
      socket.emit('typing:start', {
        conversationId: activeConversation._id,
        userName: user.name,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', {
          conversationId: activeConversation._id,
        });
      }, 2000);
    }
  };

  // Insert Mention
  const handleInsertMention = (userName) => {
    const lastAt = text.lastIndexOf('@');
    if (lastAt !== -1) {
      const newText = text.slice(0, lastAt) + `@${userName} `;
      setText(newText);
      setMentionQuery(null);
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  // Send Text Message (with automatic OpenGraph link preview detection)
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    const messageText = text.trim();
    setText('');
    setMentionQuery(null);
    if (activeConversation?._id) {
      localStorage.removeItem(`saylo_draft_${activeConversation._id}`);
    }
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (socket && activeConversation) {
      socket.emit('typing:stop', { conversationId: activeConversation._id });
    }

    try {
      // Check for first URL in message text to attach rich link preview
      const urlRegex = /(https?:\/\/[^\s]+)/i;
      const urlMatch = messageText.match(urlRegex);
      let linkPreview = undefined;

      if (urlMatch && urlMatch[0]) {
        try {
          const previewRes = await api.post('/users/link-preview', { url: urlMatch[0] });
          if (previewRes.data?.preview?.title) {
            linkPreview = previewRes.data.preview;
          }
        } catch (err) {
          console.error('Link preview generation error', err);
        }
      }

      await sendMessage({
        text: messageText,
        type: 'text',
        linkPreview,
      });
    } catch (err) {
      console.error('Failed to send text message', err);
    }
  };

  // Send GIF
  const handleSendGif = async (gifUrl) => {
    setShowPicker(false);
    try {
      await sendMessage({
        type: 'gif',
        mediaUrl: gifUrl,
        text: 'GIF',
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Send Sticker
  const handleSendSticker = async (sticker) => {
    setShowPicker(false);
    try {
      await sendMessage({
        type: 'sticker',
        mediaUrl: sticker.url || null,
        text: sticker.url ? (sticker.name || 'Sticker') : (sticker.emoji || sticker.name || 'Sticker'),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Upload & Save Custom Sticker
  const handleCustomStickerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.file?.url;
      if (uploadedUrl) {
        const newSticker = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: uploadedUrl,
          isCustom: true,
        };
        const updated = [newSticker, ...customStickers];
        setCustomStickers(updated);
        localStorage.setItem('saylo_custom_stickers', JSON.stringify(updated));
        // Immediately send as sticker
        handleSendSticker(newSticker);
      }
    } catch (err) {
      console.error('Failed to upload custom sticker', err);
      alert('Could not upload custom sticker');
    }
  };

  // Handle File Upload (Photos/Videos/Documents)
  const handleFileUpload = async (e, forcedType = null) => {
    const file = e.target.files[0];
    if (!file) return;

    // If an image is selected, offer the Doodle & Edit canvas first
    if (!forcedType && file.type.startsWith('image/') && onOpenDoodleEditor) {
      onOpenDoodleEditor(file);
      e.target.value = '';
      return;
    }

    // If a video is selected, offer mute audio toggle before sending
    if (!forcedType && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPendingVideo({ file, url, isMuted: false });
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url, name, mimeType, size } = res.data.file;

      let msgType = forcedType;
      if (!msgType) {
        if (mimeType.startsWith('image/')) msgType = 'image';
        else if (mimeType.startsWith('video/')) msgType = 'video';
        else if (mimeType.startsWith('audio/')) msgType = 'audio';
        else msgType = 'document';
      }

      await sendMessage({
        type: msgType,
        mediaUrl: url,
        mediaName: name,
        mediaMimeType: mimeType,
        mediaSize: size,
        viewOnce,
        text: text.trim() || '',
      });

      setText('');
      setViewOnce(false);
      setShowAttachmentMenu(false);
      if (activeConversation?._id) {
        localStorage.removeItem(`saylo_draft_${activeConversation._id}`);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('File upload failed. Please try again.');
    }
  };

  // Send pending video (with optional muted audio)
  const handleSendPendingVideo = async () => {
    if (!pendingVideo) return;
    const { file, isMuted } = pendingVideo;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url, name, mimeType, size } = res.data.file;

      await sendMessage({
        type: 'video',
        mediaUrl: url,
        mediaName: name,
        mediaMimeType: isMuted ? 'video/muted' : mimeType,
        mediaSize: size,
        viewOnce,
        text: text.trim() || '',
      });

      URL.revokeObjectURL(pendingVideo.url);
      setPendingVideo(null);
      setText('');
      setViewOnce(false);
      if (activeConversation?._id) {
        localStorage.removeItem(`saylo_draft_${activeConversation._id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send video');
    }
  };

  // Handle Location Sharing
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await sendMessage({
          type: 'location',
          location: {
            latitude,
            longitude,
            name: 'Current Location',
            address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`,
          },
        });
        setShowAttachmentMenu(false);
      },
      (err) => {
        console.error('Location error', err);
        alert('Could not retrieve current location.');
      }
    );
  };

  // Start Voice or Circular Video Note Recording
  const startRecording = async () => {
    try {
      const isVideoNote = recordMode === 'video';
      const constraints = isVideoNote
        ? { audio: true, video: { width: 320, height: 320, facingMode: 'user' } }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (isVideoNote) {
        setVideoPreviewStream(stream);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const mimeType = isVideoNote ? 'video/webm' : 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const fileName = isVideoNote ? 'video_note.webm' : `voice_${Date.now()}.webm`;
        const file = new File([blob], fileName, { type: mimeType });

        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          await sendMessage({
            type: isVideoNote ? 'video' : 'voice',
            mediaUrl: res.data.file.url,
            mediaName: fileName,
            mediaMimeType: isVideoNote ? 'video/note' : 'audio/webm',
            mediaDuration: recordingTime,
          });
        } catch (e) {
          console.error('Recording upload failed', e);
        }

        stream.getTracks().forEach((track) => track.stop());
        setVideoPreviewStream(null);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Device access denied', err);
      alert('Could not access microphone/camera for note recording.');
    }
  };

  // Toggle Pause / Resume Recording
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === 'recording') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
      } catch (err) {
        console.error(err);
      }

      mediaRecorderRef.current.pause();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecordingPaused(true);

      // Create draft audio preview
      setTimeout(() => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, {
            type: recordMode === 'video' ? 'video/webm' : 'audio/webm',
          });
          if (draftAudioUrl) URL.revokeObjectURL(draftAudioUrl);
          setDraftAudioUrl(URL.createObjectURL(blob));
        }
      }, 50);
    } else if (mediaRecorderRef.current.state === 'paused') {
      if (draftAudioRef.current) {
        draftAudioRef.current.pause();
        setIsPlayingDraft(false);
      }
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // Toggle Draft Audio Playback
  const togglePlayDraft = () => {
    if (!draftAudioRef.current) return;
    if (isPlayingDraft) {
      draftAudioRef.current.pause();
      setIsPlayingDraft(false);
    } else {
      draftAudioRef.current.play();
      setIsPlayingDraft(true);
    }
  };

  // Stop Voice Recording
  const stopRecording = (shouldSend = true) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setIsRecordingPaused(false);
    setIsPlayingDraft(false);
    if (draftAudioUrl) {
      URL.revokeObjectURL(draftAudioUrl);
      setDraftAudioUrl(null);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (!shouldSend) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        audioChunksRef.current = [];
      } else {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Filter mentionable members
  const mentionCandidates = activeConversation?.isGroup && mentionQuery !== null
    ? [
        ...('everyone'.includes(mentionQuery.toLowerCase()) || 'all'.includes(mentionQuery.toLowerCase())
          ? [{ _id: 'everyone', name: 'everyone', isAll: true }]
          : []),
        ...(activeConversation.participants
            ?.map((p) => p.user)
            ?.filter((u) => u && u.name?.toLowerCase().includes(mentionQuery.toLowerCase())) || []),
      ]
    : [];

  return (
    <div className="relative border-t border-gray-800 bg-[#202c33] dark:bg-[#202c33] px-4 py-2.5">
      {/* Reply Banner */}
      {replyMessage && (
        <div className="flex items-center justify-between mb-2 p-2 bg-black/20 rounded-xl border-l-4 border-saylo-emerald">
          <div className="text-xs truncate mr-2">
            <span className="font-semibold text-saylo-400 block">
              Replying to {replyMessage.sender?.name || 'User'}
            </span>
            <p className="text-gray-300 truncate">{replyMessage.text || '[Attachment]'}</p>
          </div>
          <button
            onClick={() => setReplyMessage(null)}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pending Video with Mute Audio Toggle Banner */}
      {pendingVideo && (
        <div className="mb-2 p-2.5 bg-[#182229] border border-gray-700/80 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0">
              <video src={pendingVideo.url} className="w-full h-full object-cover" muted />
            </div>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-[150px] md:max-w-xs">
                {pendingVideo.file.name}
              </p>
              <p className="text-[10px] text-gray-400">
                {(pendingVideo.file.size / (1024 * 1024)).toFixed(1)} MB • Video Attachment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mute Video Audio Toggle */}
            <button
              type="button"
              onClick={() =>
                setPendingVideo((prev) => ({ ...prev, isMuted: !prev.isMuted }))
              }
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                pendingVideo.isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/10 text-gray-200 hover:bg-white/15'
              }`}
              title={pendingVideo.isMuted ? 'Audio is muted' : 'Audio is on'}
            >
              {pendingVideo.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="text-[11px]">{pendingVideo.isMuted ? 'Muted' : 'Audio On'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(pendingVideo.url);
                setPendingVideo(null);
              }}
              className="p-1.5 rounded-full text-gray-400 hover:text-white"
              title="Cancel video"
            >
              <X size={16} />
            </button>

            <button
              type="button"
              onClick={handleSendPendingVideo}
              className="px-3 py-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Replies / Shortcuts Popup */}
      {text.startsWith('/') && (
        <div className="absolute bottom-16 left-2 sm:left-12 z-30 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl p-2 w-[calc(100vw-1rem)] sm:w-72 max-w-sm max-h-48 overflow-y-auto animate-fadeIn">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-saylo-emerald uppercase tracking-wider">
            <Zap size={13} />
            <span>Quick Replies</span>
          </div>
          {quickReplies
            .filter((q) => q.shortcut.toLowerCase().startsWith(text.toLowerCase()))
            .map((q) => (
              <button
                key={q.shortcut}
                type="button"
                onClick={() => {
                  setText(q.text);
                  if (activeConversation?._id) {
                    localStorage.setItem(`saylo_draft_${activeConversation._id}`, q.text);
                  }
                }}
                className="w-full text-left p-2 rounded-xl text-xs hover:bg-white/5 flex flex-col gap-0.5 text-gray-100 transition-colors"
              >
                <span className="font-bold text-saylo-emerald font-mono">{q.shortcut}</span>
                <span className="text-[11px] text-gray-300 truncate">{q.text}</span>
              </button>
            ))}
        </div>
      )}

      {/* Mention Autocomplete Dropdown */}
      {mentionCandidates && mentionCandidates.length > 0 && (
        <div className="absolute bottom-16 left-2 sm:left-12 z-30 bg-[#202c33] border border-gray-700 rounded-2xl shadow-2xl p-2 w-[calc(100vw-1rem)] sm:w-64 max-w-sm max-h-44 overflow-y-auto animate-fadeIn">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
            Mention Member
          </p>
          {mentionCandidates.map((mUser) => (
            <button
              key={mUser._id}
              onClick={() => handleInsertMention(mUser.name)}
              className="w-full text-left px-2 py-1.5 rounded-xl text-xs hover:bg-white/5 flex items-center gap-2 text-gray-100"
            >
              <span className="font-bold text-saylo-emerald">@</span>
              <span className="truncate">{mUser.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-2 sm:left-12 z-30 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 w-52 max-w-[calc(100vw-1rem)] animate-fadeIn">
          {/* Photos & Videos */}
          <button
            onClick={() => {
              imageInputRef.current.click();
              setShowAttachmentMenu(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-gray-700/50 text-gray-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Image size={18} />
            </div>
            Photos & Videos
          </button>

          {/* Document */}
          <button
            onClick={() => {
              fileInputRef.current.click();
              setShowAttachmentMenu(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-gray-700/50 text-gray-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText size={18} />
            </div>
            Document
          </button>

          {/* Poll */}
          <button
            onClick={() => {
              onOpenPollModal();
              setShowAttachmentMenu(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-gray-700/50 text-gray-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            Create Poll
          </button>

          {/* Event */}
          {onOpenEventModal && (
            <button
              onClick={() => {
                onOpenEventModal();
                setShowAttachmentMenu(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-gray-700/50 text-gray-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              Group Event
            </button>
          )}

          {/* Location */}
          <button
            onClick={handleShareLocation}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-gray-700/50 text-gray-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MapPin size={18} />
            </div>
            Share Location
          </button>

          {/* Share Contact Card */}
          {onOpenShareContactModal && (
            <button
              onClick={() => {
                onOpenShareContactModal();
                setShowAttachmentMenu(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-gray-700/50 text-gray-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <User size={18} />
              </div>
              Contact Card
            </button>
          )}

          {/* Schedule Message */}
          {onOpenScheduleModal && (
            <button
              onClick={() => {
                onOpenScheduleModal();
                setShowAttachmentMenu(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-gray-700/50 text-gray-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Clock size={18} />
              </div>
              Schedule Message
            </button>
          )}
        </div>
      )}

      {/* Tabbed Emoji, GIF & Sticker Picker */}
      {showPicker && (
        <div className="absolute bottom-16 left-2 sm:left-4 z-30 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl p-3 w-[calc(100vw-1rem)] sm:w-80 max-w-sm animate-fadeIn">
          {/* Picker Tabs */}
          <div className="flex items-center justify-around border-b border-gray-700/60 pb-2 mb-3">
            <button
              onClick={() => setPickerTab('emoji')}
              className={`flex items-center gap-1.5 text-xs font-semibold pb-1 transition-colors ${
                pickerTab === 'emoji' ? 'text-saylo-emerald border-b-2 border-saylo-emerald' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smile size={15} /> Emojis
            </button>
            <button
              onClick={() => setPickerTab('gif')}
              className={`flex items-center gap-1.5 text-xs font-semibold pb-1 transition-colors ${
                pickerTab === 'gif' ? 'text-saylo-emerald border-b-2 border-saylo-emerald' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Film size={15} /> GIFs
            </button>
            <button
              onClick={() => setPickerTab('sticker')}
              className={`flex items-center gap-1.5 text-xs font-semibold pb-1 transition-colors ${
                pickerTab === 'sticker' ? 'text-saylo-emerald border-b-2 border-saylo-emerald' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sticker size={15} /> Stickers
            </button>
          </div>

          {/* Emojis Grid */}
          {pickerTab === 'emoji' && (
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    setShowPicker(false);
                  }}
                  className="text-xl hover:scale-125 transition-transform p-1 text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* GIFs Grid */}
          {pickerTab === 'gif' && (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {gifList.map((g, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSendGif(g.url)}
                  className="h-20 rounded-xl overflow-hidden cursor-pointer border border-gray-700/60 hover:border-saylo-emerald group relative"
                >
                  <img src={g.url} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute bottom-1 left-1.5 text-[9px] bg-black/60 px-1 rounded text-white font-medium">
                    {g.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stickers Section */}
          {pickerTab === 'sticker' && (
            <div className="space-y-2">
              {/* Sticker Packs Selector */}
              <div className="flex items-center gap-1 pb-1.5 border-b border-gray-800 text-[11px] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStickerPack('moods')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stickerPack === 'moods'
                      ? 'bg-saylo-emerald/20 text-saylo-emerald font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Moods
                </button>
                <button
                  type="button"
                  onClick={() => setStickerPack('animals')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stickerPack === 'animals'
                      ? 'bg-saylo-emerald/20 text-saylo-emerald font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Animals
                </button>
                <button
                  type="button"
                  onClick={() => setStickerPack('avatars')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stickerPack === 'avatars'
                      ? 'bg-saylo-emerald/20 text-saylo-emerald font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Avatars
                </button>
                <button
                  type="button"
                  onClick={() => setStickerPack('dev')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stickerPack === 'dev'
                      ? 'bg-saylo-emerald/20 text-saylo-emerald font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Dev & Memes
                </button>
                <button
                  type="button"
                  onClick={() => setStickerPack('custom')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                    stickerPack === 'custom'
                      ? 'bg-saylo-emerald/20 text-saylo-emerald font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>My Stickers</span>
                  <span className="text-[10px] bg-white/10 px-1 rounded-full">{customStickers.length}</span>
                </button>
              </div>

              {/* Active Pack Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {stickerPack === 'custom' && (
                  <button
                    type="button"
                    onClick={() => stickerInputRef.current?.click()}
                    className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 border-dashed border-saylo-emerald/50 hover:border-saylo-emerald hover:bg-saylo-emerald/10 text-saylo-emerald transition-all"
                  >
                    <Plus size={18} />
                    <span className="text-[10px] font-semibold">Import Sticker</span>
                  </button>
                )}

                {stickerPack === 'custom'
                  ? customStickers.map((st, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendSticker(st)}
                        className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 bg-[#111b21] border border-gray-700/60 hover:border-saylo-emerald transition-transform hover:scale-105 p-1"
                      >
                        <img src={st.url} alt={st.name} className="w-9 h-9 object-contain" />
                        <span className="text-[9px] text-gray-300 font-medium truncate max-w-full px-1">
                          {st.name}
                        </span>
                      </button>
                    ))
                  : (stickerPacks[stickerPack] || []).map((st, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendSticker(st)}
                        className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border border-transparent hover:border-saylo-emerald transition-transform hover:scale-105 p-1 ${st.bg}`}
                      >
                        {st.url ? (
                          <img src={st.url} alt={st.name} className="w-9 h-9 object-contain drop-shadow" />
                        ) : (
                          <span className="text-2xl">{st.emoji}</span>
                        )}
                        <span className="text-[10px] font-semibold truncate max-w-full px-1">{st.name}</span>
                      </button>
                    ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'document')}
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e)}
      />
      <input
        type="file"
        ref={stickerInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleCustomStickerUpload}
      />

      {/* Voice Recording View or Normal Input View */}
      {/* Recording in progress overlay */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-4 py-2 px-4 bg-red-500/10 border border-red-500/20 rounded-2xl relative">
          {recordMode === 'video' && videoPreviewStream && (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-500 bg-black shadow-lg">
              <video
                ref={(el) => {
                  if (el && videoPreviewStream) el.srcObject = videoPreviewStream;
                }}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isRecordingPaused ? 'bg-amber-400' : 'bg-red-500 animate-ping'}`}></span>
            <span className={`text-xs font-mono font-semibold ${isRecordingPaused ? 'text-amber-400' : 'text-red-400'}`}>
              {isRecordingPaused ? 'Paused Draft' : `Recording ${recordMode === 'video' ? 'Video Note' : 'Voice'}`}{' '}
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>

            {/* Hidden draft audio player for preview */}
            {draftAudioUrl && (
              <audio
                ref={draftAudioRef}
                src={draftAudioUrl}
                onEnded={() => setIsPlayingDraft(false)}
                className="hidden"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Play draft preview button when paused */}
            {isRecordingPaused && draftAudioUrl && (
              <button
                type="button"
                onClick={togglePlayDraft}
                className="p-2 text-saylo-emerald hover:bg-saylo-emerald/10 rounded-full transition-colors"
                title={isPlayingDraft ? 'Pause Draft Preview' : 'Play Draft Preview'}
              >
                {isPlayingDraft ? <Pause size={18} /> : <Play size={18} />}
              </button>
            )}

            {/* Pause / Resume Button */}
            <button
              type="button"
              onClick={togglePauseRecording}
              className={`p-2 rounded-full transition-colors ${
                isRecordingPaused
                  ? 'text-saylo-emerald hover:bg-saylo-emerald/10'
                  : 'text-amber-400 hover:bg-amber-400/10'
              }`}
              title={isRecordingPaused ? 'Resume recording' : 'Pause recording'}
            >
              {isRecordingPaused ? <Mic size={18} /> : <Pause size={18} />}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-white/5 transition-colors"
              title="Cancel recording"
            >
              <Trash2 size={18} />
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="p-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-full shadow-md transition-transform active:scale-95"
              title="Send note"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {/* Emojis / GIFs / Stickers Button */}
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className={`p-2 transition-colors rounded-full ${
              showPicker ? 'text-saylo-emerald' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Emojis, GIFs & Stickers"
          >
            <Smile size={22} />
          </button>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className={`p-2 transition-colors rounded-full ${
              showAttachmentMenu ? 'text-saylo-emerald' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Attach file"
          >
            <Paperclip size={22} />
          </button>

          {/* Text input area */}
          <div className="flex-1 bg-[#2a3942] rounded-2xl px-4 py-2 border border-gray-700/50 focus-within:border-saylo-emerald transition-colors flex items-center gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  const enterSends = localStorage.getItem('saylo_enter_is_send') !== 'false';
                  if (enterSends) {
                    e.preventDefault();
                    handleSend();
                  }
                }
              }}
              placeholder="Type a message or @ to mention..."
              className="w-full bg-transparent resize-none text-sm text-gray-100 placeholder-gray-400 focus:outline-none max-h-28 overflow-y-auto"
            />

            {/* HD Media Quality Toggle */}
            <button
              type="button"
              onClick={() => setIsHdQuality(!isHdQuality)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                isHdQuality
                  ? 'border-saylo-emerald text-saylo-emerald bg-saylo-emerald/10'
                  : 'border-gray-500 text-gray-400'
              }`}
              title={isHdQuality ? 'HD Media Quality enabled' : 'Standard Quality'}
            >
              HD
            </button>

            {/* View Once Toggle Button */}
            <button
              type="button"
              onClick={() => setViewOnce(!viewOnce)}
              className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-colors ${
                viewOnce
                  ? 'border-saylo-emerald text-saylo-emerald bg-saylo-emerald/20'
                  : 'border-gray-500 text-gray-400 hover:border-gray-300'
              }`}
              title={viewOnce ? 'View once enabled' : 'Toggle view once'}
            >
              1
            </button>
          </div>

          {/* Voice / Video Note or Send Button */}
          {text.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              className="p-2.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-full shadow-md transition-transform active:scale-95 flex-shrink-0"
              title="Send message"
            >
              <Send size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {/* Toggle Record Mode (Voice vs Video Note) */}
              <button
                type="button"
                onClick={() => setRecordMode(recordMode === 'audio' ? 'video' : 'audio')}
                className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors"
                title={`Switch to ${recordMode === 'audio' ? 'Video Note' : 'Voice Note'}`}
              >
                {recordMode === 'audio' ? <Camera size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 bg-saylo-emerald/10 hover:bg-saylo-emerald/20 text-saylo-emerald rounded-full transition-transform active:scale-95 flex-shrink-0"
                title={recordMode === 'audio' ? 'Record voice note' : 'Record circular video note'}
              >
                {recordMode === 'audio' ? <Mic size={20} /> : <Video size={20} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
