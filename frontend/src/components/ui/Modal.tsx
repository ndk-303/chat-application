'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
  className?: string;
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

/**
 * Modal — Phase 2 redesign
 *
 * Changes vs. v1:
 * - Animation: motion/react spring (replaces the missing tailwindcss-animate)
 *   Enter: opacity 0→1 + y 12→0 with spring physics
 *   Exit: opacity 1→0 + y 0→-6 (retreats upward — natural "closing" feel)
 * - Backdrop: 88% opacity + minimal blur (4px only — not on scrolling content)
 * - Inner highlight: 1px top-edge shimmer (inset shadow)
 * - Close button: X icon built inline (no Material Symbols dependency)
 * - Radius: --radius-lg (16px) per token schema
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  className = '',
}) => {
  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/88 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal card — spring physics */}
          <motion.div
            className={[
              'relative w-full z-10',
              MAX_WIDTH_MAP[maxWidth],
              'bg-surface border border-border rounded-lg overflow-hidden',
              'shadow-elev-3 shadow-inner-highlight',
              className,
            ].join(' ')}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 30,
              mass: 1,
            }}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div>
                  {title && (
                    <h3
                      id="modal-title"
                      className="text-h2 font-semibold text-text-primary"
                    >
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-caption text-text-secondary mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-text-secondary hover:text-text-primary p-1.5 rounded-xs hover:bg-surface-2 transition-colors ml-4 shrink-0 active:scale-95"
                  aria-label="Close dialog"
                >
                  {/* Inline X — no external icon dependency */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  >
                    <path d="M2 2l12 12M14 2L2 14" />
                  </svg>
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
