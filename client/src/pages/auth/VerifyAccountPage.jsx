import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const VerifyAccountPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-account', { code });
      setVerified(true);
      updateUser({ isVerified: true });
      setTimeout(() => {
        navigate('/chats');
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#0c1317] p-4 select-none">
      <div className="w-full max-w-md bg-[#111b21] border border-gray-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-saylo-emerald/20 text-saylo-emerald flex items-center justify-center mb-4">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-100 mb-1">Verify Your Account</h2>
        <p className="text-xs text-gray-400 mb-6">
          Enter the 6-digit confirmation code sent to {user?.email || 'your email'}
        </p>

        {verified ? (
          <div className="p-4 bg-saylo-emerald/10 border border-saylo-emerald/30 rounded-2xl space-y-2">
            <CheckCircle className="mx-auto text-saylo-emerald" size={32} />
            <h4 className="text-sm font-bold text-white">Account Verified!</h4>
            <p className="text-xs text-gray-300">Taking you to chats...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required
              className="w-full text-center tracking-widest text-2xl font-mono bg-[#202c33] border border-gray-700/80 rounded-xl py-3 text-white focus:outline-none focus:border-saylo-emerald"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-saylo-emerald hover:bg-saylo-600 text-white font-semibold text-sm rounded-xl shadow-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Confirm Verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyAccountPage;
