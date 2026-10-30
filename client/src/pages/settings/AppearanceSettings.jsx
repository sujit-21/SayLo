import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AppearanceSettings = () => {
  const { theme, setTheme, wallpaper, updateWallpaper } = useTheme();

  const wallpapers = [
    { id: 'doodle', name: 'Classic Doodle', bgClass: 'bg-chat-pattern-dark' },
    { id: 'midnight', name: 'Midnight Dark', bgClass: 'bg-[#0b141a]' },
    { id: 'emerald', name: 'Emerald Night', bgClass: 'bg-[#002a22]' },
    { id: 'navy', name: 'Deep Navy', bgClass: 'bg-[#0a192f]' },
    { id: 'charcoal', name: 'Charcoal Minimal', bgClass: 'bg-[#18181b]' },
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-800 bg-[#202c33]">
        <Link to="/settings" className="p-1 rounded-full text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Appearance & Wallpaper</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        {/* Theme mode */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-gray-100">Theme Mode</h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
                theme === 'dark'
                  ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald'
                  : 'border-gray-700 hover:border-gray-600 text-gray-300'
              }`}
            >
              <Moon size={20} />
              <div className="text-left">
                <span className="text-xs font-bold block">Dark Theme</span>
                <span className="text-[10px] text-gray-400">Dimmed interface</span>
              </div>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
                theme === 'light'
                  ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald'
                  : 'border-gray-700 hover:border-gray-600 text-gray-300'
              }`}
            >
              <Sun size={20} />
              <div className="text-left">
                <span className="text-xs font-bold block">Light Theme</span>
                <span className="text-[10px] text-gray-400">Bright interface</span>
              </div>
            </button>
          </div>
        </div>

        {/* Wallpaper Picker */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-gray-100">Chat Wallpaper</h3>
          <p className="text-xs text-gray-400">Choose a default background for your chats.</p>

          <div className="grid grid-cols-3 gap-3">
            {wallpapers.map((w) => (
              <div
                key={w.id}
                onClick={() => updateWallpaper(w.id)}
                className={`h-24 rounded-2xl cursor-pointer border-2 transition-all p-3 flex flex-col justify-end ${w.bgClass} ${
                  wallpaper === w.id
                    ? 'border-saylo-emerald shadow-lg scale-102 ring-2 ring-saylo-emerald/20'
                    : 'border-gray-700/60 hover:border-gray-500'
                }`}
              >
                <span className="text-xs font-semibold text-white drop-shadow-md">{w.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;

