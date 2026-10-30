import React, { useState } from 'react';
import { Archive, ArrowLeft, MessageSquare } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import api from '../../services/api';

const ArchivedPage = () => {
  const { user } = useAuth();
  const { conversations, selectConversation, fetchConversations } = useChat();

  const archivedConversations = conversations.filter((c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user?._id);
    return !!p?.isArchived;
  });

  const handleUnarchive = async (c, e) => {
    e.stopPropagation();
    await api.put(`/conversations/${c._id}/preference`, { isArchived: false });
    fetchConversations();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Archive size={20} className="text-saylo-emerald" />
          Archived Chats
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto space-y-4">
        {archivedConversations.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Archive size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No archived chats</p>
            <p className="text-xs text-gray-500 mt-1">
              Archived chats stay tucked away and won't reappear when new messages arrive.
            </p>
          </div>
        ) : (
          <div className="bg-[#202c33] rounded-2xl border border-gray-700/60 divide-y divide-gray-700/40 overflow-hidden shadow-lg">
            {archivedConversations.map((c) => (
              <div
                key={c._id}
                onClick={() => {
                  selectConversation(c);
                  window.location.href = `/chats/${c._id}`;
                }}
                className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar src={c.avatar} name={c.name} size="md" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                    <p className="text-xs text-gray-400 truncate max-w-xs">
                      {c.lastMessage?.text || 'Chat archived'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleUnarchive(c, e)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold"
                >
                  Unarchive
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedPage;
