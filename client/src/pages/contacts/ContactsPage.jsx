import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  MessageSquare,
  Trash2,
  Ban,
  Phone,
  Video,
  Info,
  Check,
  Shield,
  Download,
  MoreVertical,
  X,
  UserCheck,
  Mail,
  User,
  Clock,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ContactsPage = () => {
  const navigate = useNavigate();
  const { selectConversation, fetchConversations } = useChat();
  const { startCall } = useCall();
  const { user } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'online' | 'blocked'
  const [search, setSearch] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [directorySuggestions, setDirectorySuggestions] = useState([]);
  const [searchingDirectory, setSearchingDirectory] = useState(false);

  // Selected contact for Details Modal
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchContacts = async () => {
    try {
      const [contRes, blockRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/users/blocked').catch(() => ({ data: { blockedUsers: [] } })),
      ]);
      setContacts(contRes.data.contacts || []);
      setBlockedUsers(blockRes.data.blockedUsers || []);
    } catch (e) {
      console.error('Failed to fetch contacts', e);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Live search directory for quick add
  useEffect(() => {
    if (!newEmail.trim() || newEmail.length < 2) {
      setDirectorySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingDirectory(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(newEmail.trim())}`);
        const found = (res.data.users || []).filter(
          (u) => u._id !== user?._id && !contacts.some((c) => c._id === u._id)
        );
        setDirectorySuggestions(found);
      } catch (err) {
        console.warn('Directory search error', err);
      } finally {
        setSearchingDirectory(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newEmail, contacts, user?._id]);

  const handleAddContactById = async (contactId) => {
    setLoading(true);
    try {
      await api.post('/contacts/add', { contactId });
      setNewEmail('');
      setDirectorySuggestions([]);
      await fetchContacts();
      alert('Contact added to your SAYLO address book!');
    } catch (e) {
      console.error(e);
      alert('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContactForm = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setLoading(true);
    try {
      const searchRes = await api.get(`/users/search?q=${encodeURIComponent(newEmail.trim())}`);
      const found = searchRes.data.users?.[0];
      if (!found) {
        alert('No user found matching that email or name');
        return;
      }
      if (found._id === user?._id) {
        alert('You cannot add yourself as a contact');
        return;
      }

      await api.post('/contacts/add', { contactId: found._id });
      setNewEmail('');
      setDirectorySuggestions([]);
      await fetchContacts();
      alert(`Added ${found.name} to contacts!`);
    } catch (e) {
      console.error(e);
      alert('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (contactId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name || 'this contact'} from your contacts?`)) {
      return;
    }
    try {
      await api.post('/contacts/remove', { contactId });
      if (selectedContact?._id === contactId) {
        setShowDetailsModal(false);
      }
      await fetchContacts();
    } catch (e) {
      console.error('Failed to remove contact', e);
      alert('Failed to remove contact');
    }
  };

  const handleToggleBlock = async (targetUserId, name) => {
    const isBlocked = blockedUsers.some((b) => (b._id || b) === targetUserId);
    const action = isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} ${name || 'this user'}?`)) {
      return;
    }
    try {
      await api.post('/users/block', { targetUserId });
      await fetchContacts();
      if (selectedContact?._id === targetUserId) {
        setShowDetailsModal(false);
      }
    } catch (e) {
      console.error('Failed to block/unblock contact', e);
      alert('Action failed');
    }
  };

  const handleStartChat = async (contactId) => {
    try {
      const res = await api.post('/conversations/direct', { recipientId: contactId });
      await fetchConversations();
      await selectConversation(res.data.conversation);
      navigate(`/chats/${res.data.conversation._id}`);
    } catch (e) {
      console.error('Failed to open chat', e);
    }
  };

  const handleVoiceCall = (contact) => {
    startCall(contact, 'audio');
  };

  const handleVideoCall = (contact) => {
    startCall(contact, 'video');
  };

  const handleExportContacts = () => {
    if (contacts.length === 0) {
      alert('No contacts to export.');
      return;
    }
    const vcardData = contacts
      .map(
        (c) =>
          `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name || 'SAYLO User'}\nEMAIL:${c.email || ''}\nTEL:${c.phone || ''}\nNOTE:${c.about || 'SAYLO Contact'}\nEND:VCARD`
      )
      .join('\n\n');

    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'saylo_contacts.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter contacts by tab and search
  const displayedContacts = (
    activeTab === 'blocked'
      ? blockedUsers
      : activeTab === 'online'
      ? contacts.filter((c) => c.isOnline)
      : contacts
  ).filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center font-bold">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Address Book & Contacts</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {contacts.length} total contact{contacts.length === 1 ? '' : 's'} • {contacts.filter((c) => c.isOnline).length} online
            </p>
          </div>
        </div>

        {contacts.length > 0 && (
          <button
            onClick={handleExportContacts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-[#111b21] hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors border border-gray-300 dark:border-gray-700"
            title="Export contacts as vCard (.vcf)"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export vCard</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        {/* Add Contact Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/60 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={16} className="text-saylo-emerald" />
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Add New Contact
            </h3>
          </div>

          <form onSubmit={handleAddContactForm} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={15} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email or name to discover users..."
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 transition-colors"
              >
                <UserPlus size={15} />
                <span>Add Contact</span>
              </button>
            </div>

            {/* Live Directory Suggestions Dropdown */}
            {directorySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#182229] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-2 z-30 divide-y divide-gray-100 dark:divide-gray-800 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Discovered in SAYLO Directory
                </div>
                {directorySuggestions.map((userMatch) => (
                  <div
                    key={userMatch._id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={userMatch.avatar} name={userMatch.name} size="sm" isOnline={userMatch.isOnline} />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{userMatch.name}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{userMatch.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddContactById(userMatch._id)}
                      className="px-3 py-1 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1"
                    >
                      <UserPlus size={12} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Filters & Search */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#202c33] rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-saylo-emerald text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All ({contacts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('online')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'online'
                    ? 'bg-saylo-emerald text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Online ({contacts.filter((c) => c.isOnline).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('blocked')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'blocked'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Blocked ({blockedUsers.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts by name, email or phone..."
                className="w-full bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-1">
            {activeTab === 'blocked' ? 'Blocked Users' : activeTab === 'online' ? 'Online Contacts' : 'All Contacts'} ({displayedContacts.length})
          </h2>

          {displayedContacts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
              <User size={36} className="mx-auto mb-2 text-gray-400" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No contacts found</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {search ? 'Try adjusting your search query.' : 'Use the box above to add friends and teammates.'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/60 divide-y divide-gray-100 dark:divide-gray-700/40 overflow-hidden shadow-md">
              {displayedContacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowDetailsModal(true);
                    }}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <Avatar
                      src={contact.avatar}
                      name={contact.name}
                      size="md"
                      isOnline={contact.isOnline}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {contact.name}
                        </h4>
                        {contact.isOnline && (
                          <span className="w-2 h-2 rounded-full bg-saylo-emerald flex-shrink-0" title="Online now" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {contact.about || contact.email || contact.phone || 'Hey there! I am using SAYLO.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Message button */}
                    <button
                      onClick={() => handleStartChat(contact._id)}
                      className="p-2 bg-saylo-emerald/10 hover:bg-saylo-emerald text-saylo-emerald hover:text-white rounded-xl text-xs font-semibold transition-colors"
                      title="Direct Message"
                    >
                      <MessageSquare size={16} />
                    </button>

                    {/* Audio Call button */}
                    <button
                      onClick={() => handleVoiceCall(contact)}
                      className="p-2 bg-gray-100 dark:bg-[#111b21] hover:bg-saylo-emerald text-gray-600 dark:text-gray-300 hover:text-white rounded-xl transition-colors"
                      title="Voice Call"
                    >
                      <Phone size={16} />
                    </button>

                    {/* Video Call button */}
                    <button
                      onClick={() => handleVideoCall(contact)}
                      className="p-2 bg-gray-100 dark:bg-[#111b21] hover:bg-saylo-emerald text-gray-600 dark:text-gray-300 hover:text-white rounded-xl transition-colors"
                      title="Video Call"
                    >
                      <Video size={16} />
                    </button>

                    {/* Contact Profile info button */}
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 bg-gray-100 dark:bg-[#111b21] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 rounded-xl transition-colors"
                      title="View Profile"
                    >
                      <Info size={16} />
                    </button>

                    {/* Delete Contact button */}
                    <button
                      onClick={() => handleRemoveContact(contact._id, contact.name)}
                      className="p-2 bg-gray-100 dark:bg-[#111b21] hover:bg-red-500 text-gray-400 hover:text-white rounded-xl transition-colors"
                      title="Remove contact"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Profile & Info Modal */}
      {selectedContact && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Contact Info"
        >
          <div className="space-y-5 select-none">
            {/* Header / Avatar */}
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-[#111b21] rounded-2xl border border-gray-200 dark:border-gray-800">
              <Avatar
                src={selectedContact.avatar}
                name={selectedContact.name}
                size="2xl"
                isOnline={selectedContact.isOnline}
              />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-3">
                {selectedContact.name}
              </h3>
              <p className="text-xs text-saylo-emerald font-semibold mt-0.5">
                {selectedContact.isOnline ? 'Online now' : 'Offline'}
              </p>
            </div>

            {/* Details Fields */}
            <div className="space-y-3 bg-white dark:bg-[#182229] p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                  About / Status
                </span>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {selectedContact.about || 'Hey there! I am using SAYLO.'}
                </p>
              </div>

              {selectedContact.phone && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                    Phone Number
                  </span>
                  <p className="text-gray-800 dark:text-gray-200 font-mono">
                    {selectedContact.phone}
                  </p>
                </div>
              )}

              {selectedContact.email && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                    Email Address
                  </span>
                  <p className="text-gray-800 dark:text-gray-200 font-mono">
                    {selectedContact.email}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleStartChat(selectedContact._id);
                }}
                className="py-2.5 px-3 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold flex flex-col items-center gap-1 shadow-md transition-colors"
              >
                <MessageSquare size={16} />
                <span>Message</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleVoiceCall(selectedContact);
                }}
                className="py-2.5 px-3 bg-gray-100 dark:bg-[#111b21] hover:bg-saylo-emerald text-gray-700 dark:text-gray-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <Phone size={16} />
                <span>Voice Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleVideoCall(selectedContact);
                }}
                className="py-2.5 px-3 bg-gray-100 dark:bg-[#111b21] hover:bg-saylo-emerald text-gray-700 dark:text-gray-200 hover:text-white rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <Video size={16} />
                <span>Video Call</span>
              </button>
            </div>

            {/* Security & Danger Actions */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
              <button
                type="button"
                onClick={() => handleToggleBlock(selectedContact._id, selectedContact.name)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Ban size={15} />
                <span>
                  {blockedUsers.some((b) => (b._id || b) === selectedContact._id)
                    ? 'Unblock Contact'
                    : 'Block Contact'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRemoveContact(selectedContact._id, selectedContact.name)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <Trash2 size={15} />
                <span>Remove from Contacts</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContactsPage;
