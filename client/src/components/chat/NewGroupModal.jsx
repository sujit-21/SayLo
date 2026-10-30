import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { useChat } from '../../context/ChatContext';

const NewGroupModal = ({ isOpen, onClose }) => {
  const { selectConversation, fetchConversations } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/contacts').then((res) => {
        setContacts(res.data.contacts || []);
      });
    }
  }, [isOpen]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/conversations/group', {
        name: name.trim(),
        description: description.trim(),
        participantIds: selectedIds,
      });

      await fetchConversations();
      selectConversation(res.data.conversation);
      onClose();
      setName('');
      setDescription('');
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Group">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Project Team, Family & Friends"
            required
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group about?"
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Add Members ({selectedIds.length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {contacts.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">No contacts found to add</p>
            ) : (
              contacts.map((contact) => {
                const isSelected = selectedIds.includes(contact._id);
                return (
                  <div
                    key={contact._id}
                    onClick={() => toggleSelect(contact._id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-saylo-emerald/10 border border-saylo-emerald/40' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={contact.avatar} name={contact.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-gray-200">{contact.name}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{contact.about}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-saylo-emerald focus:ring-saylo-emerald"
                    />
                  </div>
                );
              })
            )}
          </div>
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
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewGroupModal;

