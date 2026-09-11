'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-secondary mb-6 shadow-xl">
        <span className="material-symbols-outlined text-3xl text-primary">search_off</span>
      </div>

      <span className="px-2.5 py-1 rounded-full text-xs font-mono text-primary bg-primary/10 border border-primary/20 mb-3">
        404 — Trang không tồn tại
      </span>

      <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
        Không tìm thấy nội dung yêu cầu
      </h1>
      <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
        Trang hoặc kênh kết nối bạn tìm kiếm không tồn tại hoặc đã được chuyển sang một địa chỉ bảo mật khác.
      </p>

      <Link
        href="/chat"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-sm active:scale-95"
      >
        <span className="material-symbols-outlined text-base">chat</span>
        Quay lại cuộc trò chuyện
      </Link>
    </div>
  );
}
