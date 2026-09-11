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
    if (emailParam) {
      setEmail(emailParam);
    }
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
      setSuccess('Mã xác thực mới đã được gửi vào email của bạn.');
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã');
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã xác thực');
      return;
    }
    if (!email) {
      setError('Vui lòng cung cấp email');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyEmail(email, code);
      setSuccess('Xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => {
        router.push('/welcome');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] my-auto">
      <section className="bg-surface border border-border rounded-xl p-8 shadow-2xl transition-all">
        {/* Card Header */}
        <div className="text-left">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container border border-border mb-4 text-primary">
            <span className="material-symbols-outlined text-[20px]">mail</span>
          </div>
          <h1 className="text-2xl text-text-primary tracking-tight font-bold">Check your email</h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            We sent a 6-digit verification code to{' '}
            <span className="text-text-primary font-medium">{email || 'your email'}</span>.
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

        {/* OTP Entry Matrix */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 mt-7">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-12 h-14 rounded-lg bg-background border ${
                digit
                  ? 'border-primary text-text-primary'
                  : 'border-border text-text-secondary'
              } text-center font-mono text-2xl font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all`}
            />
          ))}
        </div>

        {/* Timer & Resend Row */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-sm text-text-secondary font-medium">Didn&apos;t receive the code?</span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-primary hover:underline font-medium focus:outline-none"
            >
              Resend now
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-sm text-text-secondary font-medium">
              <span>Resend in</span>
              <span className="font-mono text-primary font-medium tracking-tight">
                00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="button"
          onClick={() => handleVerify()}
          loading={loading}
          className="w-full mt-6 py-3 rounded-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Verify & Continue</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Button>

        {/* Secondary Email Change Action */}
        <div className="mt-6 text-center border-t border-border/60 pt-4">
          <Link
            href="/register"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Entered wrong email? Create account again
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
