import React, { useState, useEffect } from 'react';
import { Megaphone, Search, X, Check, Send, Users, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { useChat } from '../../context/ChatContext';

const BroadcastModal = ({ isOpen, onClose }) => {
  const { fetchConversations } = useChat();
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sending, setSending] = useState(false);
  const [successCount, setSuccessCount] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setSuccessCount(null);
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const res = await api.get('/users/contacts');
        setContacts(res.data.contacts || []);
      } catch (err) {
        console.error('Failed to load contacts for broadcast', err);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase().trim()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c._id));
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !text.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post('/messages/broadcast', {
        recipientIds: selectedIds,
        text: text.trim(),
      });

      if (res.data?.success) {
        setSuccessCount(res.data.count || selectedIds.length);
        await fetchConversations();
        setTimeout(() => {
          setSelectedIds([]);
          setText('');
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to send broadcast', err);
      alert('Failed to send broadcast message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Broadcast Message">
      <form onSubmit={handleSendBroadcast} className="space-y-4 select-none">
        <div className="flex items-center gap-2 p-2.5 bg-saylo-emerald/10 border border-saylo-emerald/30 rounded-xl text-xs text-saylo-emerald">
          <Megaphone size={16} className="flex-shrink-0" />
          <span>
            Broadcast messages are delivered individually into each recipient's direct private chat.
          </span>
        </div>

        {/* Search & Select All */}
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#111b21] border border-gray-700/80 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
            />
          </div>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-semibold text-saylo-emerald hover:underline flex-shrink-0 px-2 py-1"
            >
              {selectedIds.length === filtered.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Contacts Selection List */}
        <div className="max-h-48 overflow-y-auto divide-y divide-gray-800/60 rounded-xl border border-gray-800/80 p-1 bg-[#111b21]">
          {loadingContacts ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading contacts...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No contacts found</div>
          ) : (
            filtered.map((contact) => {
              const isSelected = selectedIds.includes(contact._id);
              return (
                <div
                  key={contact._id}
                  onClick={() => toggleSelect(contact._id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-saylo-emerald/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={contact.avatar} name={contact.name} size="sm" />
                    <div>
                      <h4 className="text-xs font-semibold text-gray-100">{contact.name}</h4>
                      <p className="text-[10px] text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-saylo-emerald border-saylo-emerald text-white'
                        : 'border-gray-600 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Broadcast Text ({selectedIds.length} recipient{selectedIds.length === 1 ? '' : 's'})
          </label>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your announcement or mass message..."
            required
            className="w-full bg-[#111b21] border border-gray-700/80 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-saylo-emerald resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div>
            {successCount !== null ? (
              <span className="text-xs text-saylo-emerald font-semibold flex items-center gap-1">
                <Check size={14} /> Sent to {successCount} contacts!
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">
                {selectedIds.length} contact{selectedIds.length === 1 ? '' : 's'} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedIds.length === 0 || !text.trim() || sending}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-saylo-emerald hover:bg-saylo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              {sending ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send Broadcast</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BroadcastModal;
