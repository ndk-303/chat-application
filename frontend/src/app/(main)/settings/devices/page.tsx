'use client';

import React, { useState } from 'react';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';

interface DeviceSession {
  id: string;
  name: string;
  os: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function DevicesSettingsPage() {
  const [sessions, setSessions] = useState<DeviceSession[]>([
    {
      id: 'sess-1',
      name: 'MacBook Pro 16"',
      os: 'macOS Sonoma',
      browser: 'Chrome 128',
      location: 'TP. Hồ Chí Minh, VN',
      lastActive: 'Đang hoạt động',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      name: 'iPhone 15 Pro',
      os: 'iOS 18',
      browser: 'Safari Mobile',
      location: 'TP. Hồ Chí Minh, VN',
      lastActive: '2 giờ trước',
      isCurrent: false,
    },
    {
      id: 'sess-3',
      name: 'Workstation PC',
      os: 'Windows 11',
      browser: 'Firefox Developer Edition',
      location: 'Hà Nội, VN',
      lastActive: 'Hôm qua lúc 18:24',
      isCurrent: false,
    },
  ]);

  const [revoking, setRevoking] = useState(false);
  const [message, setMessage] = useState('');

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setMessage('Đã hủy quyền truy cập của thiết bị.');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRevokeAllOthers = () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất tất cả các thiết bị khác không?')) return;
    setRevoking(true);
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setRevoking(false);
      setMessage('Đã đăng xuất thành công khỏi tất cả các thiết bị khác.');
      setTimeout(() => setMessage(''), 3000);
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
      <div className="max-w-2xl space-y-8">
        {/* Header Block */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-1">
            <span>Cài đặt</span>
            <span>/</span>
            <span className="text-primary font-medium">Thiết bị & Phiên làm việc</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Thiết bị kết nối & Phiên đăng nhập
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Theo dõi tất cả thiết bị đang đăng nhập tài khoản và mã khóa phiên WebRTC của bạn.
          </p>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        {/* Current Device Highlight */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Thiết bị hiện tại</h2>
            <Badge variant="primary" className="text-xs">
              Thiết bị này
            </Badge>
          </div>

          {sessions
            .filter((s) => s.isCurrent)
            .map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-surface-container border border-border flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">laptop</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-text-primary">{s.name}</p>
                      <span className="text-[10px] text-text-secondary font-mono">
                        ({s.os} • {s.browser})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary">
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                        {s.lastActive}
                      </span>
                      <span>•</span>
                      <span>{s.location}</span>
                    </div>
                  </div>
                </div>

                <span className="material-symbols-outlined text-success text-xl" title="Phiên bảo mật">
                  verified_user
                </span>
              </div>
            ))}
        </section>

        {/* Other Active Sessions */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Các phiên hoạt động khác</h2>
              <p className="text-xs text-text-secondary">
                {sessions.filter((s) => !s.isCurrent).length} thiết bị khác đang đăng nhập.
              </p>
            </div>

            {sessions.filter((s) => !s.isCurrent).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-error hover:bg-error/10 text-xs self-start sm:self-auto"
                loading={revoking}
                onClick={handleRevokeAllOthers}
              >
                Đăng xuất tất cả thiết bị khác
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {sessions
              .filter((s) => !s.isCurrent)
              .map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-surface-container border border-border flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        {s.name.includes('iPhone') ? 'smartphone' : 'desktop_windows'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-primary">{s.name}</p>
                      <p className="text-[10px] text-text-secondary font-mono">
                        {s.os} • {s.browser} • {s.location}
                      </p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        Hoạt động lần cuối: {s.lastActive}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/10 text-xs shrink-0"
                    onClick={() => handleRevokeSession(s.id)}
                  >
                    Hủy phiên
                  </Button>
                </div>
              ))}

            {sessions.filter((s) => !s.isCurrent).length === 0 && (
              <p className="text-xs text-text-secondary text-center py-4">
                Không có thiết bị hoặc phiên đăng nhập nào khác.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
