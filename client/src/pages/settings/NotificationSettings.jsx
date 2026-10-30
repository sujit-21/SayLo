import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Volume2, Shield } from 'lucide-react';

const NotificationSettings = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);
  const [showPreviews, setShowPreviews] = useState(true);

  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setDesktopNotifications(permission === 'granted');
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-800 bg-[#202c33]">
        <Link to="/settings" className="p-1 rounded-full text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Notifications</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg divide-y divide-gray-700/40 space-y-4">
          {/* Sounds */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-100">Notification Sounds</h3>
              <p className="text-xs text-gray-400 mt-0.5">Play sounds for incoming messages and calls</p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-saylo-emerald focus:ring-saylo-emerald"
            />
          </div>

          {/* Desktop Push Notifications */}
          <div className="flex items-center justify-between pt-4 pb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-100">Desktop Notifications</h3>
              <p className="text-xs text-gray-400 mt-0.5">Show notifications when browser window is in background</p>
            </div>
            <button
              onClick={requestDesktopPermission}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                desktopNotifications
                  ? 'bg-saylo-emerald/10 text-saylo-emerald border border-saylo-emerald/30'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              {desktopNotifications ? 'Enabled' : 'Request Permission'}
            </button>
          </div>

          {/* Message Previews */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <h3 className="text-sm font-bold text-gray-100">Message Previews</h3>
              <p className="text-xs text-gray-400 mt-0.5">Display sender and message text in notifications</p>
            </div>
            <input
              type="checkbox"
              checked={showPreviews}
              onChange={(e) => setShowPreviews(e.target.checked)}
              className="w-5 h-5 rounded text-saylo-emerald focus:ring-saylo-emerald"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

