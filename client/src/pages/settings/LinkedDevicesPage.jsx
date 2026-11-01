import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Laptop,
  Smartphone,
  Monitor,
  Globe,
  Lock,
  Plus,
  Trash2,
  Check,
  X,
  ScanLine,
  QrCode,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const LinkedDevicesPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTab, setLinkTab] = useState('scan'); // 'scan' | 'qr'
  const [scannerStream, setScannerStream] = useState(null);
  const scannerVideoRef = useRef(null);
  const [revokingId, setRevokingId] = useState(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Fetch active device sessions from backend / localStorage
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/devices');
      let backendSessions = res.data.sessions || [];

      // Ensure current session is represented if backend returned empty
      if (backendSessions.length === 0) {
        const userAgent = navigator.userAgent;
        let os = 'Windows';
        if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

        let browser = 'Chrome';
        if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';

        backendSessions = [
          {
            _id: 'current_device',
            deviceName: `${os} · ${browser}`,
            browser,
            os,
            lastActive: new Date().toISOString(),
            isCurrent: true,
            ipAddress: 'Current Session',
          },
        ];
      }
      setSessions(backendSessions);
    } catch (e) {
      // Local fallback
      setSessions([
        {
          _id: 'current_device',
          deviceName: 'Windows · Chrome',
          browser: 'Chrome',
          os: 'Windows',
          lastActive: new Date().toISOString(),
          isCurrent: true,
          ipAddress: 'Active now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Stop scanner camera stream cleanly
  const stopScanner = () => {
    if (scannerStream) {
      scannerStream.getTracks().forEach((track) => track.stop());
      setScannerStream(null);
    }
  };

  const startScanner = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setScannerStream(stream);
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
    }
  };

  useEffect(() => {
    if (showLinkModal && linkTab === 'scan') {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [showLinkModal, linkTab]);

  // Log out a remote device session
  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to log out this device?')) return;
    try {
      setRevokingId(sessionId);
      await api.delete(`/users/devices/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      // Remove locally
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } finally {
      setRevokingId(null);
    }
  };

  // Simulate pairing a new device
  const handleSimulateLinkDevice = () => {
    setLinkSuccess(true);
    setTimeout(() => {
      const newDevice = {
        _id: `dev_${Date.now()}`,
        deviceName: 'macOS · Safari',
        browser: 'Safari',
        os: 'macOS',
        lastActive: new Date().toISOString(),
        isCurrent: false,
        ipAddress: 'Linked just now',
      };
      setSessions((prev) => [...prev, newDevice]);
      setLinkSuccess(false);
      stopScanner();
      setShowLinkModal(false);
    }, 1200);
  };

  const getDeviceIcon = (os = '') => {
    const lower = os.toLowerCase();
    if (lower.includes('mac') || lower.includes('windows') || lower.includes('linux')) {
      return <Laptop size={22} className="text-saylo-emerald" />;
    }
    if (lower.includes('android') || lower.includes('ios') || lower.includes('phone')) {
      return <Smartphone size={22} className="text-saylo-emerald" />;
    }
    return <Monitor size={22} className="text-saylo-emerald" />;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Linked Devices</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        {/* Hero Visual Card */}
        <div className="bg-white dark:bg-[#202c33] p-6 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-lg text-center flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-saylo-emerald/10 flex items-center justify-center text-saylo-emerald mb-4">
            <Laptop size={44} strokeWidth={1.75} />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            Use SAYLO on other devices
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-5 leading-relaxed">
            Link your web browser, tablet, or desktop. Your personal chats and calls remain end-to-end encrypted.
          </p>

          <button
            type="button"
            onClick={() => {
              setLinkTab('scan');
              setShowLinkModal(true);
            }}
            className="px-6 py-2.5 bg-saylo-emerald hover:bg-saylo-600 text-white font-semibold text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Link a Device</span>
          </button>
        </div>

        {/* Device Status Section */}
        <div className="bg-white dark:bg-[#202c33] p-5 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Device Status</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tap a device to log out remotely
              </p>
            </div>
            <button
              type="button"
              onClick={fetchSessions}
              className="p-1.5 text-gray-400 hover:text-saylo-emerald rounded-full transition-colors"
              title="Refresh sessions"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No other devices linked</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gray-100 dark:bg-[#111b21] flex-shrink-0">
                      {getDeviceIcon(session.os || session.deviceName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                          {session.deviceName || 'Web Session'}
                        </h4>
                        {session.isCurrent && (
                          <span className="text-[10px] bg-saylo-emerald/15 text-saylo-emerald font-bold px-2 py-0.5 rounded-full">
                            This device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {session.isCurrent
                          ? 'Active now'
                          : session.lastActive
                          ? `Last active: ${new Date(session.lastActive).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : 'Linked session'}
                      </p>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      type="button"
                      disabled={revokingId === session._id}
                      onClick={() => handleRevokeSession(session._id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>{revokingId === session._id ? 'Logging out...' : 'Log out'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* E2EE Multi-Device Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 py-3">
          <Lock size={14} className="text-saylo-emerald flex-shrink-0" />
          <span>Your personal messages are end-to-end encrypted on all your devices.</span>
        </div>
      </div>

      {/* Link a Device Modal (QR Scanner & Pairing Code) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#202c33] p-6 rounded-3xl max-w-sm w-full text-center border border-gray-200 dark:border-gray-700 shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                stopScanner();
                setShowLinkModal(false);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Link New Device</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Scan the QR code shown on your other computer or tablet
              </p>
            </div>

            {/* Tab switch: Scan QR vs Show Pairing Code */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-2">
              <button
                type="button"
                onClick={() => setLinkTab('scan')}
                className={`flex-1 pb-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  linkTab === 'scan'
                    ? 'border-saylo-emerald text-saylo-emerald'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ScanLine size={14} />
                <span>Scan QR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  setLinkTab('qr');
                }}
                className={`flex-1 pb-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  linkTab === 'qr'
                    ? 'border-saylo-emerald text-saylo-emerald'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <QrCode size={14} />
                <span>Show Pairing QR</span>
              </button>
            </div>

            {linkTab === 'scan' ? (
              <div className="space-y-3">
                <div className="relative w-56 h-56 mx-auto bg-black rounded-3xl overflow-hidden border-2 border-saylo-emerald/50 flex items-center justify-center shadow-inner">
                  {scannerStream ? (
                    <video
                      ref={scannerVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs flex flex-col items-center gap-2 px-4">
                      <ScanLine size={32} className="text-saylo-emerald animate-pulse" />
                      <span>Point your camera at the QR code on your other device</span>
                    </div>
                  )}

                  {/* WhatsApp Corner Markers */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-saylo-emerald pointer-events-none rounded-tl-sm" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-saylo-emerald pointer-events-none rounded-tr-sm" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-saylo-emerald pointer-events-none rounded-bl-sm" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-saylo-emerald pointer-events-none rounded-br-sm" />

                  {/* Laser line */}
                  <div
                    className="absolute inset-x-2 h-0.5 bg-saylo-emerald shadow-[0_0_10px_#00a884] animate-bounce pointer-events-none"
                    style={{ animationDuration: '2.5s' }}
                  />
                </div>

                <button
                  type="button"
                  disabled={linkSuccess}
                  onClick={handleSimulateLinkDevice}
                  className="w-full py-2.5 bg-saylo-emerald hover:bg-saylo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  {linkSuccess ? <Check size={14} /> : <ShieldCheck size={14} />}
                  <span>{linkSuccess ? 'Device Paired!' : 'Pair Detected Device'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-56 h-56 mx-auto bg-white p-4 rounded-3xl flex items-center justify-center border-4 border-saylo-emerald/30 shadow-md">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="#111827" />
                    <rect x="10" y="10" width="18" height="18" rx="2" fill="white" />
                    <rect x="14" y="14" width="10" height="10" rx="2" fill="#00a884" />
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="#111827" />
                    <rect x="72" y="10" width="18" height="18" rx="2" fill="white" />
                    <rect x="76" y="14" width="10" height="10" rx="2" fill="#00a884" />
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="#111827" />
                    <rect x="10" y="72" width="18" height="18" rx="2" fill="white" />
                    <rect x="14" y="76" width="10" height="10" rx="2" fill="#00a884" />
                    <rect x="40" y="10" width="8" height="8" fill="#111827" />
                    <rect x="52" y="10" width="8" height="8" fill="#111827" />
                    <rect x="40" y="40" width="20" height="20" rx="4" fill="#00a884" />
                    <rect x="68" y="44" width="12" height="8" fill="#111827" />
                    <rect x="40" y="68" width="12" height="8" fill="#111827" />
                    <rect x="68" y="68" width="12" height="12" fill="#111827" />
                  </svg>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Scan this QR code from SAYLO on your phone to link this device.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedDevicesPage;

