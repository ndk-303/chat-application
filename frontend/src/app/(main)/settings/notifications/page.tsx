'use client';

import React, { useState, useEffect } from 'react';
import Button from '../../../../components/ui/Button';

export default function NotificationsSettingsPage() {
  const [permission, setPermission] = useState<string>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [callAlerts, setCallAlerts] = useState(true);
  const [mentionAlerts, setMentionAlerts] = useState(true);
  const [previewContent, setPreviewContent] = useState(true);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
    }
  };

  const handleSave = () => {
    localStorage.setItem(
      'app_settings_notifications',
      JSON.stringify({ soundEnabled, callAlerts, mentionAlerts, previewContent, dndEnabled })
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
            <span className="text-primary font-medium">Thông báo</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Thông báo & Cảnh báo chuông
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Quản lý cách nhận thông báo trên máy tính và chuông cuộc gọi đến.
          </p>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>Đã lưu cài đặt thông báo thành công!</span>
          </div>
        )}

        {/* System Permission Banner */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Quyền thông báo trên trình duyệt</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {permission === 'granted'
                  ? 'Trình duyệt đã cho phép hiển thị thông báo ngoài màn hình.'
                  : 'Cho phép ứng dụng gửi thông báo cuộc gọi và tin nhắn khi tab đang ẩn.'}
              </p>
            </div>
            {permission === 'granted' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                Đã bật
              </span>
            ) : (
              <Button variant="primary" size="sm" onClick={requestPermission}>
                Kích hoạt thông báo
              </Button>
            )}
          </div>
        </section>

        {/* Alert Types */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Loại cảnh báo & Âm thanh</h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Âm chuông cuộc gọi đến (WebRTC Ringing)</p>
                <p className="text-[10px] text-text-secondary">
                  Phát nhạc chuông liên tục khi có người gọi thoại hoặc video đến.
                </p>
              </div>
              <input
                type="checkbox"
                checked={callAlerts}
                onChange={(e) => setCallAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Tiếng báo tin nhắn mới</p>
                <p className="text-[10px] text-text-secondary">
                  Phát tiếng beep nhẹ khi nhận tin nhắn trực tiếp trong cuộc trò chuyện.
                </p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Nhắc nhở khi được nhắc tên (@mention)</p>
                <p className="text-[10px] text-text-secondary">
                  Luôn hiển thị thông báo nổi bật khi ai đó tag tên bạn trong nhóm.
                </p>
              </div>
              <input
                type="checkbox"
                checked={mentionAlerts}
                onChange={(e) => setMentionAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Hiển thị nội dung xem trước tin nhắn</p>
                <p className="text-[10px] text-text-secondary">
                  Hiển thị tên người gửi và đoạn đầu nội dung trên thông báo hệ thống.
                </p>
              </div>
              <input
                type="checkbox"
                checked={previewContent}
                onChange={(e) => setPreviewContent(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>
          </div>
        </section>

        {/* Do Not Disturb */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Chế độ không làm phiền (DND)</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Tạm thời tắt tất cả âm thanh và thông báo nổi để tập trung làm việc.
              </p>
            </div>
            <input
              type="checkbox"
              checked={dndEnabled}
              onChange={(e) => setDndEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
            />
          </div>
        </section>

        {/* Save Button */}
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={handleSave}>
            Lưu cài đặt thông báo
          </Button>
        </div>
      </div>
    </div>
  );
}
