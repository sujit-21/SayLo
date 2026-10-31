import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Volume2, Shield, Play } from 'lucide-react';

const NotificationSettings = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTone, setSelectedTone] = useState(
    localStorage.getItem('saylo_notification_tone') || 'chime'
  );
  const [desktopNotifications, setDesktopNotifications] = useState(false);
  const [showPreviews, setShowPreviews] = useState(true);

  const notificationTones = [
    { id: 'chime', name: 'Emerald Chime (Default)', freq: 880 },
    { id: 'droplet', name: 'Water Droplet', freq: 1046 },
    { id: 'bell', name: 'Modern Bell', freq: 659 },
    { id: 'cosmic', name: 'Cosmic Ping', freq: 1318 },
    { id: 'pop', name: 'Bubble Pop', freq: 523 },
  ];

  // Play synthesized preview tone using Web Audio API
  const playPreviewTone = (freq) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectTone = (tone) => {
    setSelectedTone(tone.id);
    localStorage.setItem('saylo_notification_tone', tone.id);
    playPreviewTone(tone.freq);
  };

  const requestDesktopPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setDesktopNotifications(permission === 'granted');
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <Link to="/settings" className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="bg-white dark:bg-[#202c33] p-6 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-lg divide-y divide-gray-200 dark:divide-gray-700/40 space-y-4">
          {/* Sounds */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notification Sounds</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Play sounds for incoming messages and calls</p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-saylo-emerald focus:ring-saylo-emerald"
            />
          </div>

          {/* Sound Tone Chooser */}
          {soundEnabled && (
            <div className="pt-4 pb-2 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Default Notification Tone</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select your preferred incoming message chime</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notificationTones.map((tone) => {
                  const isSelected = selectedTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => handleSelectTone(tone)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-colors ${
                        isSelected
                          ? 'border-saylo-emerald bg-saylo-emerald/10 text-saylo-emerald font-semibold'
                          : 'border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-[#111b21] hover:border-gray-400 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Volume2 size={16} className={isSelected ? 'text-saylo-emerald' : 'text-gray-400'} />
                        <span className="text-xs font-semibold">{tone.name}</span>
                      </div>
                      <Play size={13} className="text-saylo-emerald opacity-75" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop Push Notifications */}
          <div className="flex items-center justify-between pt-4 pb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Desktop Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Show notifications when browser window is in background</p>
            </div>
            <button
              onClick={requestDesktopPermission}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                desktopNotifications
                  ? 'bg-saylo-emerald/10 text-saylo-emerald border border-saylo-emerald/30'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white'
              }`}
            >
              {desktopNotifications ? 'Enabled' : 'Request Permission'}
            </button>
          </div>

          {/* Message Previews */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Message Previews</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Display sender and message text in notifications</p>
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

