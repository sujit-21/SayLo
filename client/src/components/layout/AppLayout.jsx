import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationSidebar from './NavigationSidebar';
import CallOverlay from '../calls/CallOverlay';

const AppLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c1317] text-[#e9edef]">
      {/* Primary Left Navigation Strip */}
      <NavigationSidebar />

      {/* Main Content (Chats, Status, Calls, Settings, etc.) */}
      <main className="flex-1 h-full flex overflow-hidden">
        <Outlet />
      </main>

      {/* WebRTC Audio & Video Calling Modal Overlay */}
      <CallOverlay />
    </div>
  );
};

export default AppLayout;
