import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
      });
      navigate('/chats');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

      {/* Card */}
      <div className="w-full max-w-md bg-[#111b21] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-100 mb-1">Create an account</h2>
          <p className="text-xs text-gray-400">Join SAYLO to chat with friends, colleagues and groups</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="w-full bg-[#202c33] border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald transition-colors"
              />
            </div>
          </div>

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
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Phone Number (Optional)</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-[#202c33] border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full bg-[#202c33] border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-saylo-emerald hover:bg-saylo-600 text-white font-semibold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-saylo-emerald hover:underline font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
