import React, { useState, useEffect } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Link,
  Plus,
  Search,
  Trash2,
  X,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import CallLinkModal from '../../components/chat/CallLinkModal';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import api from '../../services/api';
import { format } from 'date-fns';

const CallsPage = () => {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'missed'
  const [showCallLinkModal, setShowCallLinkModal] = useState(false);
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');

  const fetchCalls = async () => {
    try {
      const res = await api.get('/calls');
      setCalls(res.data.calls || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // Fetch contacts for New Call picker
  useEffect(() => {
    if (showNewCallModal) {
      api.get('/contacts')
        .then((res) => setContacts(res.data.contacts || []))
        .catch(console.error);
    }
  }, [showNewCallModal]);

  // Clear Call Log
  const handleClearCallLog = async () => {
    if (!window.confirm('Are you sure you want to clear your entire call history?')) return;
    try {
      await api.delete('/calls').catch(() => {});
      setCalls([]);
    } catch (err) {
      console.error(err);
      setCalls([]);
    }
  };

  // Filtered Calls
  const filteredCalls = calls.filter((call) => {
    const isMissed = call.status === 'missed' || call.status === 'rejected';
    if (activeFilter === 'missed') return isMissed;
    return true;
  });

  // Filtered Contacts for New Call
  const filteredContacts = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.phone || '').includes(contactSearch)
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calls</h1>

          {/* WhatsApp-Style Filter Pills */}
          <div className="flex items-center gap-1 bg-gray-200/60 dark:bg-black/30 p-1 rounded-xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-saylo-emerald text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('missed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'missed'
                  ? 'bg-saylo-emerald text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        {/* Clear Log Button */}
        {calls.length > 0 && (
          <button
            onClick={handleClearCallLog}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
            title="Clear Call History"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-6 pb-24 md:pb-20">
        {/* Create Call Link Banner */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/60 shadow-md">
          <div className="w-12 h-12 rounded-full bg-saylo-emerald flex items-center justify-center text-white flex-shrink-0">
            <Link size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">Create a call link</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Share a link for your SAYLO voice or video call</p>
          </div>
          <button
            onClick={() => setShowCallLinkModal(true)}
            className="px-3.5 py-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex-shrink-0"
          >
            Create Link
          </button>
        </div>

        {/* Recent Calls */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            {activeFilter === 'missed' ? 'Missed Calls' : 'Recent Calls'} ({filteredCalls.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6">
              <Phone size={36} className="mx-auto mb-2 opacity-40 text-saylo-emerald" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {activeFilter === 'missed' ? 'No missed calls' : 'No recent calls'}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Tap the green phone button below to start a voice or video call with any contact.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-gray-700/60 divide-y divide-gray-200 dark:divide-gray-700/40 overflow-hidden shadow-lg">
              {filteredCalls.map((call) => {
                const isCaller = call.caller?._id === user?._id;
                const contact = isCaller ? call.receiver : call.caller;
                if (!contact) return null;

                const isMissed = call.status === 'missed' || call.status === 'rejected';

                return (
                  <div
                    key={call._id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar src={contact.avatar} name={contact.name} size="md" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{contact.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {isCaller ? (
                            <PhoneOutgoing size={13} className="text-saylo-emerald flex-shrink-0" />
                          ) : isMissed ? (
                            <PhoneMissed size={13} className="text-red-500 dark:text-red-400 flex-shrink-0" />
                          ) : (
                            <PhoneIncoming size={13} className="text-saylo-emerald flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {format(new Date(call.createdAt || Date.now()), 'MMMM d, HH:mm')}
                          </span>
                          {call.duration > 0 && (
                            <span className="text-[11px] text-gray-500 font-mono">
                              ({Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Call-back Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startCall(contact, 'audio')}
                        className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-saylo-emerald transition-colors"
                        title="Voice Call"
                      >
                        <Phone size={18} />
                      </button>
                      <button
                        onClick={() => startCall(contact, 'video')}
                        className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-saylo-emerald transition-colors"
                        title="Video Call"
                      >
                        <Video size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Floating Action Button: Start New Call */}
      <div className="absolute bottom-5 right-5 md:bottom-8 md:right-8 z-30 pointer-events-auto">
        <button
          onClick={() => setShowNewCallModal(true)}
          className="w-[56px] h-[56px] md:w-[60px] md:h-[60px] rounded-full bg-[#00a884] hover:bg-[#029071] active:bg-[#008266] active:scale-90 text-white shadow-[0_6px_22px_rgba(0,168,132,0.55)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all duration-200 border-2 border-white/50 dark:border-white/20 ring-2 ring-black/10 dark:ring-white/10 group focus:outline-none"
          title="New Call (Voice or Video)"
          aria-label="New Call"
        >
          <PhoneCall
            size={26}
            strokeWidth={2.4}
            className="text-white drop-shadow-sm group-hover:scale-110 transition-transform"
          />
        </button>
      </div>

      {/* New Call Contact Picker Modal */}
      <Modal
        isOpen={showNewCallModal}
        onClose={() => setShowNewCallModal(false)}
        title="Start New Call"
      >
        <div className="space-y-4 select-none">
          {/* Search Contacts */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts by name or phone..."
              className="w-full bg-gray-50 dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
            />
          </div>

          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Contacts ({filteredContacts.length})
          </h4>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filteredContacts.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No contacts found</p>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-saylo-emerald/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={contact.avatar} name={contact.name} size="sm" isOnline={contact.isOnline} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{contact.name}</h4>
                      <p className="text-[11px] text-saylo-emerald dark:text-saylo-400 font-mono truncate">
                        {contact.phone || contact.email || 'No number'}
                      </p>
                    </div>
                  </div>

                  {/* Call Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        startCall(contact, 'audio');
                      }}
                      className="p-2 rounded-xl bg-saylo-emerald/15 hover:bg-saylo-emerald text-saylo-emerald hover:text-white transition-colors"
                      title="Start Voice Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        startCall(contact, 'video');
                      }}
                      className="p-2 rounded-xl bg-saylo-emerald/15 hover:bg-saylo-emerald text-saylo-emerald hover:text-white transition-colors"
                      title="Start Video Call"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Call Link Modal */}
      <CallLinkModal
        isOpen={showCallLinkModal}
        onClose={() => setShowCallLinkModal(false)}
      />
    </div>
  );
};

export default CallsPage;
