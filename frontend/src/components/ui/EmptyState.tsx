import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * EmptyState — Phase 2 redesign
 *
 * Changes vs. v1:
 * - icon: now accepts ReactNode instead of Material Symbols string
 *   (callers pass <PhosphorIcon /> components)
 * - Icon wrapper: rounded-lg (16px), surface-3 bg — less "floating in void" feel
 * - Spacing: 48px vertical padding, relaxed max-width
 * - Description: text-body (15px) up from text-xs (12px)
 * - Action button: uses design token classes
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-8 text-center max-w-[280px] mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-text-secondary mb-5">
        {icon}
      </div>

      <h3 className="text-h2 font-semibold text-text-primary mb-2">{title}</h3>

      <p className="text-caption text-text-secondary leading-relaxed mb-6">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className={[
            'inline-flex items-center gap-1.5 text-ui font-medium',
            'text-primary bg-primary/10 hover:bg-primary/15',
            'border border-primary/20 px-4 py-2 rounded-sm',
            'transition-all duration-150 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          ].join(' ')}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
