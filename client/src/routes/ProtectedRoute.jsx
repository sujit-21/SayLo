import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0c1317]">
        <div className="w-10 h-10 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-gray-400 font-medium tracking-wider">Loading SAYLO...</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
