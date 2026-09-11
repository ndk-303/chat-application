'use client';

import React, { useState } from 'react';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';

export default function PrivacySettingsPage() {
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);
  const [disappearingMessages, setDisappearingMessages] = useState<'off' | '24h' | '7d'>('off');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(
      'app_settings_privacy',
      JSON.stringify({ readReceipts, typingIndicator, disappearingMessages })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
      <div className="max-w-2xl space-y-8">
        {/* Header Block */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-1">
            <span>Cài đặt</span>
            <span>/</span>
            <span className="text-primary font-medium">Bảo mật & Quyền riêng tư</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Quyền riêng tư & Bảo mật E2EE
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Kiểm soát mức độ chia sẻ dữ liệu, khóa bảo mật và cơ chế mã hóa kênh truyền.
          </p>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>Đã lưu cài đặt bảo mật thành công!</span>
          </div>
        )}

        {/* E2EE Protocol Status Card */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-xl">enhanced_encryption</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Mã hóa đầu-cuối đa lớp</h2>
                <p className="text-xs text-text-secondary">Signal Protocol Double Ratchet & WebRTC DTLS</p>
              </div>
            </div>
            <Badge variant="primary" className="text-xs">
              Đang hoạt động
            </Badge>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            Tin nhắn văn bản, tệp tin đính kèm và luồng thoại video được bảo vệ trực tiếp trên thiết bị của bạn. Máy chủ không thể đọc hoặc lưu trữ nội dung giải mã.
          </p>
        </section>

        {/* Read Receipts & Typing Indicators */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Thông báo đọc & Soạn tin</h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Gửi thông báo đã xem (Read Receipts)</p>
                <p className="text-[10px] text-text-secondary">
                  Cho phép người gửi biết khi bạn đã mở và đọc tin nhắn của họ.
                </p>
              </div>
              <input
                type="checkbox"
                checked={readReceipts}
                onChange={(e) => setReadReceipts(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Hiển thị trạng thái đang nhập liệu (Typing Indicator)</p>
                <p className="text-[10px] text-text-secondary">
                  Hiển thị biểu tượng đang soạn tin nhắn cho đối phương trong thời gian thực.
                </p>
              </div>
              <input
                type="checkbox"
                checked={typingIndicator}
                onChange={(e) => setTypingIndicator(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>
          </div>
        </section>

        {/* Disappearing Messages */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Tin nhắn tự hủy mặc định</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Tự động xóa tin nhắn trong các cuộc hội thoại mới sau khoảng thời gian định sẵn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDisappearingMessages('off')}
              className={`p-3 rounded-xl border text-left transition-all ${
                disappearingMessages === 'off'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface-container'
              }`}
            >
              <p className="text-xs font-medium text-text-primary">Tắt (Mặc định)</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Lưu lịch sử trò chuyện</p>
            </button>

            <button
              type="button"
              onClick={() => setDisappearingMessages('24h')}
              className={`p-3 rounded-xl border text-left transition-all ${
                disappearingMessages === '24h'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface-container'
              }`}
            >
              <p className="text-xs font-medium text-text-primary">Sau 24 giờ</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Tự hủy sau 1 ngày</p>
            </button>

            <button
              type="button"
              onClick={() => setDisappearingMessages('7d')}
              className={`p-3 rounded-xl border text-left transition-all ${
                disappearingMessages === '7d'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface-container'
              }`}
            >
              <p className="text-xs font-medium text-text-primary">Sau 7 ngày</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Tự hủy sau 1 tuần</p>
            </button>
          </div>
        </section>

        {/* Save button */}
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={handleSave}>
            Lưu cài đặt bảo mật
          </Button>
        </div>
      </div>
    </div>
  );
}
