import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Smartphone, Laptop, Trash2, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { format } from 'date-fns';

const SecuritySettings = () => {
  const { user, updateUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/users/devices');
      setSessions(res.data.sessions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleToggleTwoFactor = async () => {
    if (twoFactorEnabled) {
      if (!window.confirm('Disable two-factor PIN verification?')) return;
      try {
        await api.post('/auth/two-factor', { enable: false });
        setTwoFactorEnabled(false);
        updateUser({ twoFactorEnabled: false });
      } catch (e) {
        console.error(e);
      }
    } else {
      setShowPinInput(true);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      alert('PIN must be at least 4 digits');
      return;
    }

    try {
      await api.post('/auth/two-factor', { enable: true, pin });
      setTwoFactorEnabled(true);
      setShowPinInput(false);
      updateUser({ twoFactorEnabled: true });
      alert('Two-factor PIN enabled successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/users/devices/${sessionId}`);
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-800 bg-[#202c33]">
        <Link to="/settings" className="p-1 rounded-full text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Security & Linked Devices</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        {/* Two-step Verification */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-saylo-emerald/10 text-saylo-emerald flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100">Two-Step Verification</h3>
                <p className="text-xs text-gray-400">
                  {twoFactorEnabled ? 'Enabled with PIN protection' : 'Add extra security with a 4-digit PIN'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleTwoFactor}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                twoFactorEnabled
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-saylo-emerald text-white hover:bg-saylo-600'
              }`}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {showPinInput && (
            <form onSubmit={handleSavePin} className="pt-3 border-t border-gray-700/60 space-y-3">
              <label className="block text-xs font-medium text-gray-300">Set 4-Digit Security PIN</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  required
                  className="bg-[#111b21] border border-gray-700 rounded-xl px-4 py-2 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-saylo-emerald"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Save PIN
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="px-3 py-2 text-gray-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Linked Devices Section */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-100">Linked Devices</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage web sessions logged into your account</p>
            </div>
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-saylo-emerald text-white rounded-xl text-xs font-semibold hover:bg-saylo-600"
            >
              <QrCode size={15} />
              Link Device
            </button>
          </div>

          {/* Device Sessions List */}
          <div className="space-y-2 pt-2">
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No other active device sessions</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#111b21] border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Laptop size={20} className="text-saylo-emerald" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {s.deviceName} ({s.browser})
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {s.os} • Last active {format(new Date(s.lastActive || Date.now()), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeSession(s._id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg"
                    title="Log out device"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QR Code Link Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#202c33] p-6 rounded-3xl max-w-sm w-full text-center border border-gray-700">
            <h3 className="text-base font-bold text-white mb-1">Scan QR Code</h3>
            <p className="text-xs text-gray-400 mb-4">
              Open SAYLO on your phone and scan this code to link this device.
            </p>

            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl mb-4 flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="0" y="0" width="30" height="30" fill="black" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="black" />
                <rect x="70" y="0" width="30" height="30" fill="black" />
                <rect x="75" y="5" width="20" height="20" fill="white" />
                <rect x="80" y="10" width="10" height="10" fill="black" />
                <rect x="0" y="70" width="30" height="30" fill="black" />
                <rect x="5" y="75" width="20" height="20" fill="white" />
                <rect x="10" y="80" width="10" height="10" fill="black" />
                <rect x="40" y="40" width="20" height="20" fill="#00A884" />
              </svg>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="px-5 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;

