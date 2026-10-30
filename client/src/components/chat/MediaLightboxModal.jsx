import React, { useEffect } from 'react';
import { X, Download, Share2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const MediaLightboxModal = ({ isOpen, mediaUrl, mediaName, mediaType = 'image', onClose, onForward }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  const isVideo = mediaType === 'video' || mediaUrl.match(/\.(mp4|webm|mov|ogg)$/i);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = mediaName || 'saylo_media';
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-fadeIn select-none">
      {/* Top Header Bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-200 truncate max-w-sm md:max-w-md">
            {mediaName || (isVideo ? 'Video' : 'Photo')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onForward && (
            <button
              onClick={onForward}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Forward media"
            >
              <Share2 size={18} />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Download file"
          >
            <Download size={18} />
          </button>

          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close viewer (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Media Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
          />
        ) : (
          <img
            src={mediaUrl}
            alt={mediaName || 'Media'}
            className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl object-contain transition-transform duration-200"
          />
        )}
      </div>
    </div>
  );
};

export default MediaLightboxModal;

