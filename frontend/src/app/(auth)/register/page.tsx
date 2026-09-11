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

  // Compute simple password strength
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!agreedToTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }

    setLoading(true);

    try {
      const res = await register(displayName, email, password);
      router.push(`/verify-otp?email=${encodeURIComponent(res.email || email)}`);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-surface border border-border rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
      {/* Card Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create your account</h1>
        <p className="text-sm text-text-secondary mt-1.5">Join the private, zero-knowledge WebRTC network</p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-sm bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Auth Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono tracking-wider text-text-secondary font-medium uppercase" htmlFor="displayName">
            FULL NAME
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Alex Rivera"
            className="w-full bg-background border border-border rounded-sm text-text-primary placeholder:text-gray-500 px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono tracking-wider text-text-secondary font-medium uppercase" htmlFor="email">
            EMAIL ADDRESS
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
            className="w-full bg-background border border-border rounded-sm text-text-primary placeholder:text-gray-500 px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-[11px] font-mono tracking-wider text-text-secondary font-medium uppercase" htmlFor="password">
              PASSWORD
            </label>
            <span className="text-[11px] text-text-secondary">Min. 6 characters</span>
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
              className="w-full bg-background border border-border rounded-sm text-text-primary placeholder:text-gray-500 px-3.5 py-2.5 pr-10 text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-text-secondary hover:text-text-primary transition-colors focus:outline-none flex items-center"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="pt-1">
              <div className="grid grid-cols-4 gap-1.5 w-full">
                <div className={`h-1 rounded-full ${strength >= 1 ? 'bg-primary' : 'bg-surface-container'}`} />
                <div className={`h-1 rounded-full ${strength >= 2 ? 'bg-primary' : 'bg-surface-container'}`} />
                <div className={`h-1 rounded-full ${strength >= 3 ? 'bg-primary' : 'bg-surface-container'}`} />
                <div className={`h-1 rounded-full ${strength >= 4 ? 'bg-primary' : 'bg-surface-container'}`} />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className={`text-xs font-medium ${strength >= 3 ? 'text-success' : 'text-warning'}`}>
                  {strength >= 4 ? 'Strong password' : strength >= 2 ? 'Medium strength' : 'Weak password'}
                </span>
                <span className="font-mono text-[11px] text-text-secondary">E2EE Ready</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono tracking-wider text-text-secondary font-medium uppercase" htmlFor="confirmPassword">
            CONFIRM PASSWORD
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
            className="w-full bg-background border border-border rounded-sm text-text-primary placeholder:text-gray-500 px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="pt-2 pb-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded bg-background border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-xs text-text-secondary leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-text-primary underline hover:text-primary transition-colors underline-offset-2">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-text-primary underline hover:text-primary transition-colors underline-offset-2">
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        {/* Primary CTA */}
        <Button
          type="submit"
          loading={loading}
          className="w-full py-2.5 rounded-sm font-semibold shadow-sm"
        >
          <span>Create Account</span>
          <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
        </Button>
      </form>

      {/* Bottom Prompt */}
      <p className="text-xs text-text-secondary text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium ml-1 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
