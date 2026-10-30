import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { useChat } from '../../context/ChatContext';
import { Search, UserCheck, Bookmark } from 'lucide-react';

const NewChatModal = ({ isOpen, onClose, onOpenNewGroup }) => {
  const { selectConversation, fetchConversations } = useChat();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/contacts').then((res) => {
        setContacts(res.data.contacts || []);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim()) {
        setLoading(true);
        try {
          const res = await api.get(`/users/search?q=${encodeURIComponent(search.trim())}`);
          setSearchResults(res.data.users || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Start Note to Self
  const handleNoteToSelf = async () => {
    try {
      const res = await api.post('/conversations/note-to-self');
      await fetchConversations();
      selectConversation(res.data.conversation);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  // Start Direct Chat
  const handleStartChat = async (recipientId) => {
    try {
      const res = await api.post('/conversations/direct', { recipientId });
      await fetchConversations();
      selectConversation(res.data.conversation);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Chat">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or phone..."
            className="w-full bg-[#111b21] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        {/* Note to Self Option */}
        <div
          onClick={handleNoteToSelf}
          className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer border border-saylo-emerald/30 bg-saylo-emerald/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-saylo-emerald/20 text-saylo-emerald flex items-center justify-center">
            <Bookmark size={20} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-100">Message Yourself</h4>
            <p className="text-[11px] text-saylo-400">Personal notepad & reminders</p>
          </div>
        </div>

        {/* Search Results or Contacts List */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            {search.trim() ? 'Search Results' : 'Contacts'}
          </h4>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {search.trim() ? (
              searchResults.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">
                  {loading ? 'Searching...' : 'No users found matching that query'}
                </p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleStartChat(u._id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size="sm" isOnline={u.isOnline} />
                      <div>
                        <h4 className="text-xs font-semibold text-gray-100">{u.name}</h4>
                        <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-saylo-emerald font-semibold">Message</span>
                  </div>
                ))
              )
            ) : contacts.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">
                No contacts yet. Search for people above to start a conversation!
              </p>
            ) : (
              contacts.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleStartChat(c._id)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={c.avatar} name={c.name} size="sm" isOnline={c.isOnline} />
                    <div>
                      <h4 className="text-xs font-semibold text-gray-100">{c.name}</h4>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{c.about}</p>
                    </div>
                  </div>
                  <span className="text-xs text-saylo-emerald font-semibold">Message</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewChatModal;
