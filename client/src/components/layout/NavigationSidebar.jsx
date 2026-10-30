import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  CircleDashed,
  Phone,
  Users,
  Star,
  Archive,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';

const NavigationSidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { conversations } = useChat();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Calculate total unread count
  const totalUnread = conversations.reduce((acc, c) => {
    const p = c.participants?.find((part) => (part.user?._id || part.user) === user?._id);
    return acc + (p?.unreadCount || 0);
  }, 0);

  const navItems = [
    { to: '/chats', icon: MessageSquare, label: 'Chats', badge: totalUnread },
    { to: '/status', icon: CircleDashed, label: 'Status' },
    { to: '/calls', icon: Phone, label: 'Calls' },
    { to: '/communities', icon: Users, label: 'Communities' },
    { to: '/starred', icon: Star, label: 'Starred' },
    { to: '/archived', icon: Archive, label: 'Archived' },
  ];

  return (
    <aside className="w-16 h-full bg-[#202c33] dark:bg-[#202c33] border-r border-gray-800 flex flex-col items-center justify-between py-3 flex-shrink-0 z-30 select-none">
      {/* Top: Logo & Navigation Links */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* SAYLO Logo */}
        <NavLink
          to="/chats"
          className="w-10 h-10 rounded-2xl bg-saylo-emerald flex items-center justify-center text-white shadow-lg mb-2 hover:scale-105 transition-transform"
          title="SAYLO"
        >
          <svg className="w-6 h-6" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" fill="#00A884" fillOpacity="0.2" />
            <path
              d="M50 20C33.4315 20 20 33.4315 20 50C20 55.733 21.6115 61.0927 24.3975 65.6566L21 79L34.7431 75.402C39.1415 78.2917 44.3752 80 50 80C66.5685 80 80 66.5685 80 50C80 33.4315 66.5685 20 50 20Z"
              fill="white"
            />
          </svg>
        </NavLink>

        {/* Links */}
        <nav className="flex flex-col items-center gap-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-white/10 text-saylo-emerald'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`
                }
                title={item.label}
              >
                <Icon size={21} />
                {item.badge > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-saylo-emerald text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#202c33]">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Theme Toggle, Settings, Profile Avatar */}
      <div className="flex flex-col items-center gap-2 w-full relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 flex items-center justify-center transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-white/10 text-saylo-emerald'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`
          }
          title="Settings"
        >
          <Settings size={20} />
        </NavLink>

        {/* Avatar Profile */}
        <div className="relative mt-1">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="hover:scale-105 transition-transform"
            title="Profile & Account"
          >
            <Avatar src={user?.avatar} name={user?.name || 'You'} size="sm" />
          </button>

          {/* Quick Profile Popover */}
          {showProfileMenu && (
            <div
              className="absolute left-14 bottom-0 w-48 bg-[#202c33] border border-gray-700/80 rounded-2xl shadow-2xl py-2 z-50 text-xs text-gray-200 animate-fadeIn"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-3.5 py-2 border-b border-gray-700/60 mb-1">
                <p className="font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-700/50 flex items-center gap-2.5"
              >
                <User size={15} />
                My Profile
              </button>

              <button
                onClick={() => {
                  navigate('/settings');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-700/50 flex items-center gap-2.5"
              >
                <Settings size={15} />
                Settings
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-700/50 flex items-center gap-2.5 text-red-400"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default NavigationSidebar;
