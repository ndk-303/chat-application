import { Navigate } from 'react-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initAuth = useAuthStore((s) => s.initAuth);

  // Dùng ref để tránh useEffect loop do Zustand tạo function reference mới
  const initRef = useRef(initAuth);
  initRef.current = initAuth;

  useEffect(() => {
    if (!isInitialized) {
      initRef.current();
    }
  }, [isInitialized]); // chỉ phụ thuộc isInitialized, không phụ thuộc initAuth

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="" />
          <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
