import React, { useState } from 'react';
import { X, Keyboard } from 'lucide-react';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Alt + N', desc: 'Start a new conversation' },
    { key: 'Ctrl + Alt + G', desc: 'Create a new group' },
    { key: 'Ctrl + /', desc: 'Search messages in active chat' },
    { key: 'Esc', desc: 'Close modals, search, or side panels' },
    { key: 'Ctrl + V', desc: 'Paste & send image from clipboard' },
    { key: 'Enter', desc: 'Send message' },
    { key: 'Shift + Enter', desc: 'New line in message input' },
    { key: 'Alt + S', desc: 'Navigate to Status stories' },
    { key: 'Alt + C', desc: 'Navigate to Calls tab' },
    { key: 'Alt + P', desc: 'Open Privacy settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700/70">
          <div className="flex items-center gap-2.5 text-saylo-emerald">
            <Keyboard size={22} />
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-gray-100 dark:divide-gray-800/60">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-3">
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-gray-100 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-mono text-saylo-emerald dark:text-saylo-300 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#182229] border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-black/40 rounded border border-gray-300 dark:border-gray-700 font-mono text-gray-700 dark:text-gray-300">Esc</kbd> anytime to dismiss
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;

