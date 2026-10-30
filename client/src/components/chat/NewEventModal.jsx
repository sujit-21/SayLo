import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const NewEventModal = ({ isOpen, onClose }) => {
  const { sendMessage } = useChat();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setLoading(true);
    try {
      const startTime = new Date(`${date}T${time || '12:00'}`);

      await sendMessage({
        type: 'event',
        event: {
          title: title.trim(),
          description: description.trim(),
          startTime,
          location: location.trim(),
          attendees: [],
        },
      });

      onClose();
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
    } catch (err) {
      console.error(err);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Event Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design Sprint Planning, Team Lunch"
            required
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this event about?"
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-300 mb-1.5">
              <Calendar size={13} className="text-saylo-emerald" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-saylo-emerald"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-300 mb-1.5">
              <Clock size={13} className="text-saylo-emerald" /> Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-saylo-emerald"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-gray-300 mb-1.5">
            <MapPin size={13} className="text-saylo-emerald" /> Location / Link
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Conference Room A, or Video Call"
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
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
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewEventModal;

