import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Plus, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const NewPollModal = ({ isOpen, onClose }) => {
  const { sendMessage } = useChat();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (text, index) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const validOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options for the poll');
      return;
    }

    setLoading(true);
    try {
      await sendMessage({
        type: 'poll',
        poll: {
          question: question.trim(),
          options: validOptions.map((text) => ({ text, votes: [] })),
          multipleAnswers,
        },
      });
      onClose();
      setQuestion('');
      setOptions(['', '']);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Poll">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            required
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Options</label>
          <div className="space-y-2">
            {options.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(e.target.value, idx)}
                  placeholder={`Option ${idx + 1}`}
                  required
                  className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 10 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-2.5 flex items-center gap-1.5 text-xs text-saylo-emerald font-semibold hover:underline"
            >
              <Plus size={16} />
              Add Option
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
          <input
            type="checkbox"
            id="multipleAnswers"
            checked={multipleAnswers}
            onChange={(e) => setMultipleAnswers(e.target.checked)}
            className="rounded text-saylo-emerald focus:ring-saylo-emerald"
          />
          <label htmlFor="multipleAnswers" className="text-xs text-gray-300 select-none cursor-pointer">
            Allow multiple answers
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewPollModal;
