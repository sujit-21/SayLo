import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid or expired reset token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#f0f2f5] dark:bg-[#0c1317] p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Set New Password</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Enter your new secure password below.</p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-saylo-emerald/10 border border-saylo-emerald/30 rounded-2xl text-center space-y-2">
            <CheckCircle className="mx-auto text-saylo-emerald" size={32} />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Password Reset Successfully</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-300 dark:border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm password"
                  className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-300 dark:border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-saylo-emerald hover:bg-saylo-600 text-white font-semibold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

