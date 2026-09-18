import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  /** mono: true only for OTP/version strings — not for UI labels */
  mono?: boolean;
  className?: string;
}

/**
 * Badge — Phase 2 redesign
 *
 * Changes vs. v1:
 * - Radius: rounded-xs (4px) — badges are small, tight corners feel more premium
 *   than pill (reserved for count badges and status pills)
 * - Font: text-micro (11px) up from text-xs (12px) for better visual weight
 * - Colors: updated to new semantic token values
 * - `mono` flag: semantically gated — only use for version strings, hashes
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  mono = false,
  className = '',
}) => {
  const variantMap: Record<NonNullable<BadgeProps['variant']>, string> = {
    default:  'bg-surface-2 text-text-secondary border-border',
    primary:  'bg-primary/10 text-primary border-primary/20',
    success:  'bg-success/10 text-success border-success/20',
    warning:  'bg-warning/10 text-warning border-warning/20',
    error:    'bg-error/10 text-error border-error/20',
    outline:  'bg-transparent text-text-secondary border-border',
  };

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-xs',
        'text-micro font-medium border',
        mono ? 'font-mono' : 'font-sans',
        variantMap[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
};

export default Badge;
