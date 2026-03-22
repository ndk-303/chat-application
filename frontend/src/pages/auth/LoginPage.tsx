import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { useAuthStore } from '../../stores/authStore';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    clearError();
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch {
      // lỗi được lưu trong store
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">
          Chào mừng trở lại
        </h1>
        <p className="text-[#6B7280] text-sm">Đăng nhập vào tài khoản Vibe của bạn</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Email</label>
          <input
            type="email"
            placeholder="ban@example.com"
            {...register('email', { required: 'Vui lòng nhập email' })}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Mật khẩu */}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Quên mật khẩu */}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-[#0068FF] hover:text-[#0052CC] transition-colors no-underline font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-[#0068FF] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Đang đăng nhập...
            </>
          ) : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-[#0068FF] font-semibold hover:text-[#0052CC] transition-colors no-underline">
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  );
}
