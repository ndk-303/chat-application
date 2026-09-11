'use client';

import React, { useEffect, useState } from 'react';

export interface MediaItem {
  url: string;
  name: string;
  size?: number;
  type?: 'image' | 'video' | 'raw';
  mimeType?: string;
}

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem | null;
  items?: MediaItem[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  onClose,
  media,
  items = [],
  currentIndex = 0,
  onNavigate,
}) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && items.length > 1 && onNavigate && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
      if (
        e.key === 'ArrowRight' &&
        items.length > 1 &&
        onNavigate &&
        currentIndex < items.length - 1
      ) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, currentIndex, onClose, onNavigate]);

  useEffect(() => {
    setZoom(1);
  }, [media?.url]);

  if (!isOpen || !media) return null;

  const isVideo =
    media.type === 'video' ||
    media.mimeType?.startsWith('video/') ||
    media.url.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-150 select-none">
      {/* Top Controls Header */}
      <header className="h-14 px-6 border-b border-border bg-surface/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-primary text-xl">
            {isVideo ? 'videocam' : 'image'}
          </span>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-text-primary truncate">{media.name}</h3>
            {media.size && (
              <span className="text-[10px] text-text-secondary font-mono">
                {(media.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {!isVideo && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-bright transition-colors"
                title="Thu nhỏ"
              >
                <span className="material-symbols-outlined text-lg">zoom_out</span>
              </button>
              <span className="text-xs font-mono text-text-secondary w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-bright transition-colors"
                title="Phóng to"
              >
                <span className="material-symbols-outlined text-lg">zoom_in</span>
              </button>
              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}

          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            download={media.name}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-bright transition-colors"
            title="Tải về"
          >
            <span className="material-symbols-outlined text-lg">download</span>
          </a>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-bright transition-colors ml-2"
            title="Đóng (Esc)"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </header>

      {/* Center Media Stage */}
      <main className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        {/* Previous Navigation Chevron */}
        {items.length > 1 && currentIndex > 0 && onNavigate && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-6 z-20 w-11 h-11 rounded-full bg-surface/85 hover:bg-surface-bright border border-border text-text-secondary hover:text-text-primary flex items-center justify-center shadow-xl transition-all"
            title="Ảnh trước (Mũi tên trái)"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
        )}

        {/* Next Navigation Chevron */}
        {items.length > 1 && currentIndex < items.length - 1 && onNavigate && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-6 z-20 w-11 h-11 rounded-full bg-surface/85 hover:bg-surface-bright border border-border text-text-secondary hover:text-text-primary flex items-center justify-center shadow-xl transition-all"
            title="Ảnh tiếp theo (Mũi tên phải)"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        )}

        {/* Media Container */}
        <div className="max-w-5xl max-h-[80vh] flex items-center justify-center overflow-hidden transition-transform duration-100">
          {isVideo ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-w-full max-h-[75vh] rounded-xl shadow-2xl border border-border"
            />
          ) : (
            <img
              src={media.url}
              alt={media.name}
              style={{ transform: `scale(${zoom})` }}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform"
            />
          )}
        </div>
      </main>

      {/* Footer Info Strip */}
      <footer className="h-10 px-6 border-t border-border bg-surface/50 flex items-center justify-between text-[11px] font-mono text-text-secondary shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Mã hóa phương tiện trực tiếp (Lossless WebRTC)</span>
        </div>
        {items.length > 1 && (
          <div>
            {currentIndex + 1} / {items.length}
          </div>
        )}
      </footer>
    </div>
  );
};
export default MediaLightboxModal;
