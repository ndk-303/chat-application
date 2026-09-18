'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { verifyEmail } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setDigits(newDigits);
        const nextFocus = Math.min(pasted.length, 5);
        inputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setError('');
    setSuccess('');
    try {
      await api.resendVerification(email);
      setSuccess('A new verification code has been sent to your email.');
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Could not resend code. Please try again.');
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    if (!email) {
      setError('Email address is required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyEmail(email, code);
      setSuccess('Verification successful! Redirecting…');
      setTimeout(() => {
        router.push('/welcome');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] my-auto">
      <section
        className={[
          'bg-surface border border-border rounded-xl p-8',
          'shadow-elev-3 shadow-inner-highlight',
        ].join(' ')}
      >
        {/* Icon + Heading */}
        <div className="mb-6">
          {/* Mail icon — inline SVG, no Material Symbols */}
          <div className="w-11 h-11 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-primary mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </svg>
          </div>
          <h1 className="text-display font-bold text-text-primary">
            Check your email
          </h1>
          <p className="text-caption text-text-secondary mt-2 leading-relaxed">
            We sent a 6-digit verification code to{' '}
            <span className="text-text-primary font-medium">{email || 'your email'}</span>.
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

        {/* Success */}
        {success && (
          <div
            className="mb-5 p-3 rounded-sm bg-success/10 border border-success/20 text-caption text-success flex items-center gap-2"
            role="status"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="shrink-0">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M5 8l2 2 4-4" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/*
          OTP Input Matrix
          NOTE: font-mono is CORRECT here — OTP codes are technical data.
          This is one of the only 3 sanctioned uses of font-mono.
        */}
        <form onSubmit={handleVerify}>
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 mt-2 mb-7">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                aria-label={`Digit ${idx + 1} of 6`}
                className={[
                  'w-12 h-14 rounded-md bg-background text-center',
                  'text-h1 font-mono font-semibold text-text-primary',
                  'border transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  digit
                    ? 'border-primary ring-1 ring-primary/30 text-text-primary'
                    : 'border-border text-text-secondary',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Timer + Resend */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-caption text-text-secondary">Didn&apos;t receive the code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-caption text-primary hover:underline underline-offset-2 font-medium focus-visible:outline-none active:scale-95"
              >
                Resend now
              </button>
            ) : (
              <span className="text-caption text-text-secondary">
                Resend in{' '}
                {/* font-mono justified: countdown timer is technical data */}
                <span className="font-mono text-primary font-medium">
                  00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                </span>
              </span>
            )}
          </div>

          {/* Action */}
          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Verify &amp; Continue
          </Button>
        </form>

        {/* Secondary action */}
        <div className="mt-6 text-center border-t border-border/50 pt-5">
          <Link
            href="/register"
            className="text-caption text-text-secondary hover:text-text-primary transition-colors underline-offset-2 hover:underline"
          >
            Entered the wrong email? Create account again
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-1.5" aria-label="Loading">
          {[0, 150, 300].map((delay, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-[dot-bounce_1s_ease-in-out_infinite]"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
