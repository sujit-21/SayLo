import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Check,
  CheckCheck,
  Shield,
  FileText,
  Image,
  Video,
  Mic,
  Bookmark,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { format } from 'date-fns';
import api from '../../services/api';

const MessageInfoModal = ({ isOpen, message, conversation, onClose }) => {
  const [details, setDetails] = useState(message);
  const [convDetails, setConvDetails] = useState(conversation);
  const [activeTab, setActiveTab] = useState('read'); // 'read' | 'delivered'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && message?._id) {
      setDetails(message);
      setConvDetails(conversation);
      // Fetch latest detailed info from backend
      setLoading(true);
      api
        .get(`/messages/${message._id}/info`)
        .then((res) => {
          if (res.data?.success) {
            setDetails(res.data.message);
            if (res.data.conversation) setConvDetails(res.data.conversation);
          }
        })
        .catch((e) => {
          console.warn('Could not fetch message info drawer details', e);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, message?._id]);

  if (!isOpen || !message) return null;

  const currentMsg = details || message;
  const isGroup = convDetails?.isGroup || conversation?.isGroup;
  const readList = currentMsg.readBy || [];
  const deliveredList = currentMsg.deliveredTo || [];

  // In groups, compute members who have not read yet
  const participants = convDetails?.participants || conversation?.participants || [];
  const senderId = currentMsg.sender?._id || currentMsg.sender;
  const groupOtherMembers = participants.filter((p) => {
    const pId = p.user?._id || p.user || p;
    return pId !== senderId;
  });

  const readUserIds = new Set(
    readList.map((r) => (r.user?._id || r.user || '').toString())
  );

  const notReadMembers = groupOtherMembers.filter((p) => {
    const pId = (p.user?._id || p.user || '').toString();
    return !readUserIds.has(pId);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/70">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Message Info</h3>
            {isGroup && (
              <span className="text-[11px] bg-saylo-emerald/20 text-saylo-emerald font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users size={12} /> Group
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Bubble Preview */}
        <div className="p-4 bg-[#efeae2] dark:bg-[#111b21] border-b border-gray-200 dark:border-gray-800">
          <div className="bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[90%] ml-auto text-sm shadow-sm space-y-1.5">
            {currentMsg.type === 'image' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-emerald dark:text-saylo-200">
                <Image size={14} /> Photo
              </span>
            )}
            {currentMsg.type === 'video' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-emerald dark:text-saylo-200">
                <Video size={14} /> Video
              </span>
            )}
            {currentMsg.type === 'voice' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-emerald dark:text-saylo-200">
                <Mic size={14} /> Voice note
              </span>
            )}
            {currentMsg.type === 'document' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-emerald dark:text-saylo-200">
                <FileText size={14} /> Document
              </span>
            )}
            {currentMsg.text && (
              <p className="break-words leading-relaxed select-text">{currentMsg.text}</p>
            )}
            <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-300 pt-1 border-t border-black/10 dark:border-white/10">
              <span className="flex items-center gap-1">
                {currentMsg.isKept && (
                  <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-300 font-medium">
                    <Bookmark size={11} fill="currentColor" /> Kept in chat
                  </span>
                )}
              </span>
              <span>{format(new Date(currentMsg.createdAt || Date.now()), 'MMM d, HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* Group Tabs if Group Conversation */}
        {isGroup && (
          <div className="flex border-b border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-[#182229]">
            <button
              onClick={() => setActiveTab('read')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'read'
                  ? 'text-saylo-emerald border-b-2 border-saylo-emerald bg-white dark:bg-white/5'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CheckCheck size={16} className="text-saylo-emerald dark:text-saylo-300" />
              <span>Read by ({readList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'delivered'
                  ? 'text-saylo-emerald border-b-2 border-saylo-emerald bg-white dark:bg-white/5'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CheckCheck size={16} className="text-gray-400" />
              <span>Delivered ({groupOtherMembers.length})</span>
            </button>
          </div>
        )}

        {/* Delivery & Read Breakdown */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* If Group: Tabbed lists */}
          {isGroup ? (
            activeTab === 'read' ? (
              <div className="bg-gray-50 dark:bg-[#182229] p-4 rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-saylo-emerald dark:text-saylo-300">
                    <CheckCheck size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Read Receipts</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {readList.length} of {groupOtherMembers.length}
                  </span>
                </div>

                {readList.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No one has read this message yet</p>
                ) : (
                  <div className="space-y-2.5 divide-y divide-gray-200 dark:divide-gray-700/30">
                    {readList.map((r, i) => (
                      <div key={i} className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2.5 truncate">
                          <Avatar
                            src={r.user?.avatar}
                            name={r.user?.name || 'Group Member'}
                            size="xs"
                          />
                          <div className="truncate">
                            <span className="text-xs text-gray-900 dark:text-gray-200 font-medium block truncate">
                              {r.user?.name || 'Group Member'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {r.user?.email || ''}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-saylo-emerald font-mono whitespace-nowrap ml-2">
                          {format(new Date(r.readAt || Date.now()), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-[#182229] p-4 rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <CheckCheck size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Delivery Status</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{groupOtherMembers.length} members</span>
                </div>

                <div className="space-y-2.5 divide-y divide-gray-200 dark:divide-gray-700/30">
                  {groupOtherMembers.map((p, i) => {
                    const pUser = p.user || p;
                    const isRead = readUserIds.has((pUser._id || pUser).toString());
                    const deliveredEntry = deliveredList.find(
                      (d) => (d.user?._id || d.user) === (pUser._id || pUser)
                    );
                    return (
                      <div key={i} className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2.5 truncate">
                          <Avatar src={pUser.avatar} name={pUser.name || 'Member'} size="xs" />
                          <span className="text-xs text-gray-900 dark:text-gray-200 font-medium truncate">
                            {pUser.name || 'Member'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isRead
                              ? 'bg-saylo-emerald/20 text-saylo-emerald'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {isRead ? 'Read' : 'Delivered'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* 1-on-1 Chat Info */
            <>
              {/* Read Status */}
              <div className="bg-gray-50 dark:bg-[#182229] p-4 rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-3">
                <div className="flex items-center gap-2 text-saylo-emerald dark:text-saylo-300">
                  <CheckCheck size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Read Status</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                  <span>State</span>
                  <span
                    className={`font-semibold uppercase tracking-wider text-[11px] ${
                      currentMsg.status === 'read' || readList.length > 0
                        ? 'text-saylo-emerald'
                        : 'text-gray-400'
                    }`}
                  >
                    {currentMsg.status === 'read' || readList.length > 0 ? 'Read' : 'Unread'}
                  </span>
                </div>

                {(currentMsg.status === 'read' || readList.length > 0) && (
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Read at</span>
                    <span className="font-mono text-[11px] text-saylo-emerald">
                      {format(
                        new Date(readList[0]?.readAt || currentMsg.updatedAt || Date.now()),
                        'MMM d, yyyy HH:mm:ss'
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Delivered Status */}
              <div className="bg-gray-50 dark:bg-[#182229] p-4 rounded-2xl border border-gray-200 dark:border-gray-700/40 space-y-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCheck size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Delivered</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                  <span>State</span>
                  <span className="text-saylo-emerald font-semibold uppercase tracking-wider text-[11px]">
                    Delivered
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Sent to Server</span>
                  <span className="font-mono text-[11px]">
                    {format(new Date(currentMsg.createdAt || Date.now()), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Kept in Chat Banner */}
          {currentMsg.isKept && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-amber-300 text-xs">
              <Bookmark size={16} className="flex-shrink-0" fill="currentColor" />
              <span>
                Kept in chat: This message is exempt from disappearing timer expiration.
              </span>
            </div>
          )}

          {/* End-to-End Encryption Banner */}
          {currentMsg.isEncrypted && (
            <div className="p-3 bg-saylo-emerald/10 border border-saylo-emerald/30 rounded-2xl flex items-center gap-2.5 text-saylo-emerald text-xs">
              <Shield size={16} className="flex-shrink-0" />
              <span>Protected by SAYLO End-to-End Encryption (E2EE).</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;