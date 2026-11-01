import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { useChat } from '../../context/ChatContext';
import {
  Search,
  Users,
  UserPlus,
  Bookmark,
  Phone,
  Mail,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const NewChatModal = ({ isOpen, onClose, onOpenNewGroup }) => {
  const navigate = useNavigate();
  const { selectConversation, fetchConversations } = useChat();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/contacts')
        .then((res) => {
          setContacts(res.data.contacts || []);
        })
        .catch((e) => console.error('Error fetching contacts in NewChatModal', e));
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
    <Modal isOpen={isOpen} onClose={onClose} title="Select Contact">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, @username, phone, or email..."
            className="w-full bg-gray-50 dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
          />
        </div>

        {/* WhatsApp-Style Top Action Rows */}
        <div className="space-y-1 border-b border-gray-200 dark:border-gray-800 pb-3">
          {/* Ask SAYLO AI (WhatsApp Meta AI Parity) */}
          <div
            onClick={handleNoteToSelf}
            className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-emerald-400 p-[2px] flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#202c33] flex items-center justify-center">
                <Sparkles size={18} className="text-saylo-emerald group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">SAYLO AI Assistant</h4>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-saylo-emerald/15 text-saylo-emerald rounded-full">AI</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Ask questions, brainstorm, or draft messages</p>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </div>

          {/* New Group */}
          <div
            onClick={() => {
              onClose();
              if (onOpenNewGroup) onOpenNewGroup();
            }}
            className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center flex-shrink-0">
              <Users size={19} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">New group</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Create a group chat with contacts</p>
            </div>
          </div>

          {/* New Contact / Full Address Book */}
          <div
            onClick={() => {
              onClose();
              navigate('/contacts');
            }}
            className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center flex-shrink-0">
              <UserPlus size={19} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">New contact / Address Book</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Add numbers & manage all contacts</p>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </div>

          {/* New Community */}
          <div
            onClick={() => {
              onClose();
              navigate('/communities');
            }}
            className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center flex-shrink-0">
              <Users size={19} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">New community</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Organize related groups & channels</p>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </div>

          {/* Note to Self Option */}
          <div
            onClick={handleNoteToSelf}
            className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center flex-shrink-0">
              <Bookmark size={19} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Message Yourself</h4>
              <p className="text-[11px] text-saylo-600 dark:text-saylo-400">Personal notepad & links</p>
            </div>
          </div>
        </div>

        {/* Search Results or Contacts List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {search.trim() ? 'Search Results' : `Contacts on SAYLO (${contacts.length})`}
            </h4>
            {!search.trim() && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/contacts');
                }}
                className="text-[11px] text-saylo-emerald hover:underline font-medium flex items-center gap-1"
              >
                <span>All Contacts</span>
                <ExternalLink size={11} />
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {search.trim() ? (
              searchResults.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  {loading ? 'Searching users...' : 'No users found matching that query'}
                </p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleStartChat(u._id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors group border border-transparent hover:border-saylo-emerald/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="sm" isOnline={u.isOnline} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{u.name}</h4>
                          {u.username && (
                            <span className="text-[10px] text-saylo-emerald dark:text-saylo-400 font-mono font-medium">
                              @{u.username}
                            </span>
                          )}
                        </div>
                        {/* Phone Number or Email Badge */}
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-saylo-emerald dark:text-saylo-400 font-mono">
                          {u.phone ? (
                            <>
                              <Phone size={11} />
                              <span className="truncate">{u.phone}</span>
                            </>
                          ) : (
                            <>
                              <Mail size={11} />
                              <span className="truncate">{u.email}</span>
                            </>
                          )}
                        </div>
                        {u.about && (
                          <p className="text-[10px] text-gray-400 truncate max-w-[220px] mt-0.5">{u.about}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-saylo-emerald font-semibold px-2 py-1 rounded-lg bg-saylo-emerald/10 group-hover:bg-saylo-emerald group-hover:text-white transition-colors flex-shrink-0">
                      Chat
                    </span>
                  </div>
                ))
              )
            ) : contacts.length === 0 ? (
              <div className="text-center py-6 px-4">
                <p className="text-xs text-gray-500 mb-2">No contacts saved yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/contacts');
                  }}
                  className="text-xs text-saylo-emerald font-semibold hover:underline"
                >
                  Open Contacts to add phone numbers
                </button>
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleStartChat(c._id)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors group border border-transparent hover:border-saylo-emerald/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={c.avatar} name={c.name} size="sm" isOnline={c.isOnline} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</h4>
                      {/* Phone Number Display */}
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-saylo-emerald dark:text-saylo-400 font-mono font-medium">
                        <Phone size={11} />
                        <span className="truncate">
                          {c.phone || (c.email ? c.email : 'No number listed')}
                        </span>
                      </div>
                      {c.about && (
                        <p className="text-[10px] text-gray-400 truncate max-w-[220px] mt-0.5">{c.about}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-saylo-emerald font-semibold px-2 py-1 rounded-lg bg-saylo-emerald/10 group-hover:bg-saylo-emerald group-hover:text-white transition-colors flex-shrink-0">
                    Chat
                  </span>
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
