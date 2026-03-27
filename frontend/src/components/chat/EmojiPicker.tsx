import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import EmojiPickerLib, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const PICKER_WIDTH = 350;
const PICKER_HEIGHT = 450;

export function EmojiPicker({ onSelect, onClose, triggerRef }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Tính toán vị trí hiển thị dựa trên trigger button
  useLayoutEffect(() => {
    if (!triggerRef?.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.top - PICKER_HEIGHT - 8;
    let left = rect.left;

    if (top < 8) top = rect.bottom + 8;
    if (left + PICKER_WIDTH > vw - 8) left = vw - PICKER_WIDTH - 8;
    if (left < 8) left = 8;
    if (top + PICKER_HEIGHT > vh - 8) top = vh - PICKER_HEIGHT - 8;

    setPos({ top, left });
  }, [triggerRef]);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        triggerRef?.current && !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose, triggerRef]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
      }}
    >
      <EmojiPickerLib
        onEmojiClick={handleEmojiClick}
        theme={Theme.LIGHT}
        searchPlaceholder="Tìm emoji..."
        width={PICKER_WIDTH}
        height={PICKER_HEIGHT}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
        lazyLoadEmojis
      />
    </div>
  );
}
