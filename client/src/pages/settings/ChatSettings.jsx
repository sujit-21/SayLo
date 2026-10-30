import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  HardDrive,
  Download,
  Upload,
  Lock,
  ShieldCheck,
  Check,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  AlertTriangle,
  FolderArchive,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { format } from 'date-fns';

const ChatSettings = () => {
  // Chat preferences
  const [enterIsSend, setEnterIsSend] = useState(() => {
    return localStorage.getItem('saylo_enter_is_send') !== 'false';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('saylo_font_size') || 'medium';
  });

  // Backup state
  const [lastBackup, setLastBackup] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saylo_last_backup_meta')) || null;
    } catch {
      return null;
    }
  });
  const [encryptBackup, setEncryptBackup] = useState(() => {
    return localStorage.getItem('saylo_encrypt_backup') === 'true';
  });
  const [backupPassword, setBackupPassword] = useState('');
  const [backupFrequency, setBackupFrequency] = useState(() => {
    return localStorage.getItem('saylo_backup_frequency') || 'daily';
  });

  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);

  // Restore Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingEncryptedData, setPendingEncryptedData] = useState(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const restoreFileInputRef = useRef(null);

  // Save preferences
  const handleToggleEnterIsSend = () => {
    const nextVal = !enterIsSend;
    setEnterIsSend(nextVal);
    localStorage.setItem('saylo_enter_is_send', nextVal ? 'true' : 'false');
  };

  const handleSelectFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('saylo_font_size', size);
  };

  const handleSelectFrequency = (freq) => {
    setBackupFrequency(freq);
    localStorage.setItem('saylo_backup_frequency', freq);
  };

  // Helper: Derive AES key from password using PBKDF2
  const deriveKey = async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  // Create & Download Chat Backup
  const handleCreateBackup = async () => {
    try {
      setBackingUp(true);
      setRestoreStatus(null);

      const res = await api.get('/auth/backup');
      const backupData = res.data.backup;

      let fileContent = '';
      let isEncrypted = false;

      if (encryptBackup) {
        if (!backupPassword.trim()) {
          alert('Please specify an encryption password to protect this backup.');
          setBackingUp(false);
          return;
        }

        // Encrypt with AES-GCM
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(backupPassword.trim(), salt);

        const enc = new TextEncoder();
        const plaintext = enc.encode(JSON.stringify(backupData));
        const ciphertext = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          plaintext
        );

        const packageData = {
          app: 'SAYLO',
          type: 'ENCRYPTED_BACKUP',
          version: '1.0.0',
          salt: Array.from(salt),
          iv: Array.from(iv),
          data: Array.from(new Uint8Array(ciphertext)),
          createdAt: new Date().toISOString(),
          stats: backupData.stats,
        };

        fileContent = JSON.stringify(packageData);
        isEncrypted = true;
      } else {
        fileContent = JSON.stringify(backupData, null, 2);
      }

      // Download file
      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
      a.href = url;
      a.download = `saylo_backup_${dateStr}.${isEncrypted ? 'saylobkp' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const meta = {
        date: new Date().toISOString(),
        conversationCount: backupData.conversations.length,
        messageCount: backupData.messages.length,
        isEncrypted,
        sizeKb: Math.round(blob.size / 1024),
      };
      setLastBackup(meta);
      localStorage.setItem('saylo_last_backup_meta', JSON.stringify(meta));
      setRestoreStatus({
        type: 'success',
        text: `Backup exported successfully (${meta.messageCount} messages, ${meta.sizeKb} KB)`,
      });
    } catch (err) {
      console.error(err);
      setRestoreStatus({
        type: 'error',
        text: 'Failed to create backup archive',
      });
    } finally {
      setBackingUp(false);
    }
  };

  // Handle Restore File Selection
  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target.result;
        const parsed = JSON.parse(raw);

        if (parsed.type === 'ENCRYPTED_BACKUP') {
          // Encrypted archive: prompt password
          setPendingEncryptedData(parsed);
          setEnteredPassword('');
          setPasswordError('');
          setShowPasswordModal(true);
        } else if (parsed.app === 'SAYLO' && Array.isArray(parsed.messages)) {
          // Plain archive: execute restore directly
          await executeRestore(parsed);
        } else {
          alert('Unrecognized or invalid SAYLO backup file.');
        }
      } catch (err) {
        alert('Invalid file format. Please select a valid SAYLO backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Decrypt and Restore Encrypted Backup
  const handleDecryptAndRestore = async (e) => {
    e.preventDefault();
    if (!pendingEncryptedData || !enteredPassword.trim()) return;

    try {
      setPasswordError('');
      const salt = new Uint8Array(pendingEncryptedData.salt);
      const iv = new Uint8Array(pendingEncryptedData.iv);
      const ciphertext = new Uint8Array(pendingEncryptedData.data);

      const key = await deriveKey(enteredPassword.trim(), salt);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      const backupJson = JSON.parse(dec.decode(decryptedBuffer));

      setShowPasswordModal(false);
      setPendingEncryptedData(null);
      await executeRestore(backupJson);
    } catch (err) {
      setPasswordError('Incorrect password or corrupted backup file');
    }
  };

  // Execute restore API call
  const executeRestore = async (backupPayload) => {
    try {
      setRestoring(true);
      setRestoreStatus(null);

      const res = await api.post('/auth/restore', { backup: backupPayload });
      setRestoreStatus({
        type: 'success',
        text: res.data.message || 'Chat history restored successfully!',
      });
    } catch (err) {
      console.error(err);
      setRestoreStatus({
        type: 'error',
        text: 'Failed to restore chat backup',
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-800 bg-[#202c33]">
        <Link to="/settings" className="p-1 rounded-full text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Chats & Backup</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        {/* Status Toast */}
        {restoreStatus && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium animate-fadeIn ${
              restoreStatus.type === 'success'
                ? 'bg-saylo-emerald/15 text-saylo-emerald border border-saylo-emerald/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}
          >
            {restoreStatus.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{restoreStatus.text}</span>
          </div>
        )}

        {/* Section 1: Chat Backup Card */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-saylo-emerald/15 text-saylo-emerald flex items-center justify-center">
                <HardDrive size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-100">Chat Backup</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Export and restore your messages and media securely.
                </p>
              </div>
            </div>
            {lastBackup?.isEncrypted && (
              <span className="flex items-center gap-1 text-[11px] text-saylo-emerald bg-saylo-emerald/10 border border-saylo-emerald/30 px-2.5 py-1 rounded-full font-semibold">
                <Lock size={12} /> E2EE Protected
              </span>
            )}
          </div>

          {/* Last Backup Stats */}
          <div className="p-4 bg-[#111b21] rounded-2xl border border-gray-700/50 space-y-2 text-xs text-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Last local backup:</span>
              <span className="font-medium text-gray-200">
                {lastBackup
                  ? format(new Date(lastBackup.date), 'MMM d, yyyy HH:mm')
                  : 'Never backed up'}
              </span>
            </div>
            {lastBackup && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total conversations:</span>
                  <span className="font-medium text-gray-200">{lastBackup.conversationCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Messages archived:</span>
                  <span className="font-medium text-saylo-emerald font-semibold">
                    {lastBackup.messageCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Archive size:</span>
                  <span className="font-medium text-gray-200">{lastBackup.sizeKb} KB</span>
                </div>
              </>
            )}
          </div>

          {/* End-to-End Encryption Toggle for Backup */}
          <div className="pt-2 border-t border-gray-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-saylo-emerald" />
                  End-to-End Encrypted Backup
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Protect your backup file with AES-256 GCM encryption.
                </p>
              </div>
              <input
                type="checkbox"
                checked={encryptBackup}
                onChange={(e) => {
                  setEncryptBackup(e.target.checked);
                  localStorage.setItem('saylo_encrypt_backup', e.target.checked ? 'true' : 'false');
                }}
                className="w-4 h-4 accent-saylo-emerald cursor-pointer"
              />
            </div>

            {encryptBackup && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[11px] text-gray-300 font-medium">Backup Password / PIN</label>
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Set password for your backup archive..."
                  className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-saylo-emerald"
                />
                <span className="text-[10px] text-amber-300/80 block">
                  Remember this password. You will need it to restore this backup file.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: Back Up Now & Restore */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleCreateBackup}
              disabled={backingUp || restoring}
              className="w-full sm:flex-1 py-2.5 px-4 bg-saylo-emerald hover:bg-saylo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Download size={16} />
              {backingUp ? 'Exporting Archive...' : 'Back Up Now'}
            </button>

            <button
              onClick={() => restoreFileInputRef.current?.click()}
              disabled={backingUp || restoring}
              className="w-full sm:flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-200 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Upload size={16} />
              {restoring ? 'Restoring...' : 'Restore from File'}
            </button>
            <input
              type="file"
              ref={restoreFileInputRef}
              onChange={handleFileSelected}
              accept=".saylobkp,.json"
              className="hidden"
            />
          </div>

          {/* Backup Schedule */}
          <div className="pt-3 border-t border-gray-700/40 flex items-center justify-between text-xs">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Clock size={15} className="text-gray-400" /> Auto-Backup Reminder
            </span>
            <div className="flex gap-1 bg-[#111b21] p-1 rounded-xl border border-gray-700">
              {['daily', 'weekly', 'off'].map((freq) => (
                <button
                  key={freq}
                  onClick={() => handleSelectFrequency(freq)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                    backupFrequency === freq
                      ? 'bg-saylo-emerald text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Chat Preferences */}
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg divide-y divide-gray-700/40 space-y-4">
          <h3 className="text-sm font-bold text-gray-100">Chat Settings</h3>

          {/* Enter is Send */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Enter is Send</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Pressing Enter key sends your message directly
              </p>
            </div>
            <input
              type="checkbox"
              checked={enterIsSend}
              onChange={handleToggleEnterIsSend}
              className="w-4 h-4 accent-saylo-emerald cursor-pointer"
            />
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-200">Chat Font Size</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Select bubble reading size</p>
            </div>
            <div className="flex gap-1 bg-[#111b21] p-1 rounded-xl border border-gray-700 text-xs">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => handleSelectFontSize(size)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                    fontSize === size
                      ? 'bg-saylo-emerald text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Wallpaper Shortcut */}
          <div className="pt-3">
            <Link
              to="/settings/appearance"
              className="flex items-center justify-between text-xs text-gray-200 hover:text-saylo-emerald transition-colors"
            >
              <span>Chat Wallpaper & Bubble Colors</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Password Modal for Decrypting Backup */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Decrypt Encrypted Backup"
      >
        <form onSubmit={handleDecryptAndRestore} className="space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            This backup file is protected with End-to-End Encryption. Please enter the password you specified when exporting it.
          </p>

          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">Backup Password</label>
            <input
              type="password"
              value={enteredPassword}
              onChange={(e) => {
                setEnteredPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="Enter password..."
              required
              className="w-full bg-[#111b21] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-saylo-emerald"
            />
            {passwordError && (
              <span className="text-xs text-red-400 font-medium mt-1 block">{passwordError}</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl shadow-md"
            >
              Decrypt & Restore
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChatSettings;
