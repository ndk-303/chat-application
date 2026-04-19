import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { authService } from '../../services/authService';
import { Info, Check, Loader2 } from 'lucide-react';

interface LocationState {
  email?: string;
  mode?: 'reset';
  resetToken?: string;
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const email = state.email ?? '';
  const mode = state.mode;                       // 'reset' | undefined
  const initToken = state.resetToken ?? '';            // pre-fill OTP nếu có

  // Pre-fill OTP boxes from initToken nếu mode=reset
  const [code, setCode] = useState<string[]>(() => {
    if (mode === 'reset' && initToken.length === 6) {
      return initToken.split('');
    }
    return ['', '', '', '', '', ''];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const TIMER_SECONDS = 5 * 60;
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isExpired = timeLeft === 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  /* ── OTP input handlers ─────────────────────────────────────── */
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const enteredCode = code.join('');
    if (enteredCode.length < 6) return setError('Vui lòng nhập đủ 6 chữ số');
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'reset') {
        // Không gọi verifyEmail; chuyển sang trang đổi mật khẩu
        navigate('/reset-password', {
          state: { email, resetToken: enteredCode },
        });
      } else {
        // Registration email verification
        await authService.verifyEmail(email, enteredCode);
        navigate('/login', { state: { verified: true } });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Mã xác thực không hợp lệ');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Resend ─────────────────────────────────────────────────── */
  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      if (mode === 'reset') {
        const res = await authService.requestPasswordReset(email);
        // Refill OTP with new token
        if (res.resetToken?.length === 6) setCode(res.resetToken.split(''));
        setSuccess('Đã gửi mã mới. Vui lòng kiểm tra lại.');
      } else {
        await authService.resendVerificationCode(email);
        setSuccess('Đã gửi lại mã! Kiểm tra hộp thư của bạn.');
      }
      startTimer(); // reset countdown
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Gửi lại mã thất bại');
    } finally {
      setResendLoading(false);
    }
  };

  /* ── UI text by mode ────────────────────────────────────────── */
  const isReset = mode === 'reset';
  const title = isReset ? 'Nhập mã đặt lại' : 'Xác thực email';
  const desc = isReset
    ? `Mã 6 chữ số đã được tạo cho tài khoản`
    : 'Chúng tôi đã gửi mã 6 chữ số đến';
  const btnText = isReset ? 'Xác nhận' : 'Xác thực Email';
  const backLink = isReset
    ? '/forgot-password'
    : '/login';
  const backText = isReset
    ? '← Quay lại quên mật khẩu'
    : '← Quay lại đăng nhập';

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title}
        </h1>
        <p className="text-gray-500 text-sm">
          {desc}{' '}
          <span className="font-medium text-gray-700">{email || 'email của bạn'}</span>
        </p>
      </div>

      {/* Countdown timer */}
      <div className="mb-5 flex flex-col items-center gap-1">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isExpired
            ? 'bg-red-50 text-red-500 border border-red-200'
            : timeLeft <= 60
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : 'bg-blue-50 text-[#0068FF] border border-blue-100'
            }`}
        >
          <svg
            className={`w-4 h-4 flex-shrink-0 ${isExpired ? '' : 'animate-pulse'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {isExpired ? 'Mã đã hết hạn' : `Mã hết hạn sau ${timeStr}`}
        </div>
        {isExpired && (
          <p className="text-xs text-gray-400">Vui lòng nhấn "Gửi lại" để nhận mã mới</p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[0.25rem] text-red-600 text-sm flex items-center gap-2">
          <Info size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-[0.25rem] text-green-600 text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* OTP boxes */}
      <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-12 text-center text-xl font-bold rounded-[0.25rem] border-2 border-gray-200 bg-gray-50 text-gray-800 outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/20 focus:bg-white"
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || code.join('').length < 6 || isExpired}
        className="w-full py-2.5 rounded-[0.25rem] bg-[#0068FF] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <><Loader2 size={16} className="animate-spin" />Đang xử lý...</>
        ) : btnText}
      </button>

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-500">Chưa nhận được mã? </span>
        <button
          onClick={handleResend}
          disabled={resendLoading}
          className="text-sm text-[#0068FF] font-medium hover:text-[#0052CC] transition-colors disabled:opacity-50"
        >
          {resendLoading ? 'Đang gửi...' : 'Gửi lại'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link to={backLink} className="text-sm text-gray-400 hover:text-gray-600 transition-colors no-underline">
          {backText}
        </Link>
      </div>
    </AuthLayout>
  );
}
