import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';
import { format } from 'date-fns';

const StarredPage = () => {
  const { selectConversation } = useChat();
  const [starredMessages, setStarredMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStarred = async () => {
    try {
      const res = await api.get('/messages/starred');
      setStarredMessages(res.data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarred();
  }, []);

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Star size={20} className="text-amber-400 fill-amber-400" />
          Starred Messages
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : starredMessages.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Star size={36} className="mx-auto mb-2 opacity-30 text-amber-400" />
            <p className="text-sm">No starred messages yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Star important messages in any chat to view them here later.
            </p>
          </div>
        ) : (
          starredMessages.map((msg) => (
            <div
              key={msg._id}
              onClick={() => {
                if (msg.conversation?._id) {
                  selectConversation(msg.conversation._id);
                  window.location.href = `/chats/${msg.conversation._id}`;
                }
              }}
              className="p-4 bg-[#202c33] rounded-2xl border border-gray-700/60 shadow-md hover:border-saylo-emerald cursor-pointer transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="xs" />
                  <span className="text-xs font-semibold text-gray-200">{msg.sender?.name}</span>
                  <span className="text-xs text-gray-500">• in {msg.conversation?.name || 'Chat'}</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {format(new Date(msg.createdAt || Date.now()), 'MMM d, HH:mm')}
                </span>
              </div>

              <p className="text-sm text-gray-100 bg-[#111b21] p-3 rounded-xl border border-gray-800">
                {msg.text || `[Attachment: ${msg.type}]`}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StarredPage;
