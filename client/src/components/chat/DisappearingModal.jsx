import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';

const DisappearingModal = ({ isOpen, onClose }) => {
  const { activeConversation, selectConversation } = useChat();
  const [selectedTimer, setSelectedTimer] = useState(
    activeConversation?.disappearingTimer || 0
  );
  const [loading, setLoading] = useState(false);

  const timers = [
    { label: '24 Hours', value: 86400 },
    { label: '7 Days', value: 604800 },
    { label: '90 Days', value: 7776000 },
    { label: 'Off', value: 0 },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/conversations/${activeConversation._id}/disappearing`, {
        timer: selectedTimer,
      });
      const res = await api.get(`/conversations/${activeConversation._id}`);
      selectConversation(res.data.conversation);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disappearing Messages">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          When turned on, all new messages sent in this chat will disappear for everyone after the chosen duration.
        </p>

        <div className="space-y-2">
          {timers.map((t) => (
            <label
              key={t.value}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors ${
                selectedTimer === t.value
                  ? 'border-saylo-emerald bg-saylo-emerald/10'
                  : 'border-gray-700/60 hover:bg-white/5'
              }`}
            >
              <span className="text-sm font-medium text-gray-200">{t.label}</span>
              <input
                type="radio"
                name="disappearing"
                checked={selectedTimer === t.value}
                onChange={() => setSelectedTimer(t.value)}
                className="text-saylo-emerald focus:ring-saylo-emerald"
              />
            </label>
          ))}
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
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DisappearingModal;
