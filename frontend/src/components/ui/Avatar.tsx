import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** When true, uses squircle (rounded-sm) instead of circle — for groups/channels */
  isGroup?: boolean;
  className?: string;
}

/**
 * Avatar — Phase 2 redesign
 *
 * Changes vs. v1:
 * - Initials: Geist Sans (not font-mono — JetBrains Mono is reserved for data only)
 * - isGroup prop: uses rounded-sm (8px squircle) instead of rounded-full
 *   to semantically distinguish person vs. group/channel
 * - Status colors: updated to new semantic tokens
 * - Fallback bg: surface-3 (slightly lighter than surface-2 for legibility)
 * - Status dot uses success/warning/error tokens directly
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  isGroup = false,
  className = '',
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'A';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeMap = {
    xs: { container: 'w-6 h-6', text: 'text-[10px]' },
    sm: { container: 'w-8 h-8', text: 'text-[11px]' },
    md: { container: 'w-10 h-10', text: 'text-xs' },
    lg: { container: 'w-12 h-12', text: 'text-sm' },
    xl: { container: 'w-16 h-16', text: 'text-base' },
  };

  const dotSizeMap = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-[1.5px]',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2',
  };

  const statusColorMap = {
    online:  'bg-success',
    offline: 'bg-text-tertiary',
    away:    'bg-warning',
    busy:    'bg-error',
  };

  const { container, text } = sizeMap[size];
  const dotSize = dotSizeMap[size];
  const shape = isGroup ? 'rounded-sm' : 'rounded-full';

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={`${container} ${shape} object-cover border border-border`}
        />
      ) : (
        <div
          className={`${container} ${shape} bg-surface-3 border border-border flex items-center justify-center font-semibold text-text-secondary`}
        >
          {/* Geist Sans — NOT font-mono. Initials are UI text, not technical data. */}
          <span className={`${text} font-sans`}>{getInitials(name)}</span>
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 ${shape === 'rounded-full' ? 'rounded-full' : 'rounded-xs'} ring-background ${statusColorMap[status]} ${dotSize}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
