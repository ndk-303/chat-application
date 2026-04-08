import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { authService } from '../../services/authService';
import { Mail, Info, Check, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleSubmit = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length < 6) return setError('Vui lòng nhập đủ 6 chữ số');
    setIsLoading(true);
    setError('');
    try {
      await authService.verifyEmail(email, verificationCode);
      navigate('/login', { state: { verified: true } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Mã xác thực không hợp lệ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      await authService.resendVerificationCode(email);
      setSuccess('Đã gửi lại mã! Kiểm tra hộp thư của bạn.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Gửi lại mã thất bại');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0068FF]/10 flex items-center justify-center mx-auto mb-4">
          <Mail size={28} color="#0068FF" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Xác thực email</h1>
        <p className="text-gray-500 text-sm">
          Chúng tôi đã gửi mã 6 chữ số đến <span className="font-medium text-gray-700">{email || 'email của bạn'}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <Info size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Ô nhập OTP */}
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
            className="w-12 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/20 focus:bg-white"
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || code.join('').length < 6}
        className="w-full py-2.5 rounded-lg bg-[#0068FF] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Đang xác thực...
          </>
        ) : 'Xác thực Email'}
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
        <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors no-underline">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
