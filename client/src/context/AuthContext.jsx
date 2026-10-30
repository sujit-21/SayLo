import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getOrCreateUserKeyPair } from '../utils/e2ee';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('saylo_token'));
  const [loading, setLoading] = useState(true);
  const [e2eeKeyPair, setE2eeKeyPair] = useState(null);

  // Initialize and synchronize user E2EE keys
  useEffect(() => {
    const initE2EE = async () => {
      if (user && token) {
        try {
          const keys = await getOrCreateUserKeyPair();
          if (keys) {
            setE2eeKeyPair(keys);
            if (!user.publicKey || user.publicKey !== keys.publicKeyBase64) {
              await api.put('/auth/public-key', { publicKey: keys.publicKeyBase64 });
              setUser((prev) => ({ ...prev, publicKey: keys.publicKeyBase64 }));
            }
          }
        } catch (err) {
          console.error('[E2EE] Init error:', err);
        }
      }
    };
    initE2EE();
  }, [user?._id, token]);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('saylo_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Fetch user failed', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password, deviceName, twoFactorPin) => {
    const res = await api.post('/auth/login', { email, password, deviceName, twoFactorPin });
    if (res.data.requireTwoFactor) {
      return { requireTwoFactor: true };
    }
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('saylo_token', res.data.token);
    localStorage.setItem('saylo_user', JSON.stringify(res.data.user));
    return { success: true };
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('saylo_token', res.data.token);
    localStorage.setItem('saylo_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('saylo_token');
    localStorage.removeItem('saylo_user');
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    localStorage.setItem('saylo_user', JSON.stringify({ ...user, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        e2eeKeyPair,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

