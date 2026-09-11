'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'sent' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.requestPasswordReset(email);
      setSuccess(res.message || 'Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn.');
      setStep('sent');
    } catch (err: any) {
      setError(err.message || 'Không thể yêu cầu đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.resetPassword({ email, resetToken, newPassword });
      setSuccess(res.message || 'Mật khẩu đã được đặt lại thành công!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] my-auto">
      <section className="bg-surface border border-border rounded-xl p-8 shadow-2xl transition-all">
        {/* Card Header */}
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Reset your password</h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            {step === 'reset'
              ? 'Enter the reset code sent to your email and choose a new password.'
              : 'Enter your email address and we will send you instructions to reset your access.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-sm bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-sm bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {step === 'request' && (
          <form className="mt-6 space-y-4" onSubmit={handleRequestReset}>
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="email">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-sm text-text-primary placeholder:text-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Security Notice Callout */}
            <div className="bg-background border border-border rounded-sm p-3.5 flex items-start gap-3 mt-4">
              <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">
                verified_user
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                If an account is associated with this email, you will receive a secure reset code.
              </p>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3 rounded-sm font-semibold mt-4 shadow-sm">
              <span>Send Reset Code</span>
              <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </Button>
          </form>
        )}

        {step === 'sent' && (
          <div className="mt-6 text-left space-y-4">
            <div className="p-4 rounded-sm bg-surface-container border border-border">
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Dispatch successful
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Check your inbox for <span className="text-text-primary font-medium">{email}</span>. A security reset token has been dispatched.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => setStep('reset')}
              className="w-full py-2.5 rounded-sm"
            >
              Enter Reset Code & Set Password
            </Button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Change email or resend
            </button>
          </div>
        )}

        {step === 'reset' && (
          <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="resetToken">
                RESET CODE / TOKEN
              </label>
              <input
                id="resetToken"
                name="resetToken"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste code from email"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-sm text-text-primary placeholder:text-gray-500 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="newPassword">
                NEW PASSWORD
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-sm text-text-primary placeholder:text-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full py-3 rounded-sm font-semibold mt-4 shadow-sm">
              <span>Update Password</span>
              <span className="material-symbols-outlined text-sm ml-1">lock_reset</span>
            </Button>
          </form>
        )}

        {/* Navigation Return Action */}
        <div className="mt-6 text-center pt-2 border-t border-border/60">
          <Link
            href="/login"
            className="text-xs text-text-secondary hover:text-primary transition-colors font-medium inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Back to sign in</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
