import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { authService } from '../../services/authService';
import { Info, Loader2, ArrowLeft } from 'lucide-react';

const inputCls =
  'w-full px-4 py-2.5 rounded-[0.25rem] border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]';

interface ForgotForm { email: string }

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const onSubmit = async (data: ForgotForm) => {
    setApiError('');
    setLoading(true);
    try {
      const res = await authService.requestPasswordReset(data.email);
      // Navigate to VerifyEmailPage with reset context
      navigate('/verify-email', {
        state: {
          mode: 'reset',
          email: data.email,
          resetToken: res.resetToken, // backend trả token thẳng, tự điền vào OTP
        },
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApiError(e.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Quên mật khẩu?</h1>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[0.25rem] text-red-600 text-sm flex items-center gap-2">
          <Info size={15} />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Email</label>
          <input
            type="email"
            placeholder="ban@example.com"
            {...register('email', {
              required: 'Vui lòng nhập email',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
            })}
            className={inputCls}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-[0.25rem] bg-[#0068FF] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" />Đang xử lý...</>
            : 'Gửi mã xác thực'}
        </button>
      </form>

      <p className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-[#0068FF] font-semibold hover:text-[#0052CC] transition-colors no-underline flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Quay lại đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
