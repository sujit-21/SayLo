import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Lock, EyeOff, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useChat } from '../../context/ChatContext';

const LockChatModal = ({ isOpen, onClose }) => {
  const { activeConversation } = useChat();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableSecretCode, setEnableSecretCode] = useState(() => localStorage.getItem('saylo_hide_locked_chats') === 'true');
  const [secretCode, setSecretCode] = useState(() => localStorage.getItem('saylo_chat_lock_secret_code') || '');

  const handleLock = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      alert('Please enter at least 4 digits for chat security PIN');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/chat-lock-pin', { pin });
      await api.put(`/conversations/${activeConversation._id}/preference`, { isLocked: true });

      if (enableSecretCode && secretCode.trim()) {
        localStorage.setItem('saylo_hide_locked_chats', 'true');
        localStorage.setItem('saylo_chat_lock_secret_code', secretCode.trim());
      } else {
        localStorage.setItem('saylo_hide_locked_chats', 'false');
      }
      window.dispatchEvent(new CustomEvent('saylo_secret_code_updated'));

      alert(
        enableSecretCode && secretCode.trim()
          ? `Chat locked! The Locked Chats folder is now hidden. Type "${secretCode.trim()}" in the search bar to reveal it.`
          : 'Chat is now locked with your PIN!'
      );
      onClose();
      setPin('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lock This Chat">
      <form onSubmit={handleLock} className="space-y-4">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-12 h-12 rounded-full bg-saylo-emerald/20 text-saylo-emerald flex items-center justify-center mb-3">
            <Lock size={24} />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Keep chat hidden and locked</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            Locked chats require your security PIN to view.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Enter 4-digit PIN</label>
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            required
            className="w-full text-center tracking-widest text-lg font-mono bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        {/* WhatsApp 2024 Secret Code for Locked Chats */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 pr-2">
              <EyeOff size={16} className="text-saylo-emerald flex-shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                  <span>Hide Locked Chats with Secret Code</span>
                  <span className="text-[9px] bg-saylo-emerald/20 text-saylo-emerald px-1.5 py-0.5 rounded font-bold uppercase">
                    WhatsApp 2024
                  </span>
                </h5>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Folder won't appear in chats list until you type your secret code into the search bar.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableSecretCode}
              onChange={(e) => setEnableSecretCode(e.target.checked)}
              className="w-4 h-4 rounded text-saylo-emerald focus:ring-saylo-emerald cursor-pointer"
            />
          </div>

          {enableSecretCode && (
            <div className="pt-2 animate-in fade-in duration-200">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Custom Secret Code (Passphrase, Word, or PIN)
              </label>
              <input
                type="text"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="e.g. secret, 1234, or mycode"
                className="w-full bg-[#f0f2f5] dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-saylo-emerald"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md disabled:opacity-50"
          >
            {loading ? 'Locking...' : 'Lock Chat'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LockChatModal;

