import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare, Trash2, Ban } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';

const ContactsPage = () => {
  const { selectConversation, fetchConversations } = useChat();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts');
      setContacts(res.data.contacts || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setLoading(true);
    try {
      const searchRes = await api.get(`/users/search?q=${encodeURIComponent(newEmail.trim())}`);
      const found = searchRes.data.users?.[0];
      if (!found) {
        alert('No user found with that email');
        return;
      }

      await api.post('/contacts/add', { contactId: found._id });
      setNewEmail('');
      await fetchContacts();
      alert('Contact added!');
    } catch (e) {
      console.error(e);
      alert('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (contactId) => {
    try {
      const res = await api.post('/conversations/direct', { recipientId: contactId });
      await fetchConversations();
      selectConversation(res.data.conversation);
      window.location.href = `/chats/${res.data.conversation._id}`;
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = contacts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        {/* Add Contact Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/60 shadow-md">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Add New Contact</h3>
          <form onSubmit={handleAddContact} className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter contact email address..."
              required
              className="flex-1 bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
            >
              <UserPlus size={16} />
              Add
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        {/* Contacts List */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            All Contacts ({filtered.length})
          </h2>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-xs">No contacts found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/60 divide-y divide-gray-200 dark:divide-gray-700/40 overflow-hidden shadow-lg">
              {filtered.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={contact.avatar}
                      name={contact.name}
                      size="md"
                      isOnline={contact.isOnline}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{contact.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{contact.about || contact.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartChat(contact._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-saylo-emerald/10 hover:bg-saylo-emerald/20 text-saylo-emerald rounded-xl text-xs font-semibold"
                  >
                    <MessageSquare size={14} />
                    Message
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;

