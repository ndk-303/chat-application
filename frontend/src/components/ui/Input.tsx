import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input — Phase 2 redesign
 *
 * Changes vs. v1:
 * - Label: Geist Sans (not mono), 12px/caption size, sentence-case
 * - Border radius: --radius-sm (8px) from token schema
 * - Focus ring: 2px solid primary (WCAG 2.4.11 compliant, was 1px)
 * - Focus border transitions to primary accent
 * - Error state: full red ring + red border
 * - Background: bg-background (base canvas), sits below surface card
 * - Text size bumped from 14px (sm) to 15px (body) for readability
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputBase = [
      'block w-full bg-background text-text-primary text-body',
      'border rounded-sm px-3.5 py-2.5',
      'placeholder:text-text-tertiary',
      'transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
    ].join(' ');

    const inputState = error
      ? 'border-error focus:ring-error focus:border-error'
      : 'border-border focus:ring-primary focus:border-primary';

    const paddingLeft = leftIcon ? 'pl-10' : '';
    const paddingRight = rightIcon ? 'pr-10' : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-caption font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`${inputBase} ${inputState} ${paddingLeft} ${paddingRight} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-caption text-error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-caption text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
