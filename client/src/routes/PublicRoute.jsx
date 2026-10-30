import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0c1317]">
        <div className="w-10 h-10 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/chats" replace /> : <Outlet />;
};

export default PublicRoute;
