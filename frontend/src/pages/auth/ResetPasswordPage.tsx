import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { authService } from '../../services/authService';
import { Info, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const inputCls =
  'w-full px-4 py-2.5 rounded-[0.3rem] border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]';

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

interface ResetState {
  email?: string;
  resetToken?: string;
}

export default function ResetPasswordPage() {
  const navigate        = useNavigate();
  const location        = useLocation();
  const state           = (location.state ?? {}) as ResetState;
  const finalEmail      = state.email      ?? '';
  const finalToken      = state.resetToken ?? '';

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [done, setDone]         = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const newPassword = watch('newPassword');

  const onSubmit = async (data: ResetForm) => {
    setApiError('');
    setLoading(true);
    try {
      await authService.resetPassword({
        email:       finalEmail,
        resetToken:  finalToken,
        newPassword: data.newPassword,
      });
      setDone(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApiError(e.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────────── */
  if (done) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={36} color="#22C55E" strokeWidth={1.8} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Đặt lại thành công!</h1>
          <p className="text-[#6B7280] text-sm mb-8">
            Mật khẩu của bạn đã được cập nhật.<br />
            Hãy đăng nhập bằng mật khẩu mới.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-2.5 rounded-xl bg-[#0068FF] text-white font-semibold text-sm text-center transition-all hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/25 no-underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </AuthLayout>
    );
  }

  /* ── Guard: missing state ────────────────────────────────────── */
  if (!finalEmail || !finalToken) {
    return (
      <AuthLayout>
        <div className="text-center py-6">
          <p className="text-red-500 text-sm mb-4">
            Phiên làm việc đã hết hạn hoặc liên kết không hợp lệ.
          </p>
          <Link
            to="/forgot-password"
            className="text-[#0068FF] font-semibold text-sm hover:text-[#0052CC] no-underline"
          >
            Thử lại từ đầu
          </Link>
        </div>
      </AuthLayout>
    );
  }

  /* ── Reset form ─────────────────────────────────────────────── */
  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Tạo mật khẩu mới</h1>
        <p className="text-[#6B7280] text-sm">
          Đặt mật khẩu mới cho{' '}
          <span className="font-medium text-[#1F2937]">{finalEmail}</span>
        </p>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <Info size={15} />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Mật khẩu mới</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Tối thiểu 6 ký tự"
              {...register('newPassword', {
                required: 'Vui lòng nhập mật khẩu mới',
                minLength: { value: 6, message: 'Tối thiểu 6 ký tự' },
              })}
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Xác nhận mật khẩu</label>
          <div className="relative">
            <input
              type={showCfm ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu mới"
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu',
                validate: (v) => v === newPassword || 'Mật khẩu không khớp',
              })}
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowCfm(!showCfm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showCfm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-[#0068FF] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" />Đang xử lý...</>
            : 'Đặt lại mật khẩu'}
        </button>
      </form>

      <p className="mt-5 text-center">
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Thử lại từ đầu
        </button>
      </p>
    </AuthLayout>
  );
}
