import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomOut, ZoomIn, Loader2, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: { url: string; name: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const current = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  // Reset zoom/pan when image changes
  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, [index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) setIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && hasNext) setIndex((i) => i + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasPrev, hasNext, onClose]);

  // Wheel zoom (centered on cursor)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(5, Math.max(0.5, s - e.deltaY * 0.001)));
  }, []);

  // Drag to pan
  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };
  const onPointerUp = () => { dragStart.current = null; setDragging(false); };

  // Download via fetch so it doesn't open a new tab
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(current.url, { mode: 'cors' });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = current.name || 'image';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback — open in new tab if CORS blocks
      window.open(current.url, '_blank', 'noopener');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white font-medium text-sm truncate max-w-[260px]">{current.name}</span>
          {images.length > 1 && (
            <span className="text-white/50 text-xs">{index + 1} / {images.length}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom out */}
          <button
            title="Zoom out"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <ZoomOut size={18} />
          </button>

          {/* Zoom label */}
          <button
            title="Reset zoom"
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
            className="min-w-[44px] h-9 rounded-lg px-2 text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium transition-all"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom in */}
          <button
            title="Zoom in"
            onClick={() => setScale((s) => Math.min(5, s + 0.25))}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <ZoomIn size={18} />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Download */}
          <button
            title="Download"
            onClick={handleDownload}
            disabled={downloading}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
          </button>

          {/* Close */}
          <button
            title="Close (Esc)"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all ml-1"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onWheel={handleWheel}
      >
        {/* Prev */}
        {hasPrev && (
          <button
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all hover:scale-105"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        )}

        <img
          key={index}
          src={current.url}
          alt={current.name}
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? 'none' : 'transform 0.15s ease',
            cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
            maxWidth: '90vw',
            maxHeight: 'calc(100vh - 120px)',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />

        {/* Next */}
        {hasNext && (
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all hover:scale-105"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Thumbnail strip (only if multiple images) */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 bg-black/60 shrink-0 overflow-x-auto px-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                i === index ? 'border-[#0068FF]' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
