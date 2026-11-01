import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Check, User, Info, Phone, Mail, ArrowLeft, Upload, QrCode, Share2, Copy, X, AtSign } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [about, setAbout] = useState(user?.about || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const fileInputRef = useRef(null);

  // Sync state whenever user data loads from AuthContext
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setAbout(user.about || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Handle Save Profile
  const handleSave = async (e) => {
    e.preventDefault();
    setUsernameError('');

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername && !/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setUsernameError('Username must be 3-30 lowercase characters, numbers or underscores');
      return;
    }

    setLoading(true);
    setSaved(false);

    try {
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        username: cleanUsername,
        about: about.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
      });
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update profile';
      if (msg.toLowerCase().includes('username')) {
        setUsernameError(msg);
      } else {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Custom Avatar File Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatar(res.data.file.url);
    } catch (err) {
      console.error('Avatar upload failed', err);
      alert('Failed to upload profile photo');
    } finally {
      setUploading(false);
    }
  };

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header with Back Navigation & WhatsApp QR Code */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center gap-3">
          <Link
            to="/chats"
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Back to chats"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        </div>

        {/* WhatsApp QR Code Icon */}
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="p-2 text-saylo-emerald hover:bg-saylo-emerald/15 rounded-full transition-colors flex items-center gap-1.5"
          title="My Contact QR Code"
        >
          <QrCode size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-xl w-full mx-auto space-y-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Header with Hover to Change & Upload */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative mb-3 group cursor-pointer"
              title="Click to upload profile photo"
            >
              <Avatar src={avatar} name={name || 'User'} size="2xl" />
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={26} className="text-white mb-1" />
                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">
                  {uploading ? 'Uploading...' : 'Change Photo'}
                </span>
              </div>
            </div>

            {/* Hidden file input for custom image upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-saylo-emerald hover:underline font-semibold flex items-center gap-1.5 mb-4"
            >
              <Upload size={13} />
              Upload custom photo
            </button>

            {/* Presets */}
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Or choose an avatar preset</p>
            <div className="flex items-center gap-2.5">
              {avatarPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`preset-${idx}`}
                  onClick={() => setAvatar(preset)}
                  className={`w-10 h-10 rounded-full cursor-pointer border-2 transition-transform ${
                    avatar === preset
                      ? 'border-saylo-emerald scale-110 shadow-lg'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 bg-white dark:bg-[#202c33] p-6 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-lg">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <User size={14} className="text-saylo-emerald" />
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your display name"
                className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                This is not your username or pin. This name will be visible to your SAYLO contacts.
              </span>
            </div>

            {/* WhatsApp Profile Username */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <AtSign size={14} className="text-saylo-emerald" />
                Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-semibold font-mono text-gray-400 select-none">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setUsername(val);
                    setUsernameError('');
                  }}
                  maxLength={30}
                  placeholder="username"
                  className={`w-full bg-white dark:bg-[#111b21] border ${
                    usernameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  } rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald`}
                />
              </div>
              {usernameError ? (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                  {usernameError}
                </span>
              ) : (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                  Usernames are unique. People can find and start chats with you on SAYLO using @{username || 'username'} without seeing your phone number.
                </span>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Info size={14} className="text-saylo-emerald" />
                About
              </label>
              <input
                type="text"
                value={about}
                maxLength={139}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Hey there! I am using SAYLO."
                className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Phone size={14} className="text-saylo-emerald" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-saylo-emerald"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Mail size={14} className="text-gray-500" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-gray-100 dark:bg-[#111b21]/50 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            {saved ? (
              <span className="text-xs text-saylo-emerald font-semibold flex items-center gap-1">
                <Check size={16} /> Profile changes saved!
              </span>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-saylo-emerald hover:bg-saylo-600 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* WhatsApp Personal Contact QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#202c33] p-6 rounded-3xl max-w-sm w-full text-center border border-gray-200 dark:border-gray-700 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Profile Avatar & Info */}
            <div className="flex flex-col items-center mb-4">
              <Avatar src={avatar} name={name || 'User'} size="lg" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-2">{name || 'Your Name'}</h3>
              {username ? (
                <p className="text-xs text-saylo-emerald font-mono font-semibold">
                  @{username}
                </p>
              ) : (
                <p className="text-xs text-saylo-emerald dark:text-saylo-400 font-mono font-medium">
                  {phone || user?.email || 'SAYLO Contact'}
                </p>
              )}
            </div>

            {/* High-Contrast SVG QR Code with Emerald Accent */}
            <div className="w-56 h-56 mx-auto bg-white p-4 rounded-3xl mb-4 flex items-center justify-center shadow-md border-4 border-saylo-emerald/30">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Outer Markers */}
                <rect x="5" y="5" width="28" height="28" rx="4" fill="#111827" />
                <rect x="10" y="10" width="18" height="18" rx="2" fill="white" />
                <rect x="14" y="14" width="10" height="10" rx="2" fill="#00a884" />

                <rect x="67" y="5" width="28" height="28" rx="4" fill="#111827" />
                <rect x="72" y="10" width="18" height="18" rx="2" fill="white" />
                <rect x="76" y="14" width="10" height="10" rx="2" fill="#00a884" />

                <rect x="5" y="67" width="28" height="28" rx="4" fill="#111827" />
                <rect x="10" y="72" width="18" height="18" rx="2" fill="white" />
                <rect x="14" y="76" width="10" height="10" rx="2" fill="#00a884" />

                {/* Grid Pattern Modules */}
                <rect x="40" y="10" width="8" height="8" fill="#111827" />
                <rect x="52" y="10" width="8" height="8" fill="#111827" />
                <rect x="44" y="22" width="12" height="8" fill="#111827" />

                <rect x="10" y="40" width="8" height="8" fill="#111827" />
                <rect x="22" y="48" width="8" height="12" fill="#111827" />
                <rect x="40" y="40" width="20" height="20" rx="4" fill="#00a884" />
                <rect x="68" y="44" width="12" height="8" fill="#111827" />
                <rect x="84" y="40" width="8" height="16" fill="#111827" />

                <rect x="40" y="68" width="12" height="8" fill="#111827" />
                <rect x="56" y="76" width="8" height="14" fill="#111827" />
                <rect x="68" y="68" width="12" height="12" fill="#111827" />
                <rect x="84" y="72" width="8" height="8" fill="#111827" />
              </svg>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4 px-2 leading-relaxed">
              Your QR code is private. When people scan it, they can immediately chat with you on SAYLO.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/chats?start=${user?._id}`;
                  navigator.clipboard.writeText(link);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2500);
                }}
                className="flex-1 py-2 px-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check size={14} className="text-saylo-emerald" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Message ${name} on SAYLO`,
                      text: `Scan my SAYLO QR code to start a conversation:`,
                      url: window.location.origin,
                    }).catch(() => {});
                  } else {
                    alert('Sharing not supported on this browser. Link copied to clipboard!');
                    navigator.clipboard.writeText(window.location.origin);
                  }
                }}
                className="flex-1 py-2 px-3 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <Share2 size={14} />
                <span>Share Code</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
