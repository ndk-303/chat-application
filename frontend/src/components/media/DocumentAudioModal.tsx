'use client';

import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export interface DocumentAudioItem {
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  type?: 'audio' | 'document';
}

interface DocumentAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DocumentAudioItem | null;
}

export const DocumentAudioModal: React.FC<DocumentAudioModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isAudio =
    item.type === 'audio' ||
    item.mimeType?.startsWith('audio/') ||
    item.url.match(/\.(mp3|wav|ogg|m4a)$/i);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">
                {isAudio ? 'audiotrack' : 'description'}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">{item.name}</h3>
              {item.size && (
                <p className="text-[10px] text-text-secondary font-mono">
                  {(item.size / 1024 / 1024).toFixed(2)} MB • {item.mimeType || 'Tệp đính kèm'}
                </p>
              )}
            </div>
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            download={item.name}
            className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-bright transition-colors"
            title="Tải tệp về"
          >
            <span className="material-symbols-outlined text-base">download</span>
          </a>
        </div>

        {/* Content Body */}
        {isAudio ? (
          <div className="p-6 rounded-xl bg-surface-container border border-border space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">
                {isPlaying ? 'graphic_eq' : 'play_arrow'}
              </span>
            </div>

            <audio
              ref={audioRef}
              src={item.url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            {/* Waveform / Progress bar */}
            <div className="space-y-1.5">
              <div
                className="w-full h-2 bg-background rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  if (!audioRef.current || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = pos * duration;
                }}
              >
                <div
                  className="h-full bg-primary transition-all duration-75"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Play/Pause Button */}
            <Button variant="primary" size="md" onClick={togglePlay} className="mx-auto">
              <span className="material-symbols-outlined text-lg mr-1.5">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
              {isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
            </Button>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-surface-container border border-border text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary">
              <span className="material-symbols-outlined text-3xl">draft</span>
            </div>
            <div>
              <p className="text-xs font-medium text-text-primary">Xem trước tài liệu</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Để xem tài liệu với đầy đủ định dạng, vui lòng tải về hoặc mở trong tab mới.
              </p>
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Mở trong tab mới
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};
export default DocumentAudioModal;
