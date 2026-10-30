import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Check,
  CheckCheck,
  Smile,
  Reply,
  Trash2,
  Edit2,
  Star,
  FileText,
  Play,
  Pause,
  Download,
  Eye,
  Clock,
  MapPin,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

const MessageItem = ({ message, onReply, onEdit }) => {
  const { user } = useAuth();
  const { reactToMessage, toggleStarMessage, deleteMessage, votePoll, openViewOnce } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewOnceRevealed, setViewOnceRevealed] = useState(false);

  const isSelf = message.sender?._id === user?._id || message.sender === user?._id;
  const isStarred = message.starredBy?.includes(user?._id);
  const isViewOnceOpened = message.viewOnceOpenedBy?.includes(user?._id);

  // Quick reaction emojis
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // Handle Poll Vote
  const handleVote = (optionIndex) => {
    votePoll(message._id, optionIndex);
  };

  // Handle View Once click
  const handleOpenViewOnce = async () => {
    if (isViewOnceOpened && !isSelf) return;
    try {
      await openViewOnce(message._id);
      setViewOnceRevealed(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Render System Message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="bg-[#182229] text-saylo-mutedTextDark text-xs px-3 py-1.5 rounded-lg shadow-sm border border-gray-800/40 text-center max-w-md">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col mb-1.5 ${isSelf ? 'items-end' : 'items-start'}`}
      onMouseLeave={() => {
        setShowMenu(false);
        setShowEmojiPicker(false);
      }}
    >
      <div
        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-all ${
          isSelf
            ? 'bg-[#005c4b] dark:bg-[#005c4b] text-[#e9edef] rounded-tr-none'
            : 'bg-[#202c33] dark:bg-[#202c33] text-[#e9edef] rounded-tl-none border border-gray-700/30'
        } ${message.deletedForEveryone ? 'italic opacity-70' : ''}`}
      >
        {/* Sender name for group chats */}
        {!isSelf && message.sender?.name && (
          <p className="text-xs font-semibold text-saylo-400 mb-1">{message.sender.name}</p>
        )}

        {/* Forwarded Tag */}
        {message.forwarded && (
          <p className="text-[11px] text-gray-400 italic mb-1 flex items-center gap-1">
            <span>Forwarded</span>
          </p>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-4 border-saylo-emerald text-xs">
            <span className="font-semibold text-saylo-300 block mb-0.5">
              {message.replyTo.sender?.name || 'User'}
            </span>
            <p className="line-clamp-2 text-gray-300">{message.replyTo.text || '[Attachment]'}</p>
          </div>
        )}

        {/* View Once Media Item */}
        {message.viewOnce ? (
          <div className="my-1">
            {!isViewOnceOpened && !viewOnceRevealed ? (
              <button
                onClick={handleOpenViewOnce}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-black/30 hover:bg-black/40 rounded-xl text-saylo-300 border border-saylo-emerald/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full border border-dashed border-saylo-emerald flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold block">View once photo</span>
                  <span className="text-[11px] text-gray-400">Click to view</span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 italic py-1">
                <Eye size={16} />
                <span>Opened view-once photo</span>
              </div>
            )}
            {viewOnceRevealed && message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="View once"
                className="mt-2 rounded-xl max-h-64 object-contain"
              />
            )}
          </div>
        ) : (
          <>
            {/* Image Media */}
            {message.type === 'image' && message.mediaUrl && (
              <div className="my-1 rounded-xl overflow-hidden max-w-sm">
                <img
                  src={message.mediaUrl}
                  alt={message.mediaName || 'Photo'}
                  className="w-full h-auto max-h-80 object-cover rounded-xl hover:opacity-95 cursor-pointer"
                  onClick={() => window.open(message.mediaUrl, '_blank')}
                />
              </div>
            )}

            {/* Video Media */}
            {message.type === 'video' && message.mediaUrl && (
              <div className="my-1 rounded-xl overflow-hidden max-w-sm">
                <video src={message.mediaUrl} controls className="w-full rounded-xl max-h-80" />
              </div>
            )}

            {/* Audio / Voice Message */}
            {(message.type === 'audio' || message.type === 'voice') && message.mediaUrl && (
              <div className="my-1.5 flex items-center gap-3 bg-black/20 p-2.5 rounded-xl min-w-[240px]">
                <audio src={message.mediaUrl} controls className="w-full h-8" />
              </div>
            )}

            {/* Document Media */}
            {message.type === 'document' && message.mediaUrl && (
              <div className="my-1 flex items-center justify-between gap-3 p-3 bg-black/20 rounded-xl min-w-[220px]">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="text-saylo-emerald flex-shrink-0" size={24} />
                  <div className="truncate">
                    <span className="text-xs font-medium block truncate">
                      {message.mediaName || 'Document'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {message.mediaSize ? `${(message.mediaSize / 1024).toFixed(1)} KB` : 'File'}
                    </span>
                  </div>
                </div>
                <a
                  href={message.mediaUrl}
                  download={message.mediaName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:bg-white/10 rounded-full text-saylo-emerald"
                >
                  <Download size={18} />
                </a>
              </div>
            )}

            {/* Poll Widget */}
            {message.type === 'poll' && message.poll && (
              <div className="my-2 min-w-[260px]">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-white">
                  <span>📊</span> {message.poll.question}
                </h4>
                <div className="space-y-2">
                  {message.poll.options.map((opt, idx) => {
                    const totalVotes = message.poll.options.reduce(
                      (acc, curr) => acc + (curr.votes?.length || 0),
                      0
                    );
                    const optVotes = opt.votes?.length || 0;
                    const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                    const hasVoted = opt.votes?.some((v) => v === user?._id || v?._id === user?._id);

                    return (
                      <button
                        key={idx}
                        onClick={() => handleVote(idx)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden flex flex-col gap-1 ${
                          hasVoted
                            ? 'border-saylo-emerald bg-saylo-emerald/10'
                            : 'border-gray-700/60 bg-black/20 hover:border-gray-600'
                        }`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-saylo-emerald/20 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>

                        <div className="relative z-10 flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-200">{opt.text}</span>
                          <span className="text-saylo-300 font-semibold">{percent}%</span>
                        </div>
                        <span className="relative z-10 text-[10px] text-gray-400">
                          {optVotes} {optVotes === 1 ? 'vote' : 'votes'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Message */}
            {message.type === 'location' && message.location && (
              <div className="my-1 p-2 bg-black/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1 text-saylo-emerald">
                  <MapPin size={18} />
                  <span className="font-semibold text-xs">Location Shared</span>
                </div>
                <p className="text-xs text-gray-300 mb-2">{message.location.address || message.text}</p>
                <a
                  href={`https://maps.google.com/?q=${message.location.latitude},${message.location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs bg-saylo-emerald text-white px-3 py-1 rounded-lg"
                >
                  View on Google Maps
                </a>
              </div>
            )}

            {/* Regular Text */}
            {message.text && message.type !== 'system' && (
              <p className="break-words leading-relaxed whitespace-pre-wrap">{message.text}</p>
            )}
          </>
        )}

        {/* Timestamp & Status Metadata Bar */}
        <div className="flex items-center justify-end gap-1.5 mt-1 select-none text-[10px] text-gray-400">
          {message.edited && <span className="italic">edited</span>}
          {isStarred && <Star size={11} className="text-amber-400 fill-amber-400" />}
          <span>{format(new Date(message.createdAt || Date.now()), 'HH:mm')}</span>

          {isSelf && (
            <span className="ml-0.5">
              {message.status === 'read' ? (
                <CheckCheck size={14} className="text-saylo-300" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={14} className="text-gray-400" />
              ) : (
                <Check size={14} className="text-gray-400" />
              )}
            </span>
          )}
        </div>

        {/* Reaction Emojis Badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-3 left-3 flex items-center gap-1 bg-[#182229] border border-gray-700/60 rounded-full px-2 py-0.5 shadow-md">
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji, idx) => (
              <span key={idx} className="text-xs">
                {emoji}
              </span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] text-gray-400 font-bold">
                {message.reactions.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Menu on hover */}
      <div
        className={`absolute top-0 ${
          isSelf ? '-left-20' : '-right-20'
        } hidden group-hover:flex items-center gap-1 bg-[#202c33] border border-gray-700/60 rounded-xl p-1 shadow-xl z-20`}
      >
        {/* Quick React Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-700/50"
          title="React"
        >
          <Smile size={16} />
        </button>

        {/* Reply */}
        <button
          onClick={() => onReply(message)}
          className="p-1 text-gray-400 hover:text-saylo-emerald rounded hover:bg-gray-700/50"
          title="Reply"
        >
          <Reply size={16} />
        </button>

        {/* More Actions Toggle */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700/50"
          title="More options"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          className={`absolute top-7 ${
            isSelf ? 'right-0' : 'left-0'
          } z-30 flex items-center gap-1 bg-[#202c33] border border-gray-700/70 p-2 rounded-2xl shadow-2xl animate-fadeIn`}
        >
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                reactToMessage(message._id, emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:scale-125 transition-transform px-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Context Menu Dropdown */}
      {showMenu && (
        <div
          className={`absolute top-8 ${
            isSelf ? 'right-0' : 'left-0'
          } z-30 w-40 bg-[#202c33] border border-gray-700/80 rounded-xl shadow-2xl py-1 text-xs text-gray-200 animate-fadeIn`}
        >
          <button
            onClick={() => {
              toggleStarMessage(message._id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
          >
            <Star size={14} className={isStarred ? 'text-amber-400' : ''} />
            {isStarred ? 'Unstar' : 'Star message'}
          </button>

          {isSelf && message.type === 'text' && !message.deletedForEveryone && (
            <button
              onClick={() => {
                onEdit(message);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}

          <button
            onClick={() => {
              deleteMessage(message._id, false);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2 text-red-400"
          >
            <Trash2 size={14} />
            Delete for me
          </button>

          {isSelf && !message.deletedForEveryone && (
            <button
              onClick={() => {
                deleteMessage(message._id, true);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-700/50 flex items-center gap-2 text-red-400"
            >
              <Trash2 size={14} />
              Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
