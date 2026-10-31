import React, { useState, useEffect } from 'react';
import { Search, UserCheck, X, User } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../services/api';

const ShareContactModal = ({ isOpen, onClose, onShareContact }) => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/contacts');
        setContacts(res.data.contacts || []);
      } catch (err) {
        console.error('Failed to load contacts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase().trim()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Contact Card">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contact to share..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        {/* Contacts List */}
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800/80">
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">Loading contacts...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">No contacts found</div>
          ) : (
            filtered.map((contact) => (
              <div
                key={contact._id}
                onClick={() => {
                  onShareContact({
                    name: contact.name,
                    phone: contact.phone || '',
                    email: contact.email || '',
                    about: contact.about || 'Hey there! I am using SAYLO.',
                    avatar: contact.avatar || '',
                  });
                  onClose();
                }}
                className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={contact.avatar} name={contact.name} size="md" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phone || contact.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 bg-saylo-emerald/10 hover:bg-saylo-emerald text-saylo-emerald hover:text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Share
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ShareContactModal;

