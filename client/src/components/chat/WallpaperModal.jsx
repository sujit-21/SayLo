import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

const WallpaperModal = ({ isOpen, onClose }) => {
  const { wallpaper, updateWallpaper } = useTheme();

  const wallpapers = [
    { id: 'doodle', name: 'Classic Doodle', bgClass: 'bg-chat-pattern-dark' },
    { id: 'midnight', name: 'Midnight Dark', bgClass: 'bg-[#0b141a]' },
    { id: 'emerald', name: 'Emerald Night', bgClass: 'bg-[#002a22]' },
    { id: 'navy', name: 'Deep Navy', bgClass: 'bg-[#0a192f]' },
    { id: 'charcoal', name: 'Charcoal Minimal', bgClass: 'bg-[#18181b]' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Chat Wallpaper">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Personalize your chat background theme.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {wallpapers.map((w) => (
            <div
              key={w.id}
              onClick={() => {
                updateWallpaper(w.id);
                onClose();
              }}
              className={`h-24 rounded-2xl cursor-pointer border-2 transition-all p-3 flex flex-col justify-end ${w.bgClass} ${
                wallpaper === w.id ? 'border-saylo-emerald shadow-lg scale-102' : 'border-gray-700/60 hover:border-gray-500'
              }`}
            >
              <span className="text-xs font-semibold text-white drop-shadow-md">{w.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default WallpaperModal;

