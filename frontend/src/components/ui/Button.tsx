'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

/**
 * Button — Phase 2 redesign
 *
 * Changes vs. v1:
 * - Primary: tinted box-shadow on hover (accent glow), translateY(-1px) lift
 * - All variants: scale(0.98) on active/press for tactile feel
 * - Loading: replaced generic spinner with 3-dot stagger (matches typing indicator)
 * - Focus ring: 2px outline (WCAG 2.4.11 compliant, was 1px)
 * - Radius: --radius-sm (8px) from token schema
 * - Icon variant: square icon-only button
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const base = [
    'relative inline-flex items-center justify-center font-medium select-none',
    'rounded-sm transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.98]',
  ].join(' ');

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-7',
    md: 'text-ui px-4 py-2.5 gap-2 h-9',
    lg: 'text-ui px-5 py-3 gap-2.5 h-11',
  };

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-primary text-white shadow-elev-1 ' +
      'hover:-translate-y-px hover:shadow-accent-sm hover:bg-primary-hover',
    secondary:
      'bg-surface-2 text-text-primary border border-border ' +
      'hover:bg-surface-3 hover:border-border',
    ghost:
      'bg-transparent text-text-secondary ' +
      'hover:bg-surface-2 hover:text-text-primary',
    danger:
      'bg-error text-white shadow-elev-1 ' +
      'hover:-translate-y-px hover:brightness-90',
    icon:
      'bg-transparent text-text-secondary p-0 ' +
      'hover:bg-surface-2 hover:text-text-primary',
  };

  const sizeClass = variant === 'icon'
    ? size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9'
    : sizes[size];

  return (
    <button
      className={`${base} ${sizeClass} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          {/* 3-dot stagger loader — matches typing indicator visual language */}
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            <span
              className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-[dot-bounce_1s_ease-in-out_infinite]"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-[dot-bounce_1s_ease-in-out_infinite]"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-[dot-bounce_1s_ease-in-out_infinite]"
              style={{ animationDelay: '300ms' }}
            />
          </span>
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
