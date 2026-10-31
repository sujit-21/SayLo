import React, { useRef, useState, useEffect } from 'react';
import {
  RotateCcw,
  Check,
  X,
  Type,
  Crop,
  Brush,
  Download,
  Smile,
  Palette,
} from 'lucide-react';
import Modal from '../common/Modal';

const ImageDoodleEditor = ({ isOpen, imageFile, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#00A884');
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState('draw'); // 'draw' | 'text'
  const [textInput, setTextInput] = useState('');
  const [rotation, setRotation] = useState(0);

  const colors = ['#00A884', '#ffffff', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#000000'];

  useEffect(() => {
    if (!isOpen || !imageFile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const img = new window.Image();
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => {
      // Scale canvas to fit image keeping aspect ratio
      const maxW = 500;
      const scale = Math.min(maxW / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [isOpen, imageFile]);

  if (!isOpen || !imageFile) return null;

  const startDraw = (e) => {
    if (mode !== 'draw') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = brushColor;
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 6;
    ctx.fillText(textInput, 24, canvas.height / 2);
    setTextInput('');
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const editedFile = new File([blob], `edited_${Date.now()}.png`, { type: 'image/png' });
      onSave(editedFile);
      onClose();
    }, 'image/png');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Photo & Doodle">
      <div className="space-y-4 select-none">
        {/* Editor Canvas Toolbar */}
        <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 dark:bg-[#111b21] rounded-2xl border border-gray-200 dark:border-gray-700/60">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`p-2 rounded-xl transition-colors ${
                mode === 'draw' ? 'bg-saylo-emerald text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Draw / Doodle"
            >
              <Brush size={18} />
            </button>

            <button
              type="button"
              onClick={() => setMode('text')}
              className={`p-2 rounded-xl transition-colors ${
                mode === 'text' ? 'bg-saylo-emerald text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Add text"
            >
              <Type size={18} />
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrushColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  brushColor === c ? 'border-white scale-110 shadow-md' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Text Input Row when mode === text */}
        {mode === 'text' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type caption overlay..."
              className="flex-1 bg-white dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-saylo-emerald"
            />
            <button
              type="button"
              onClick={handleAddText}
              className="px-3 py-1.5 bg-saylo-emerald text-white rounded-xl text-xs font-semibold"
            >
              Apply
            </button>
          </div>
        )}

        {/* Canvas Display */}
        <div className="flex justify-center bg-black/60 rounded-2xl p-2 overflow-hidden border border-gray-800 max-h-[55vh]">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            className="cursor-crosshair rounded-xl max-w-full max-h-[50vh] object-contain shadow-lg"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-saylo-emerald hover:bg-saylo-600 text-white rounded-xl text-xs font-semibold shadow-md"
          >
            <Check size={15} />
            <span>Done & Send</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageDoodleEditor;

