import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { authService } from '../../services/authService';
import { Info, Eye, EyeOff, Loader2 } from 'lucide-react';

interface RegisterForm {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    try {
      await authService.register({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
      });
      navigate('/verify-email', { state: { email: data.email } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">
          Tạo tài khoản
        </h1>
        <p className="text-[#6B7280] text-sm">Tham gia Vibe và bắt đầu kết nối</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <Info size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tên hiển thị */}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Tên hiển thị</label>
          <input
            type="text"
            placeholder="Tên của bạn"
            {...register('displayName', { required: 'Vui lòng nhập tên', minLength: { value: 2, message: 'Tối thiểu 2 ký tự' } })}
            className="w-full px-4 py-2.5 rounded-[0.3rem] border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]"
          />
          {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Email</label>
          <input
            type="email"
            placeholder="ban@example.com"
            {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' } })}
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
              {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })}
              className="w-full px-4 py-2.5 pr-11 rounded-[0.3rem] border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Xác nhận mật khẩu */}
        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Xác nhận mật khẩu</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu',
                validate: (val) => val === password || 'Mật khẩu không khớp'
              })}
              className="w-full px-4 py-2.5 pr-11 rounded-[0.3rem] border border-[#E5E7EB] bg-[#F5F7FA] text-[#1F2937] text-sm outline-none transition-all duration-200 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 focus:bg-white placeholder:text-[#9CA3AF]"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-[#0068FF] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#0052CC] hover:shadow-lg hover:shadow-[#0068FF]/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : 'Tạo tài khoản'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-[#0068FF] font-semibold hover:text-[#0052CC] transition-colors no-underline">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
