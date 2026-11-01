import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCw,
  FlipHorizontal2,
  Brush,
  Type,
  Send,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Undo2,
  Trash2,
  Sun,
  Eye,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const FILTERS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'vivid', name: 'Vivid', css: 'contrast(125%) saturate(140%) brightness(105%)' },
  { id: 'warm', name: 'Warm', css: 'sepia(30%) saturate(120%) hue-rotate(-10deg) brightness(105%)' },
  { id: 'cool', name: 'Cool', css: 'saturate(115%) hue-rotate(15deg) brightness(105%)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(100%) contrast(120%)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(65%) contrast(90%) brightness(105%)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(150%) saturate(125%) brightness(95%)' },
];

const COLORS = ['#00A884', '#FFFFFF', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];

const WhatsAppCameraModal = ({ isOpen, onClose, onSendPhoto }) => {
  const { activeConversation } = useChat();

  // Mode: 'viewfinder' | 'editor'
  const [mode, setMode] = useState('viewfinder');
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [cameraError, setCameraError] = useState(null);

  // Editor states
  const [capturedImageSrc, setCapturedImageSrc] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isFlipped, setIsFlipped] = useState(false);
  const [editTool, setEditTool] = useState('none'); // 'none' | 'doodle' | 'text'
  const [brushColor, setBrushColor] = useState('#00A884');
  const [brushSize, setBrushSize] = useState(4);
  const [overlayText, setOverlayText] = useState('');
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 20, y: 80 });

  // WhatsApp Send Controls
  const [caption, setCaption] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isHdQuality, setIsHdQuality] = useState(true);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]); // array of strokes for undo
  const currentStrokeRef = useRef([]);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const doodleCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not available or permission was denied. You can select an image below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode('viewfinder');
      setCapturedImageSrc(null);
      setSelectedFilter('normal');
      setRotation(0);
      setIsFlipped(false);
      setStrokes([]);
      setOverlayText('');
      setCaption('');
      setIsViewOnce(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Flip Camera Front / Back
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Photo
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror naturally
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImageSrc(dataUrl);
    setMode('editor');
    stopCamera();
  };

  // Choose file from device
  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImageSrc(event.target.result);
      setMode('editor');
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Retake / Discard
  const handleRetake = () => {
    setMode('viewfinder');
    setCapturedImageSrc(null);
    setSelectedFilter('normal');
    setRotation(0);
    setIsFlipped(false);
    setStrokes([]);
    setOverlayText('');
    setEditTool('none');
    startCamera();
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Flip Horizontal
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Doodle Drawing Handlers
  const startDoodle = (e) => {
    if (editTool !== 'doodle') return;
    setIsDrawing(true);
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * scaleX;
    const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) * scaleY;
    currentStrokeRef.current = [{ x, y, color: brushColor, size: brushSize }];
  };

  const drawDoodle = (e) => {
    if (!isDrawing || editTool !== 'doodle') return;
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * scaleX;
    const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) * scaleY;

    currentStrokeRef.current.push({ x, y, color: brushColor, size: brushSize });

    // Render immediately
    const ctx = canvas.getContext('2d');
    const pts = currentStrokeRef.current;
    if (pts.length > 1) {
      const prev = pts[pts.length - 2];
      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDoodle = () => {
    if (isDrawing && currentStrokeRef.current.length > 0) {
      setStrokes((prev) => [...prev, currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }
    setIsDrawing(false);
  };

  // Undo last stroke
  const handleUndoDoodle = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    redrawStrokes(updated);
  };

  const redrawStrokes = (strokeList) => {
    const canvas = doodleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeList.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke[0].color;
      ctx.lineWidth = stroke[0].size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  };

  // Sync doodle canvas sizing with image
  useEffect(() => {
    if (mode === 'editor' && capturedImageSrc) {
      const img = new Image();
      img.src = capturedImageSrc;
      img.onload = () => {
        if (doodleCanvasRef.current) {
          doodleCanvasRef.current.width = img.width;
          doodleCanvasRef.current.height = img.height;
          redrawStrokes(strokes);
        }
      };
    }
  }, [mode, capturedImageSrc]);

  // Final Composite & Send
  const handleSendFinalPhoto = () => {
    if (!capturedImageSrc) return;

    const img = new Image();
    img.src = capturedImageSrc;
    img.onload = () => {
      const isRotatedPerpendicular = rotation === 90 || rotation === 270;
      const finalW = isRotatedPerpendicular ? img.height : img.width;
      const finalH = isRotatedPerpendicular ? img.width : img.height;

      const canvas = document.createElement('canvas');
      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext('2d');

      // 1. Apply Filter
      const activeFilterObj = FILTERS.find((f) => f.id === selectedFilter);
      if (activeFilterObj && activeFilterObj.css !== 'none') {
        ctx.filter = activeFilterObj.css;
      }

      // 2. Apply Transform (Rotate & Flip)
      ctx.save();
      ctx.translate(finalW / 2, finalH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (isFlipped) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Reset filter for overlays
      ctx.filter = 'none';

      // 3. Draw Doodle Strokes
      if (strokes.length > 0) {
        ctx.save();
        ctx.translate(finalW / 2, finalH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        if (isFlipped) ctx.scale(-1, 1);
        ctx.translate(-img.width / 2, -img.height / 2);

        strokes.forEach((stroke) => {
          if (stroke.length < 2) return;
          ctx.beginPath();
          ctx.strokeStyle = stroke[0].color;
          ctx.lineWidth = stroke[0].size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(stroke[0].x, stroke[0].y);
          for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
          }
          ctx.stroke();
        });
        ctx.restore();
      }

      // 4. Draw Overlay Text if any
      if (overlayText.trim()) {
        ctx.save();
        const fontSize = Math.max(28, Math.round(finalW * 0.04));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = brushColor || '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        const textY = (finalH * textPosition.y) / 100;
        const textX = (finalW * textPosition.x) / 100;
        ctx.fillText(overlayText, textX, textY);
        ctx.restore();
      }

      // Convert to Blob and File
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const photoFile = new File([blob], `saylo_camera_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });

          onSendPhoto({
            file: photoFile,
            caption: caption.trim(),
            viewOnce: isViewOnce,
            isHd: isHdQuality,
          });

          onClose();
        },
        'image/jpeg',
        isHdQuality ? 0.96 : 0.82
      );
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl h-full sm:h-[92vh] max-h-[900px] bg-[#111b21] sm:rounded-3xl overflow-hidden flex flex-col border border-gray-800 shadow-2xl">
        {/* ======================================================= */}
        {/* MODE 1: LIVE CAMERA VIEWFINDER                          */}
        {/* ======================================================= */}
        {mode === 'viewfinder' && (
          <div className="relative flex-1 flex flex-col bg-black">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                title="Close Camera"
              >
                <X size={22} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-white/80 font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                  SAYLO Camera
                </span>
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                  title="Switch Front / Rear Camera"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            {/* Live Video Preview or Permission Error */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black relative">
              {cameraError ? (
                <div className="text-center p-6 max-w-sm text-gray-300">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4 text-saylo-emerald">
                    <Camera size={32} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Camera Unavailable</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-saylo-emerald hover:bg-saylo-600 text-white text-xs font-semibold shadow-lg inline-flex items-center gap-2"
                  >
                    <ImageIcon size={16} />
                    <span>Choose Photo from Device</span>
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              )}
            </div>

            {/* Bottom Viewfinder Controls */}
            <div className="p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-around z-20">
              {/* Pick from gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                title="Select photo from gallery"
              >
                <ImageIcon size={22} />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={!!cameraError}
                className="w-18 h-18 rounded-full border-4 border-white p-1 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                title="Take Photo"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-saylo-emerald transition-colors" />
              </button>

              {/* Switch Facing */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                title="Flip Camera"
              >
                <RefreshCw size={22} />
              </button>
            </div>

            {/* Hidden Input for gallery upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleSelectFile}
            />
          </div>
        )}

        {/* ======================================================= */}
        {/* MODE 2: WHATSAPP PHOTO EDITOR & FILTER STUDIO           */}
        {/* ======================================================= */}
        {mode === 'editor' && capturedImageSrc && (
          <div className="relative flex-1 flex flex-col bg-black">
            {/* Top Toolbar (Edit Tools) */}
            <div className="z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
              <button
                type="button"
                onClick={handleRetake}
                className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                title="Retake / Discard"
              >
                <Trash2 size={20} />
              </button>

              {/* Editing Action Icons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Rotate 90 deg */}
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-2.5 rounded-full bg-black/40 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw size={19} />
                </button>

                {/* Flip Horizontal */}
                <button
                  type="button"
                  onClick={handleFlip}
                  className="p-2.5 rounded-full bg-black/40 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
                  title="Flip Mirror"
                >
                  <FlipHorizontal2 size={19} />
                </button>

                {/* Doodle Tool */}
                <button
                  type="button"
                  onClick={() => setEditTool((prev) => (prev === 'doodle' ? 'none' : 'doodle'))}
                  className={`p-2.5 rounded-full backdrop-blur-sm transition-colors ${
                    editTool === 'doodle' ? 'bg-saylo-emerald text-white shadow-lg' : 'bg-black/40 text-white hover:bg-white/20'
                  }`}
                  title="Doodle / Draw on Photo"
                >
                  <Brush size={19} />
                </button>

                {/* Text Overlay Tool */}
                <button
                  type="button"
                  onClick={() => {
                    setTextInputVisible(!textInputVisible);
                    setEditTool('text');
                  }}
                  className={`p-2.5 rounded-full backdrop-blur-sm transition-colors ${
                    textInputVisible ? 'bg-saylo-emerald text-white shadow-lg' : 'bg-black/40 text-white hover:bg-white/20'
                  }`}
                  title="Add Text Overlay"
                >
                  <Type size={19} />
                </button>

                {/* Undo strokes */}
                {strokes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoDoodle}
                    className="p-2.5 rounded-full bg-black/40 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
                    title="Undo stroke"
                  >
                    <Undo2 size={19} />
                  </button>
                )}
              </div>
            </div>

            {/* Doodle Color Palette (Visible when doodle or text tool is active) */}
            {(editTool === 'doodle' || textInputVisible) && (
              <div className="z-20 px-4 py-2 bg-black/60 backdrop-blur-md flex items-center justify-between border-y border-white/10">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBrushColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        brushColor === c ? 'border-white scale-110 shadow-md ring-2 ring-saylo-emerald' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>

                {editTool === 'doodle' && (
                  <div className="flex items-center gap-2 text-xs text-white">
                    <span className="text-[10px] text-gray-400">Size:</span>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-16 accent-saylo-emerald"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Text Input Row when text tool is open */}
            {textInputVisible && (
              <div className="z-20 p-3 bg-black/80 backdrop-blur-md flex items-center gap-2 border-b border-white/10">
                <input
                  type="text"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Type overlay text on photo..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-saylo-emerald"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setTextInputVisible(false)}
                  className="px-3 py-1.5 bg-saylo-emerald text-white rounded-xl text-xs font-semibold"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Main Interactive Preview Container */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black p-2">
              <div
                className="relative max-w-full max-h-full transition-transform duration-200"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
                }}
              >
                {/* Captured Photo */}
                <img
                  src={capturedImageSrc}
                  alt="Camera snap"
                  style={{
                    filter: FILTERS.find((f) => f.id === selectedFilter)?.css || 'none',
                  }}
                  className="max-h-[52vh] sm:max-h-[58vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-150"
                />

                {/* Doodle Canvas overlay */}
                <canvas
                  ref={doodleCanvasRef}
                  onMouseDown={startDoodle}
                  onMouseMove={drawDoodle}
                  onMouseUp={stopDoodle}
                  onMouseLeave={stopDoodle}
                  onTouchStart={startDoodle}
                  onTouchMove={drawDoodle}
                  onTouchEnd={stopDoodle}
                  className={`absolute inset-0 w-full h-full rounded-xl ${
                    editTool === 'doodle' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
                  }`}
                />

                {/* Text Overlay Display */}
                {overlayText.trim() && (
                  <div
                    style={{
                      top: `${textPosition.y}%`,
                      left: `${textPosition.x}%`,
                      color: brushColor,
                    }}
                    className="absolute pointer-events-none font-bold text-lg sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-[85%] break-words"
                  >
                    {overlayText}
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp Filter Selector Pills */}
            <div className="z-20 px-3 py-2 bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedFilter === f.id
                        ? 'bg-saylo-emerald text-white shadow-md scale-105'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom WhatsApp Send Bar */}
            <div className="z-20 p-3 sm:p-4 bg-[#111b21] border-t border-gray-800 flex items-center gap-2 sm:gap-3">
              {/* Caption Input */}
              <div className="flex-1 bg-[#202c33] rounded-2xl px-3 py-2 border border-gray-700/60 flex items-center gap-2">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendFinalPhoto();
                    }
                  }}
                  placeholder="Add a caption..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none"
                />

                {/* HD Quality Toggle */}
                <button
                  type="button"
                  onClick={() => setIsHdQuality(!isHdQuality)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    isHdQuality
                      ? 'border-saylo-emerald text-saylo-emerald bg-saylo-emerald/15'
                      : 'border-gray-500 text-gray-400'
                  }`}
                  title={isHdQuality ? 'HD Quality enabled' : 'Standard Quality'}
                >
                  HD
                </button>

                {/* View Once Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsViewOnce(!isViewOnce)}
                  className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-colors ${
                    isViewOnce
                      ? 'border-saylo-emerald text-saylo-emerald bg-saylo-emerald/20 shadow-md'
                      : 'border-gray-500 text-gray-400 hover:text-white'
                  }`}
                  title={isViewOnce ? 'View once enabled' : 'Toggle view once'}
                >
                  1
                </button>
              </div>

              {/* Green Circular WhatsApp Send Button */}
              <button
                type="button"
                onClick={handleSendFinalPhoto}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-saylo-emerald hover:bg-saylo-600 active:scale-95 text-white flex items-center justify-center shadow-xl transition-all flex-shrink-0"
                title="Send Photo"
              >
                <Send size={20} className="ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppCameraModal;

