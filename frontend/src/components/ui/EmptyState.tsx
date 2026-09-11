import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-surface-container-high border border-border flex items-center justify-center text-text-secondary mb-4">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-5">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/15 border border-primary/20 px-3.5 py-2 rounded-sm transition-all active:scale-[0.99]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
