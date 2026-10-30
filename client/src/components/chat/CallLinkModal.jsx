import React, { useState } from 'react';
import { Video, Copy, Check, Share2, Link as LinkIcon, Phone } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';

const CallLinkModal = ({ isOpen, onClose }) => {
  const [callType, setCallType] = useState('video');
  const [callLink, setCallLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const res = await api.post('/calls/link', { type: callType });
      if (res.data?.fullUrl) {
        setCallLink(res.data.fullUrl);
      }
    } catch (err) {
      console.error('Failed to create call link', err);
      // Fallback
      setCallLink(`${window.location.origin}/call/saylo-${Math.random().toString(36).substring(2, 8)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!callLink) return;
    navigator.clipboard.writeText(callLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Call Link">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Anyone with SAYLO can use this link to join your call. Share it with friends or groups.
        </p>

        {/* Call Type Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setCallType('video');
              setCallLink('');
            }}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              callType === 'video'
                ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald'
                : 'border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Video size={16} />
            <span>Video Call</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCallType('audio');
              setCallLink('');
            }}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              callType === 'audio'
                ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald'
                : 'border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Phone size={16} />
            <span>Voice Call</span>
          </button>
        </div>

        {/* Generate / Link display */}
        {!callLink ? (
          <button
            type="button"
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full py-2.5 bg-saylo-emerald hover:bg-saylo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <LinkIcon size={16} />
            <span>{loading ? 'Generating link...' : 'Generate Call Link'}</span>
          </button>
        ) : (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 bg-[#111b21] border border-gray-700 rounded-xl p-2.5">
              <input
                type="text"
                readOnly
                value={callLink}
                className="bg-transparent text-xs text-gray-200 flex-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
                title="Copy link"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CallLinkModal;

