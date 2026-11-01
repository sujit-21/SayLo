import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  User,
  Shield,
  Lock,
  Bell,
  Palette,
  Key,
  HardDrive,
  MessageSquare,
  ChevronRight,
  LogOut,
  Laptop,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const { user, logout } = useAuth();

  const settingsLinks = [
    { to: '/profile', icon: User, label: 'Profile', desc: 'Avatar, name, about status' },
    { to: '/settings/account', icon: Key, label: 'Account', desc: 'Security info, export data' },
    { to: '/settings/linked-devices', icon: Laptop, label: 'Linked Devices', desc: 'Manage web, desktop, and tablet sessions' },
    { to: '/settings/privacy', icon: Lock, label: 'Privacy', desc: 'Last seen, read receipts, disappearing timer' },
    { to: '/settings/security', icon: Shield, label: 'Security & Linked Devices', desc: 'Two-step verification, device sessions' },
    { to: '/settings/chats', icon: MessageSquare, label: 'Chats & Backup', desc: 'Chat backup, enter is send, chat history' },
    { to: '/settings/storage', icon: HardDrive, label: 'Storage and Data', desc: 'Network usage, media storage breakdown' },
    { to: '/settings/notifications', icon: Bell, label: 'Notifications', desc: 'Message tones, desktop notifications' },
    { to: '/settings/appearance', icon: Palette, label: 'Appearance & Wallpaper', desc: 'Dark/light theme, chat backgrounds' },
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden">
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        {/* User Card */}
        <Link
          to="/profile"
          className="flex items-center justify-between p-4 bg-white dark:bg-[#202c33] rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-lg hover:border-saylo-emerald transition-colors"
        >
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar} name={user?.name || 'User'} size="lg" />
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{user?.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{user?.about}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
        </Link>

        {/* Settings Links */}
        <div className="bg-white dark:bg-[#202c33] rounded-3xl border border-gray-200 dark:border-gray-700/60 divide-y divide-gray-200 dark:divide-gray-700/40 overflow-hidden shadow-lg">
          {settingsLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 text-saylo-emerald flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
              </NavLink>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 font-semibold text-xs rounded-2xl border border-red-500/20 transition-colors"
        >
          <LogOut size={16} />
          Log Out of SAYLO
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

