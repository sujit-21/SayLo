import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AccountSettings = () => {
  const { user } = useAuth();

  const handleExportAccountData = () => {
    const data = {
      profile: user,
      exportedAt: new Date().toISOString(),
      platform: 'SAYLO Messaging Platform',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAYLO_account_export_${user._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-800 bg-[#202c33]">
        <Link to="/settings" className="p-1 rounded-full text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Account</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-100">Export Account Data</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Download a JSON copy of your SAYLO account profile and configurations.
              </p>
            </div>
            <button
              onClick={handleExportAccountData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Download size={15} />
              Export
            </button>
          </div>
        </div>

        <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-red-400">Delete My Account</h3>
            <p className="text-xs text-gray-400 mt-1">
              Deleting your account will delete your message history, remove you from all groups, and erase backups.
            </p>
          </div>
          <button
            onClick={() => alert('Account deletion requested. Please contact support.')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

