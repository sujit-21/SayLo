import React, { useState, useEffect } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Link, Plus } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import api from '../../services/api';
import { format } from 'date-fns';

const CallsPage = () => {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-100">Calls</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        {/* Create Call Link Banner */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#202c33] border border-gray-700/60 shadow-md">
          <div className="w-12 h-12 rounded-full bg-saylo-emerald flex items-center justify-center text-white">
            <Link size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-100">Create a call link</h3>
            <p className="text-xs text-gray-400">Share a link for your SAYLO voice or video call</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.origin + '/calls');
              alert('Call link copied to clipboard!');
            }}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl"
          >
            Copy Link
          </button>
        </div>

        {/* Recent Calls */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Recent Calls
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Phone size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No recent calls</p>
              <p className="text-xs text-gray-500 mt-1">
                Start a call from any chat to talk with voice or HD video.
              </p>
            </div>
          ) : (
            <div className="bg-[#202c33] rounded-2xl border border-gray-700/60 divide-y divide-gray-700/40 overflow-hidden shadow-lg">
              {calls.map((call) => {
                const isCaller = call.caller?._id === user?._id;
                const contact = isCaller ? call.receiver : call.caller;
                if (!contact) return null;

                const isMissed = call.status === 'missed' || call.status === 'rejected';

                return (
                  <div
                    key={call._id}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar src={contact.avatar} name={contact.name} size="md" />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-100">{contact.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          {isCaller ? (
                            <PhoneOutgoing size={13} className="text-saylo-emerald" />
                          ) : isMissed ? (
                            <PhoneMissed size={13} className="text-red-400" />
                          ) : (
                            <PhoneIncoming size={13} className="text-saylo-emerald" />
                          )}
                          <span>
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

                    {/* Quick Call-back Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startCall(contact, 'audio')}
                        className="p-2.5 rounded-full hover:bg-white/10 text-saylo-emerald transition-colors"
                        title="Call with voice"
                      >
                        <Phone size={18} />
                      </button>
                      <button
                        onClick={() => startCall(contact, 'video')}
                        className="p-2.5 rounded-full hover:bg-white/10 text-saylo-emerald transition-colors"
                        title="Call with video"
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
    </div>
  );
};

export default CallsPage;
