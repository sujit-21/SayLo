import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#0c1317] text-white p-4 text-center select-none">
      <div className="w-20 h-20 rounded-3xl bg-saylo-emerald/10 border border-saylo-emerald/20 flex items-center justify-center mb-6">
        <span className="text-3xl font-black text-saylo-emerald">404</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-xs text-gray-400 max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/chats"
        className="flex items-center gap-2 px-5 py-2.5 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
      >
        <Home size={16} />
        Return to Chats
      </Link>
    </div>
  );
};

export default NotFoundPage;
