import React, { useState } from 'react';
import { Clock, Send, X, Calendar as CalendarIcon } from 'lucide-react';
import Modal from '../common/Modal';

const ScheduleMessageModal = ({ isOpen, onClose, onSchedule }) => {
  // Default to 1 hour in future
  const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const initialDateStr = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(
    defaultDate.getDate()
  )}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;

  const [scheduledTime, setScheduledTime] = useState(initialDateStr);
  const [messageText, setMessageText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const dateObj = new Date(scheduledTime);
    if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
      alert('Please choose a valid future date and time.');
      return;
    }
    onSchedule(messageText.trim(), dateObj.toISOString());
    setMessageText('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Message">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Message to send
          </label>
          <textarea
            rows={3}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your scheduled message..."
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Send automatically at
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-[#111b21] border border-gray-700 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
              required
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            SAYLO's background scheduler will deliver this message at the specified time.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-medium transition-colors shadow-md"
          >
            <Clock size={14} />
            <span>Schedule Message</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleMessageModal;
