import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  HardDrive,
  Image,
  Video,
  Mic,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import api from '../../services/api';

const StorageSettings = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaned, setCleaned] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/storage-stats');
      setStats(res.data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111b21] select-none overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 bg-[#202c33]">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="p-1 rounded-full text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-100">Storage and Data</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-saylo-emerald border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Total Storage Card */}
            <div className="bg-[#202c33] p-6 rounded-3xl border border-gray-700/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-100">Total Media Storage Used</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Photos, videos, audio, and documents</p>
                </div>
                <div className="text-xl font-bold text-saylo-emerald font-mono">
                  {formatBytes(stats?.totalSize)}
                </div>
              </div>

              {/* Multi-colored Visual Storage Bar */}
              <div className="h-3 w-full bg-[#111b21] rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: stats?.totalSize
                      ? `${(stats.photos.size / stats.totalSize) * 100}%`
                      : '0%',
                  }}
                  className="bg-emerald-500 h-full transition-all"
                  title="Photos"
                />
                <div
                  style={{
                    width: stats?.totalSize
                      ? `${(stats.videos.size / stats.totalSize) * 100}%`
                      : '0%',
                  }}
                  className="bg-purple-500 h-full transition-all"
                  title="Videos"
                />
                <div
                  style={{
                    width: stats?.totalSize
                      ? `${(stats.audio.size / stats.totalSize) * 100}%`
                      : '0%',
                  }}
                  className="bg-amber-500 h-full transition-all"
                  title="Audio"
                />
                <div
                  style={{
                    width: stats?.totalSize
                      ? `${(stats.documents.size / stats.totalSize) * 100}%`
                      : '0%',
                  }}
                  className="bg-blue-500 h-full transition-all"
                  title="Documents"
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-gray-300 truncate">Photos: {formatBytes(stats?.photos.size)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0" />
                  <span className="text-gray-300 truncate">Videos: {formatBytes(stats?.videos.size)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-gray-300 truncate">Audio: {formatBytes(stats?.audio.size)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-gray-300 truncate">Docs: {formatBytes(stats?.documents.size)}</span>
                </div>
              </div>
            </div>

            {/* Media Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#202c33] rounded-2xl border border-gray-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Image size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200">Photos</h4>
                    <p className="text-xs text-gray-400">{stats?.photos.count || 0} files</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-300">
                  {formatBytes(stats?.photos.size)}
                </span>
              </div>

              <div className="p-4 bg-[#202c33] rounded-2xl border border-gray-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Video size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200">Videos</h4>
                    <p className="text-xs text-gray-400">{stats?.videos.count || 0} files</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-300">
                  {formatBytes(stats?.videos.size)}
                </span>
              </div>

              <div className="p-4 bg-[#202c33] rounded-2xl border border-gray-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                    <Mic size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200">Voice Notes & Audio</h4>
                    <p className="text-xs text-gray-400">{stats?.audio.count || 0} files</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-300">
                  {formatBytes(stats?.audio.size)}
                </span>
              </div>

              <div className="p-4 bg-[#202c33] rounded-2xl border border-gray-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200">Documents</h4>
                    <p className="text-xs text-gray-400">{stats?.documents.count || 0} files</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-300">
                  {formatBytes(stats?.documents.size)}
                </span>
              </div>
            </div>

            {/* Network Auto-Download Settings Mockup */}
            <div className="bg-[#202c33] p-5 rounded-2xl border border-gray-700/60 space-y-3">
              <h3 className="text-sm font-bold text-gray-100">Media Auto-Download</h3>
              <p className="text-xs text-gray-400">
                Voice messages are always automatically downloaded for the best chat experience.
              </p>
              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center justify-between p-2 rounded-xl bg-[#111b21] cursor-pointer">
                  <span className="text-gray-300">When using mobile data</span>
                  <span className="text-saylo-emerald font-semibold">Photos</span>
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-[#111b21] cursor-pointer">
                  <span className="text-gray-300">When connected on Wi-Fi</span>
                  <span className="text-saylo-emerald font-semibold">All media</span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StorageSettings;

