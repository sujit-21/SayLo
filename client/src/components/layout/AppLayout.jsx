import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NavigationSidebar from './NavigationSidebar';
import CallOverlay from '../calls/CallOverlay';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { WifiOff, RefreshCw } from 'lucide-react';

const AppLayout = () => {
  const { socket } = useSocket();
  const { activeConversation } = useChat();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketConnected, setSocketConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (socket) {
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket]);

  const isDisconnected = !isOnline || !socketConnected;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c1317] text-[#e9edef]">
      {/* Offline / Reconnecting Banner */}
      {isDisconnected && (
        <div className="bg-amber-600/90 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2 select-none animate-fadeIn z-50">
          <WifiOff size={15} />
          <span>Connecting to SAYLO... Checking network connection</span>
          <RefreshCw size={12} className="animate-spin ml-1" />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation (Vertical sidebar on desktop, bottom navigation on mobile) */}
        <NavigationSidebar />

        {/* Main Content (Chats, Status, Calls, Settings, etc.) */}
        <main
          className={`flex-1 h-full flex overflow-hidden ${
            !activeConversation ? 'pb-16 md:pb-0' : ''
          }`}
        >
          <Outlet />
        </main>

        {/* WebRTC Audio & Video Calling Modal Overlay */}
        <CallOverlay />
      </div>
    </div>
  );
};

export default AppLayout;

