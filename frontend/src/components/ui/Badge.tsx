import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  mono?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  mono = false,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-surface-hover text-text-secondary border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    outline: 'bg-transparent text-text-secondary border-border',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        mono ? 'font-mono' : ''
      } ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
