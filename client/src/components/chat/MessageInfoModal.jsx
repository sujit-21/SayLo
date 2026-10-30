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
  Calendar,
  BarChart2,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { format } from 'date-fns';

const MessageInfoModal = ({ isOpen, message, conversation, onClose }) => {
  if (!isOpen || !message) return null;

  const isGroup = conversation?.isGroup;
  const readList = message.readBy || [];
  const deliveredList = message.deliveredTo || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#202c33] border border-gray-700/80 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/70">
          <h3 className="text-base font-semibold text-gray-100">Message Info</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Bubble Preview */}
        <div className="p-4 bg-[#111b21] border-b border-gray-800">
          <div className="bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] ml-auto text-sm shadow-sm space-y-1">
            {message.type === 'image' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-200">
                <Image size={14} /> Photo
              </span>
            )}
            {message.type === 'video' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-200">
                <Video size={14} /> Video
              </span>
            )}
            {message.type === 'voice' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-200">
                <Mic size={14} /> Voice note
              </span>
            )}
            {message.type === 'document' && (
              <span className="flex items-center gap-1.5 text-xs text-saylo-200">
                <FileText size={14} /> Document
              </span>
            )}
            {message.text && <p className="break-words leading-relaxed">{message.text}</p>}
            <div className="flex justify-end text-[10px] text-gray-300">
              {format(new Date(message.createdAt || Date.now()), 'HH:mm')}
            </div>
          </div>
        </div>

        {/* Delivery & Read Timestamps Breakdown */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Read Section */}
          <div className="bg-[#182229] p-4 rounded-2xl border border-gray-700/40 space-y-3">
            <div className="flex items-center gap-2 text-saylo-300">
              <CheckCheck size={18} className="text-saylo-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Read by</span>
            </div>

            {readList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Not read yet</p>
            ) : (
              <div className="space-y-2">
                {readList.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5 truncate">
                      <Avatar src={r.user?.avatar} name={r.user?.name || 'Contact'} size="xs" />
                      <span className="text-xs text-gray-200 font-medium truncate">
                        {r.user?.name || 'Contact'}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {format(new Date(r.readAt || Date.now()), 'MMM d, HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivered Section */}
          <div className="bg-[#182229] p-4 rounded-2xl border border-gray-700/40 space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Delivered</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-300">
              <span>Status</span>
              <span className="text-saylo-emerald font-semibold uppercase tracking-wider text-[11px]">
                {message.status === 'read' ? 'Read' : message.status === 'delivered' ? 'Delivered' : 'Sent to Server'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Timestamp</span>
              <span className="font-mono text-[11px]">
                {format(new Date(message.createdAt || Date.now()), 'MMM d, yyyy HH:mm:ss')}
              </span>
            </div>
          </div>

          {/* Security Banner */}
          {message.isEncrypted && (
            <div className="p-3 bg-saylo-emerald/10 border border-saylo-emerald/30 rounded-2xl flex items-center gap-2.5 text-saylo-emerald text-xs">
              <Shield size={16} className="flex-shrink-0" />
              <span>This message is protected by End-to-End Encryption (E2EE).</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;

