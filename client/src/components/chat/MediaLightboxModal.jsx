import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
} from 'lucide-react';

const MediaLightboxModal = ({
  isOpen,
  mediaUrl,
  mediaName,
  mediaType = 'image',
  onClose,
  onForward,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, mediaUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 3));
      if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(z - 0.25, 0.5));
      if (e.key === 'r' || e.key === 'R') setRotation((r) => (r + 90) % 360);
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

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-fadeIn select-none">
      {/* Top Header Bar */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate max-w-xs md:max-w-md">
            {mediaName || (isVideo ? 'Video' : 'Photo')}
          </p>
          {zoom !== 1 && (
            <span className="text-xs text-saylo-emerald font-mono bg-saylo-emerald/15 px-2 py-0.5 rounded-full">
              {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom & Rotate Controls (For Photos) */}
          {!isVideo && (
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl mr-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                title="Zoom Out (-)"
              >
                <ZoomOut size={17} />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                title="Zoom In (+)"
              >
                <ZoomIn size={17} />
              </button>
              <button
                onClick={handleRotate}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Rotate 90° (R)"
              >
                <RotateCw size={17} />
              </button>
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  onClick={handleReset}
                  className="px-2 py-1 text-[11px] font-semibold text-saylo-emerald hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset view"
                >
                  Reset
                </button>
              )}
            </div>
          )}

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
          <div
            className="transition-transform duration-150 flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={mediaUrl}
              alt={mediaName || 'Media'}
              className="max-h-[80vh] max-w-[85vw] rounded-xl shadow-2xl object-contain pointer-events-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLightboxModal;
