'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/chat');
    } catch (err: any) {
      if (err.data?.unverified || err.message?.includes('chưa được xác thực')) {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-surface border border-border rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
      {/* Card Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1.5">Sign in to your account to continue</p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-sm bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Auth Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email Input Group */}
        <div>
          <label className="text-xs text-text-secondary block mb-1.5 font-medium tracking-wide" htmlFor="email">
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
            placeholder="you@example.com"
            className="w-full bg-background border border-border rounded-sm px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Password Input Group */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-text-secondary font-medium tracking-wide" htmlFor="password">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline transition-all"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-background border border-border rounded-sm px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
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
        </div>

        {/* Controls: Remember Me */}
        <div className="flex items-center pt-1">
          <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-background border-border text-primary focus:ring-primary focus:ring-offset-background focus:ring-offset-1 focus:ring-1 cursor-pointer transition-colors"
            />
            <span className="text-xs text-text-secondary">Remember me on this device</span>
          </label>
        </div>

        {/* Primary CTA */}
        <Button
          type="submit"
          loading={loading}
          className="w-full mt-2 py-2.5 rounded-sm font-semibold shadow-sm"
        >
          Sign In
        </Button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-surface px-3 text-xs text-text-secondary">
            or continue with
          </span>
        </div>

        {/* SSO Options (Mock / Future Provider) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 py-2.5 px-3 bg-surface hover:bg-surface-hover border border-border rounded-sm text-text-primary text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2.5 py-2.5 px-3 bg-surface hover:bg-surface-hover border border-border rounded-sm text-text-primary text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4 text-text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                fillRule="evenodd"
              />
            </svg>
            <span>GitHub</span>
          </button>
        </div>
      </form>

      {/* Bottom Card Prompt */}
      <div className="mt-6 pt-4 text-center border-t border-border/60">
        <p className="text-xs text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline transition-all ml-1">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
