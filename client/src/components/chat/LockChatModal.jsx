import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Lock } from 'lucide-react';
import api from '../../services/api';
import { useChat } from '../../context/ChatContext';

const LockChatModal = ({ isOpen, onClose }) => {
  const { activeConversation } = useChat();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

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
      alert('Chat is now locked with your PIN!');
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
          <h4 className="text-sm font-semibold text-gray-100">Keep chat hidden and locked</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Locked chats require your security PIN to view.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Enter 4-digit PIN</label>
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            required
            className="w-full text-center tracking-widest text-lg font-mono bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:bg-white/5 rounded-xl"
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

