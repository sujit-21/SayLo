import React, { useState } from 'react';
import { Palette, Check, RefreshCw } from 'lucide-react';
import Modal from '../common/Modal';

export const CHAT_THEMES = [
  { id: 'default', name: 'Default Emerald', bg: 'bg-[#005c4b]', ring: 'ring-[#005c4b]', preview: '#005c4b' },
  { id: 'ocean', name: 'Ocean Cyan', bg: 'bg-[#0284c7]', ring: 'ring-[#0284c7]', preview: '#0284c7' },
  { id: 'purple', name: 'Royal Violet', bg: 'bg-[#7c3aed]', ring: 'ring-[#7c3aed]', preview: '#7c3aed' },
  { id: 'crimson', name: 'Crimson Ember', bg: 'bg-[#e11d48]', ring: 'ring-[#e11d48]', preview: '#e11d48' },
  { id: 'sunset', name: 'Golden Sunset', bg: 'bg-[#d97706]', ring: 'ring-[#d97706]', preview: '#d97706' },
  { id: 'midnight', name: 'Midnight Charcoal', bg: 'bg-[#334155]', ring: 'ring-[#334155]', preview: '#334155' },
];

const ChatThemeModal = ({ isOpen, currentTheme = 'default', onClose, onSelectTheme }) => {
  const [selected, setSelected] = useState(currentTheme);

  if (!isOpen) return null;

  const handleSave = () => {
    onSelectTheme(selected);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom Chat Theme">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Personalize the message bubble accent color for this conversation:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {CHAT_THEMES.map((theme) => {
            const isChosen = selected === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelected(theme.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  isChosen
                    ? 'border-saylo-emerald bg-white/5 ring-2 ring-saylo-emerald/40'
                    : 'border-gray-700/60 bg-[#111b21] hover:border-gray-500'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.preview }}
                >
                  {isChosen && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs font-semibold text-gray-200 text-left">{theme.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-medium transition-colors shadow-md"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChatThemeModal;
