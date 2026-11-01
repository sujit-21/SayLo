import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  CircleDashed,
  Phone,
  Users,
  Contact,
  Star,
  Archive,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
  Laptop,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';

const NavigationSidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { conversations, activeConversation } = useChat();
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
    { to: '/contacts', icon: Contact, label: 'Contacts' },
    { to: '/starred', icon: Star, label: 'Starred' },
    { to: '/archived', icon: Archive, label: 'Archived' },
  ];

  const mobileNavItems = [
    { to: '/chats', icon: MessageSquare, label: 'Chats', badge: totalUnread },
    { to: '/status', icon: CircleDashed, label: 'Updates' },
    { to: '/calls', icon: Phone, label: 'Calls' },
    { to: '/contacts', icon: Contact, label: 'Contacts' },
    { to: '/communities', icon: Users, label: 'Communities' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Desktop & Laptop Vertical Navigation Strip (>= 768px) */}
      <aside className="hidden md:flex w-16 h-full bg-[#f0f2f5] dark:bg-[#202c33] border-r border-gray-200 dark:border-gray-800 flex-col items-center justify-between py-3 flex-shrink-0 z-30 select-none transition-colors duration-150">
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
                        ? 'bg-saylo-emerald/15 dark:bg-white/10 text-saylo-emerald'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                    }`
                  }
                  title={item.label}
                >
                  <Icon size={21} />
                  {item.badge > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-saylo-emerald text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#f0f2f5] dark:ring-[#202c33]">
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
            className="w-10 h-10 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
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
                  ? 'bg-saylo-emerald/15 dark:bg-white/10 text-saylo-emerald'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
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
                className="absolute left-14 bottom-0 w-48 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-2xl py-2 z-50 text-xs text-gray-800 dark:text-gray-200 animate-fadeIn"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-3.5 py-2 border-b border-gray-100 dark:border-gray-700/60 mb-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5"
                >
                  <User size={15} />
                  My Profile
                </button>

                <button
                  onClick={() => {
                    navigate('/settings/security');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5"
                >
                  <Laptop size={15} />
                  Linked Devices
                </button>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5"
                >
                  <Settings size={15} />
                  Settings
                </button>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5 text-red-500"
                >
                  <LogOut size={15} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Native Bottom Navigation Bar (< 768px) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-800 items-center justify-around px-2 z-40 select-none shadow-2xl transition-colors duration-150 ${
          activeConversation ? 'hidden' : 'flex'
        }`}
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                  isActive ? 'text-saylo-emerald font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <div className="relative">
                <Icon size={22} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-saylo-emerald text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#f0f2f5] dark:ring-[#202c33]">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default NavigationSidebar;

