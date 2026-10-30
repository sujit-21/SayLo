import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { Check, Sparkles, Image as ImageIcon } from 'lucide-react';

const WallpaperModal = ({ isOpen, onClose }) => {
  const { wallpaper, updateWallpaper } = useTheme();

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chat Wallpaper Gallery">
      <div className="space-y-4 select-none">
        <p className="text-xs text-gray-400">
          Choose a wallpaper preset for your chat conversations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {wallpapers.map((w) => {
            const isSelected = wallpaper === w.id;
            return (
              <div
                key={w.id}
                onClick={() => {
                  updateWallpaper(w.id);
                  onClose();
                }}
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

