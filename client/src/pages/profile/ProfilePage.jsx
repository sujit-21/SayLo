import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Check, User, Info, Phone, Mail, ArrowLeft, Upload } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Sync state whenever user data loads from AuthContext
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAbout(user.about || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Handle Save Profile
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        about: about.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
      });
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
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
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      {/* Header with Back Navigation */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-800 bg-[#202c33]">
        <Link
          to="/chats"
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Back to chats"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Profile</h1>
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
            <p className="text-[11px] text-gray-400 mb-2">Or choose an avatar preset</p>
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
          <div className="space-y-4 bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
                <User size={14} className="text-saylo-emerald" />
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your display name"
                className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                This is not your username or pin. This name will be visible to your SAYLO contacts.
              </span>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
                <Info size={14} className="text-saylo-emerald" />
                About
              </label>
              <input
                type="text"
                value={about}
                maxLength={139}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Hey there! I am using SAYLO."
                className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
                <Phone size={14} className="text-saylo-emerald" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-saylo-emerald"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
                <Mail size={14} className="text-gray-500" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#111b21]/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
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
    </div>
  );
};

export default ProfilePage;
