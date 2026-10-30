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
}) => {
  const { activeConversation, sendMessage, replyMessage, setReplyMessage } = useChat();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('emoji'); // 'emoji', 'gif', 'sticker'
  const [viewOnce, setViewOnce] = useState(false);
  const [isHdQuality, setIsHdQuality] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mentionQuery, setMentionQuery] = useState(null); // null or string

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
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

  // Curated Stickers
  const stickerList = [
    { name: 'Wave', emoji: '👋', bg: 'bg-amber-500/20 text-amber-300' },
    { name: 'Fire', emoji: '🔥', bg: 'bg-red-500/20 text-red-400' },
    { name: 'Rocket', emoji: '🚀', bg: 'bg-blue-500/20 text-blue-400' },
    { name: 'Love', emoji: '💖', bg: 'bg-pink-500/20 text-pink-400' },
    { name: 'Target', emoji: '🎯', bg: 'bg-emerald-500/20 text-emerald-400' },
    { name: 'Coffee', emoji: '☕', bg: 'bg-yellow-500/20 text-yellow-400' },
  ];

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
        text: sticker.emoji,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Handle File Upload (Photos/Videos/Documents)
  const handleFileUpload = async (e, forcedType = null) => {
    const file = e.target.files[0];
    if (!file) return;

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

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('file', audioFile);

        try {
          const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          await sendMessage({
            type: 'voice',
            mediaUrl: res.data.file.url,
            mediaName: 'Voice Note',
            mediaMimeType: 'audio/webm',
            mediaDuration: recordingTime,
          });
        } catch (e) {
          console.error('Voice note send failed', e);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied', err);
      alert('Could not access microphone for voice message.');
    }
  };

  // Stop Voice Recording
  const stopRecording = (shouldSend = true) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);

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
    ? activeConversation.participants
        ?.map((p) => p.user)
        ?.filter((u) => u && u.name?.toLowerCase().includes(mentionQuery))
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

      {/* Mention Autocomplete Dropdown */}
      {mentionCandidates && mentionCandidates.length > 0 && (
        <div className="absolute bottom-16 left-12 z-30 bg-[#202c33] border border-gray-700 rounded-2xl shadow-2xl p-2 w-64 max-h-44 overflow-y-auto animate-fadeIn">
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
        <div className="absolute bottom-16 left-12 z-30 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 w-52 animate-fadeIn">
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
        <div className="absolute bottom-16 left-4 z-30 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl p-3 w-80 animate-fadeIn">
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

          {/* Stickers Grid */}
          {pickerTab === 'sticker' && (
            <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {stickerList.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendSticker(st)}
                  className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border border-transparent hover:border-saylo-emerald transition-transform hover:scale-105 ${st.bg}`}
                >
                  <span className="text-2xl">{st.emoji}</span>
                  <span className="text-[10px] font-semibold">{st.name}</span>
                </button>
              ))}
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

      {/* Voice Recording View or Normal Input View */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-4 py-1.5 px-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-mono text-red-400 font-semibold">
              Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => stopRecording(false)}
              className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-white/5"
              title="Cancel recording"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => stopRecording(true)}
              className="p-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-full shadow-md"
              title="Send voice message"
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
                  e.preventDefault();
                  handleSend();
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

          {/* Voice Note or Send Button */}
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
            <button
              type="button"
              onClick={startRecording}
              className="p-2.5 bg-saylo-emerald/10 hover:bg-saylo-emerald/20 text-saylo-emerald rounded-full transition-transform active:scale-95 flex-shrink-0"
              title="Record voice note"
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
