import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Shield, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PrivacySettings = () => {
  const { user, updateUser } = useAuth();
  const [privacy, setPrivacy] = useState(user?.privacy || {
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    about: 'everyone',
    readReceipts: true,
    disappearingDefaultTimer: 0,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (updatedFields) => {
    const newPrivacy = { ...privacy, ...updatedFields };
    setPrivacy(newPrivacy);
    setLoading(true);
    setSaved(false);

    try {
      const res = await api.put('/auth/privacy', newPrivacy);
      updateUser({ privacy: res.data.privacy });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="p-1 rounded-full text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-100">Privacy</h1>
        </div>
        {saved && (
          <span className="text-xs text-saylo-emerald font-semibold flex items-center gap-1">
            <Check size={16} /> Saved
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        {/* Last Seen & Online */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-100">Who can see my Last Seen & Online</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              If you don't share your Last Seen, you won't be able to see other people's Last Seen.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            {['everyone', 'contacts', 'nobody'].map((opt) => (
              <button
                key={opt}
                onClick={() => handleSave({ lastSeen: opt })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                  privacy.lastSeen === opt
                    ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Photo */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-100">Who can see my Profile Photo</h3>
            <p className="text-xs text-gray-400 mt-0.5">Control who can view your avatar.</p>
          </div>

          <div className="flex gap-2 pt-2">
            {['everyone', 'contacts', 'nobody'].map((opt) => (
              <button
                key={opt}
                onClick={() => handleSave({ profilePhoto: opt })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                  privacy.profilePhoto === opt
                    ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Read Receipts */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg flex items-center justify-between">
          <div className="pr-4">
            <h3 className="text-sm font-bold text-gray-100">Read Receipts</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              If turned off, you won't send or receive Read Receipts (double blue checkmarks).
            </p>
          </div>

          <input
            type="checkbox"
            checked={privacy.readReceipts}
            onChange={(e) => handleSave({ readReceipts: e.target.checked })}
            className="w-5 h-5 rounded text-saylo-emerald focus:ring-saylo-emerald"
          />
        </div>

        {/* Default Disappearing Message Timer */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-100">Default message timer for new chats</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Start new chats with disappearing messages enabled.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { label: '24 Hours', val: 86400 },
              { label: '7 Days', val: 604800 },
              { label: '90 Days', val: 7776000 },
              { label: 'Off', val: 0 },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => handleSave({ disappearingDefaultTimer: t.val })}
                className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-colors ${
                  privacy.disappearingDefaultTimer === t.val
                    ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
