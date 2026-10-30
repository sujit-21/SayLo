import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorPin, setTwoFactorPin] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(
        email.trim(),
        password,
        'Web Browser (Chrome/Firefox)',
        needsTwoFactor ? twoFactorPin : undefined
      );

      if (res.requireTwoFactor) {
        setNeedsTwoFactor(true);
        setLoading(false);
        return;
      }

      navigate('/chats');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill test demo account
  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#0c1317] p-4 relative select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-saylo-emerald flex items-center justify-center text-white shadow-xl">
          <svg className="w-7 h-7" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" fill="#00A884" fillOpacity="0.2" />
            <path
              d="M50 20C33.4315 20 20 33.4315 20 50C20 55.733 21.6115 61.0927 24.3975 65.6566L21 79L34.7431 75.402C39.1415 78.2917 44.3752 80 50 80C66.5685 80 80 66.5685 80 50C80 33.4315 66.5685 20 50 20Z"
              fill="white"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SAYLO</h1>
          <p className="text-xs text-saylo-emerald font-medium">Real-Time Messaging Platform</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#111b21] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-100 mb-1">
            {needsTwoFactor ? 'Two-Factor Verification' : 'Welcome back'}
          </h2>
          <p className="text-xs text-gray-400">
            {needsTwoFactor
              ? 'Enter your 4-digit security PIN to continue'
              : 'Log in with your SAYLO account credentials'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!needsTwoFactor ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-[#202c33] border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-saylo-emerald hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#202c33] border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">4-Digit Security PIN</label>
              <div className="relative">
                <ShieldCheck size={18} className="absolute left-3.5 top-3 text-saylo-emerald" />
                <input
                  type="password"
                  maxLength={6}
                  value={twoFactorPin}
                  onChange={(e) => setTwoFactorPin(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="••••"
                  className="w-full text-center tracking-widest text-lg font-mono bg-[#202c33] border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-gray-100 focus:outline-none focus:border-saylo-emerald transition-colors"
                  autoFocus
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-saylo-emerald hover:bg-saylo-600 text-white font-semibold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : needsTwoFactor ? 'Verify & Continue' : 'Log In'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Logins */}
        <div className="mt-6 pt-5 border-t border-gray-800">
          <p className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider text-center">
            Instant Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('alice@saylo.com')}
              className="px-2 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[11px] text-gray-200 border border-gray-700/60 transition-colors truncate"
            >
              Alice Morgan
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('bob@saylo.com')}
              className="px-2 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[11px] text-gray-200 border border-gray-700/60 transition-colors truncate"
            >
              Bob Miller
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('charlie@saylo.com')}
              className="px-2 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[11px] text-gray-200 border border-gray-700/60 transition-colors truncate"
            >
              Charlie Davis
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-saylo-emerald hover:underline font-semibold">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

