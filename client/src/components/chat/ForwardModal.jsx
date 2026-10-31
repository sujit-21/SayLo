import React, { useState } from 'react';
import { X, Search, Check, Send, Users } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const ForwardModal = ({ isOpen, message, messages: messagesToForward, onClose }) => {
  const { user } = useAuth();
  const { conversations, forwardMessage } = useChat();

  const [search, setSearch] = useState('');
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [customCaption, setCustomCaption] = useState('');
  const [sending, setSending] = useState(false);

  const targets = messagesToForward && messagesToForward.length > 0 ? messagesToForward : (message ? [message] : []);

  if (!isOpen || targets.length === 0) return null;

  // Filter conversations
  const filtered = conversations.filter((c) => {
    let name = c.name;
    if (!c.isGroup && !c.isNoteToSelf) {
      const other = c.participants?.find((p) => (p.user?._id || p.user) !== user?._id)?.user;
      name = other?.name || 'Chat';
    } else if (c.isNoteToSelf) {
      name = 'Message Yourself';
    }
    return name.toLowerCase().includes(search.toLowerCase().trim());
  });

  const toggleSelect = (id) => {
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedChatIds.length === 0 || sending) return;
    setSending(true);
    try {
      for (const msg of targets) {
        await forwardMessage(msg._id, selectedChatIds, customCaption);
      }
      setSelectedChatIds([]);
      setCustomCaption('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to forward message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/70">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {targets.length > 1 ? `Forward ${targets.length} messages to` : 'Forward message to'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select up to 5 chats</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message preview excerpt */}
        <div className="px-5 py-2.5 bg-black/5 dark:bg-black/20 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="text-saylo-emerald font-semibold">Message:</span>
          <span className="truncate italic">
            {message.text || `[Attachment: ${message.type || 'Media'}]`}
          </span>
        </div>

        {/* Custom Caption Input */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a2329]">
          <input
            type="text"
            value={customCaption}
            onChange={(e) => setCustomCaption(e.target.value)}
            placeholder="Add a caption / note to forward (optional)..."
            className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-gray-100 dark:bg-[#111b21] border border-transparent rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
            />
          </div>
        </div>

        {/* List of Chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/40 p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">No chats found</div>
          ) : (
            filtered.map((c) => {
              let name = c.name;
              let avatar = c.avatar;
              if (!c.isGroup && !c.isNoteToSelf) {
                const other = c.participants?.find((p) => (p.user?._id || p.user) !== user?._id)?.user;
                if (other) {
                  name = other.name;
                  avatar = other.avatar;
                }
              } else if (c.isNoteToSelf) {
                name = 'Message Yourself';
              }

              const isChecked = selectedChatIds.includes(c._id);

              return (
                <div
                  key={c._id}
                  onClick={() => toggleSelect(c._id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isChecked ? 'bg-saylo-emerald/15' : 'hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Avatar src={avatar} name={name} size="sm" />
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {c.isGroup ? 'Group' : 'Direct message'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-saylo-emerald border-saylo-emerald text-white'
                        : 'border-gray-300 dark:border-gray-600 bg-transparent'
                    }`}
                  >
                    {isChecked && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700/70 bg-[#f0f2f5] dark:bg-[#182229] flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {selectedChatIds.length === 0
              ? 'Select chats to forward'
              : `${selectedChatIds.length} chat(s) selected`}
          </span>

          <button
            onClick={handleForward}
            disabled={selectedChatIds.length === 0 || sending}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
              selectedChatIds.length > 0 && !sending
                ? 'bg-saylo-emerald text-white hover:bg-saylo-500 active:scale-95'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Forward</span>
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;

