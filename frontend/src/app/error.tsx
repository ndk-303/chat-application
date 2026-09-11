'use client';

import React, { useEffect } from 'react';
import Button from '../components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App-level error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-6 shadow-xl">
        <span className="material-symbols-outlined text-3xl">warning</span>
      </div>

      <span className="px-2.5 py-1 rounded-full text-xs font-mono text-error bg-error/10 border border-error/20 mb-3">
        Lỗi ứng dụng hệ thống
      </span>

      <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
        Đã xảy ra sự cố không mong muốn
      </h1>
      <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
        {error.message || 'Hệ thống ghi nhận lỗi ngoại lệ trong quá trình kết xuất.'}
      </p>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/chat')}>
          Về trang chủ
        </Button>
        <Button variant="primary" size="sm" onClick={() => reset()}>
          Thử lại
        </Button>
      </div>
    </div>
  );
}
