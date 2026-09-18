'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9!@#$%^&*]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();

  const strengthLabel = strength >= 4 ? 'Strong' : strength >= 2 ? 'Medium' : 'Weak';
  const strengthColor = strength >= 4 ? 'text-success' : strength >= 2 ? 'text-warning' : 'text-error';
  const strengthBarColor = strength >= 4 ? 'bg-success' : strength >= 2 ? 'bg-warning' : 'bg-error';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const res = await register(displayName, email, password);
      router.push(`/verify-otp?email=${encodeURIComponent(res.email || email)}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={[
        'w-full max-w-[440px]',
        'bg-surface border border-border rounded-xl p-8',
        'shadow-elev-3 shadow-inner-highlight',
      ].join(' ')}
    >
      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-display font-bold text-text-primary">
          Create your account
        </h1>
        <p className="text-caption text-text-secondary mt-2">
          Join the private, end-to-end encrypted WebRTC network
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-5 p-3 rounded-sm bg-error/10 border border-error/20 text-caption text-error flex items-center gap-2"
          role="alert"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="shrink-0">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5M8 11v.5" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Full name */}
        <div>
          {/* FIX: was `text-[11px] font-mono tracking-wider uppercase` — banned pattern */}
          <label
            className="block text-caption font-medium text-text-secondary mb-1.5"
            htmlFor="displayName"
          >
            Full name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Alex Rivera"
            className={[
              'w-full bg-background border border-border rounded-sm',
              'px-3.5 py-2.5 text-body text-text-primary',
              'placeholder:text-text-tertiary',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            ].join(' ')}
          />
        </div>

        {/* Email */}
        <div>
          <label
            className="block text-caption font-medium text-text-secondary mb-1.5"
            htmlFor="email"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex.rivera@example.com"
            className={[
              'w-full bg-background border border-border rounded-sm',
              'px-3.5 py-2.5 text-body text-text-primary',
              'placeholder:text-text-tertiary',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            ].join(' ')}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              className="text-caption font-medium text-text-secondary"
              htmlFor="password"
            >
              Password
            </label>
            <span className="text-micro text-text-secondary">Min. 6 characters</span>
          </div>
          <div className="relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className={[
                'w-full bg-background border border-border rounded-sm',
                'px-3.5 py-2.5 pr-10 text-body text-text-primary',
                'placeholder:text-text-tertiary',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              ].join(' ')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none active:scale-90"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 2l16 16M6.5 6.5A7.5 7.5 0 0 0 2.64 10c1.38 2.94 4.25 5 7.36 5a7.44 7.44 0 0 0 3.5-.87M8.83 4.12A7.44 7.44 0 0 1 10 4c3.11 0 5.98 2.06 7.36 5a9.12 9.12 0 0 1-1.85 2.72" />
                  <path d="M10 7a3 3 0 0 1 2.83 4" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.64 10C4.02 7.06 6.89 5 10 5s5.98 2.06 7.36 5c-1.38 2.94-4.25 5-7.36 5S4.02 12.94 2.64 10z" />
                  <circle cx="10" cy="10" r="2" />
                </svg>
              )}
            </button>
          </div>

          {/* Password strength bars */}
          {password && (
            <div className="mt-2">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={[
                      'h-1 rounded-full transition-colors duration-300',
                      strength >= i ? strengthBarColor : 'bg-surface-3',
                    ].join(' ')}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className={`text-micro font-medium ${strengthColor}`}>
                  {strengthLabel} password
                </span>
                {/* E2EE Ready — useful security signal, keep but remove font-mono */}
                <span className="text-micro text-text-secondary">E2EE ready</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            className="block text-caption font-medium text-text-secondary mb-1.5"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            className={[
              'w-full bg-background border border-border rounded-sm',
              'px-3.5 py-2.5 text-body text-text-primary',
              'placeholder:text-text-tertiary',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            ].join(' ')}
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5">
          <input
            id="agreed-to-terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded-xs bg-background border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer flex-shrink-0"
          />
          <label htmlFor="agreed-to-terms" className="text-caption text-text-secondary leading-relaxed cursor-pointer">
            I agree to the{' '}
            <a
              href="#"
              className="text-text-primary underline underline-offset-2 hover:text-primary transition-colors"
            >
              Terms of Service
            </a>
            {' '}and{' '}
            <a
              href="#"
              className="text-text-primary underline underline-offset-2 hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Primary CTA */}
        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
        >
          Create Account
        </Button>
      </form>

      {/* Bottom prompt */}
      <p className="text-caption text-text-secondary text-center mt-7 pt-5 border-t border-border/50">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary hover:underline underline-offset-2 font-medium ml-1 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
