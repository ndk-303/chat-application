import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { useAuthStore } from '../../stores/authStore';
import { Info, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [showPassword, setShowPassword] = useState(false);

  // Tự động ẩn thông báo lỗi sau 4 giây
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => clearError(), 4000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const onSubmit = async (data: LoginForm) => {
    clearError();
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: unknown) {
      // Tài khoản chưa xác thực → redirect sang trang verify email
      const e = err as { unverified?: boolean; email?: string };
      if (e?.unverified) {
        navigate('/verify-email', { state: { email: e.email } });
      }
      // Các lỗi khác đã được xử lý bởi authStore (set error)
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">
          Chào mừng trở lại
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <Info size={16} />
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
            className="w-full px-4 py-2.5 rounded-[0.3rem] border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]"
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
              className="w-full px-4 py-2.5 pr-11 rounded-[0.3rem] border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
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
              <Loader2 size={16} className="animate-spin" />
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
