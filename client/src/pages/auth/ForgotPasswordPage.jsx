import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
      setResetToken(res.data.resetToken);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#0c1317] p-4 select-none">
      <div className="w-full max-w-md bg-[#111b21] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs text-saylo-emerald hover:underline mb-6 font-semibold"
        >
          <ArrowLeft size={16} /> Back to login
        </Link>

        <h2 className="text-xl font-bold text-gray-100 mb-1">Reset Password</h2>
        <p className="text-xs text-gray-400 mb-6">
          Enter your registered email and we will send password reset instructions.
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="p-4 bg-saylo-emerald/10 border border-saylo-emerald/30 rounded-2xl text-center space-y-3">
            <CheckCircle className="mx-auto text-saylo-emerald" size={32} />
            <h4 className="text-sm font-bold text-white">Reset Link Generated</h4>
            <p className="text-xs text-gray-300">
              For testing convenience in this development environment, you can reset your password immediately:
            </p>
            {resetToken && (
              <Link
                to={`/reset-password/${resetToken}`}
                className="inline-block px-4 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold"
              >
                Go to Reset Password Screen
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full bg-[#202c33] border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-saylo-emerald hover:bg-saylo-600 text-white font-semibold text-sm rounded-xl shadow-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

