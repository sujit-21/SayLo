import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

const WallpaperModal = ({ isOpen, onClose }) => {
  const { wallpaper, updateWallpaper } = useTheme();
  const { activeConversation } = useChat();

  const [applyScope, setApplyScope] = useState(activeConversation ? 'chat' : 'global');

  const wallpapers = [
    { id: 'doodle', name: 'Classic Doodle', bgClass: 'bg-chat-pattern-dark', preview: '#005c4b' },
    { id: 'midnight', name: 'Midnight Charcoal', bgClass: 'bg-[#0b141a]', preview: '#0b141a' },
    { id: 'emerald', name: 'Emerald Velvet', bgClass: 'bg-[#002a22]', preview: '#002a22' },
    { id: 'navy', name: 'Deep Space Navy', bgClass: 'bg-[#0a192f]', preview: '#0a192f' },
    { id: 'charcoal', name: 'Charcoal Minimal', bgClass: 'bg-[#18181b]', preview: '#18181b' },
    { id: 'nebula', name: 'Cosmic Nebula', bgClass: 'bg-gradient-to-br from-[#1e1b4b] via-[#31104b] to-[#0b141a]', preview: '#31104b' },
    { id: 'sunset', name: 'Sunset Glow', bgClass: 'bg-gradient-to-br from-[#451a03] via-[#78350f] to-[#0f172a]', preview: '#78350f' },
    { id: 'slate', name: 'Geometric Slate', bgClass: 'bg-[#1e293b]', preview: '#1e293b' },
  ];

  const handleSelect = async (wId) => {
    if (applyScope === 'chat' && activeConversation?._id) {
      localStorage.setItem(`saylo_wallpaper_${activeConversation._id}`, wId);
      try {
        await api.put(`/conversations/${activeConversation._id}/preference`, {
          customWallpaper: wId,
        });
      } catch (e) {
        // Fallback saved locally
      }
    } else {
      updateWallpaper(wId);
      if (activeConversation?._id) {
        localStorage.removeItem(`saylo_wallpaper_${activeConversation._id}`);
      }
    }
    onClose();
  };

  const currentChatWallpaper =
    activeConversation && localStorage.getItem(`saylo_wallpaper_${activeConversation._id}`);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chat Wallpaper Gallery">
      <div className="space-y-4 select-none">
        {activeConversation && (
          <div className="flex items-center gap-2 p-1 bg-[#111b21] rounded-xl border border-gray-700/60 text-xs">
            <button
              type="button"
              onClick={() => setApplyScope('chat')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                applyScope === 'chat'
                  ? 'bg-saylo-emerald text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              This Chat Only
            </button>
            <button
              type="button"
              onClick={() => setApplyScope('global')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                applyScope === 'global'
                  ? 'bg-saylo-emerald text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Chats (Global)
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400">
          {applyScope === 'chat'
            ? `Choose a wallpaper specific to this conversation.`
            : `Choose a default background for all SAYLO conversations.`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {wallpapers.map((w) => {
            const isSelected =
              applyScope === 'chat'
                ? (currentChatWallpaper || wallpaper) === w.id
                : wallpaper === w.id;

            return (
              <div
                key={w.id}
                onClick={() => handleSelect(w.id)}
                className={`h-24 rounded-2xl cursor-pointer border-2 transition-all p-3 flex flex-col justify-between ${w.bgClass} ${
                  isSelected
                    ? 'border-saylo-emerald shadow-xl ring-2 ring-saylo-emerald/30 scale-102'
                    : 'border-gray-700/60 hover:border-gray-500 hover:scale-101'
                }`}
              >
                <div className="flex justify-end">
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-saylo-emerald flex items-center justify-center text-white shadow-md">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-white drop-shadow-md">
                  {w.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default WallpaperModal;

