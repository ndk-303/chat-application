'use client';

import React, { useState } from 'react';
import Button from '../../../components/ui/Button';

export default function SettingsGeneralPage() {
  const [theme, setTheme] = useState<'dark' | 'oled' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState<'emerald' | 'cyan' | 'amber'>('emerald');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [soundEffects, setSoundEffects] = useState(true);
  const [enterToSend, setEnterToSend] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(
      'app_settings_general',
      JSON.stringify({ theme, accentColor, density, language, soundEffects, enterToSend })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
      <div className="max-w-2xl space-y-8">
        {/* Header Block */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-1">
            <span>Cài đặt</span>
            <span>/</span>
            <span className="text-primary font-medium">Giao diện & Hệ thống</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Cài đặt chung & Giao diện
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Tùy biến không gian làm việc, màu sắc chủ đạo và hành vi nhập liệu của bạn.
          </p>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>Đã lưu cài đặt giao diện thành công!</span>
          </div>
        )}

        {/* Theme Mode Section */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Chế độ hiển thị (Theme)</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Chọn giao diện phù hợp với điều kiện ánh sáng của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-surface-container hover:bg-surface-bright'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#16191E] border border-border flex items-center justify-center text-primary mb-2">
                <span className="material-symbols-outlined text-base">dark_mode</span>
              </div>
              <p className="text-xs font-medium text-text-primary">Dark Minimal</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Nền đen than tự nhiên #0D0F12</p>
            </button>

            <button
              type="button"
              onClick={() => setTheme('oled')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                theme === 'oled'
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-surface-container hover:bg-surface-bright'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-black border border-border flex items-center justify-center text-text-primary mb-2">
                <span className="material-symbols-outlined text-base">contrast</span>
              </div>
              <p className="text-xs font-medium text-text-primary">OLED Pure Black</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Đen tuyệt đối tiết kiệm pin</p>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                theme === 'system'
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-surface-container hover:bg-surface-bright'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-surface-bright border border-border flex items-center justify-center text-text-secondary mb-2">
                <span className="material-symbols-outlined text-base">desktop_windows</span>
              </div>
              <p className="text-xs font-medium text-text-primary">Theo hệ điều hành</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Đồng bộ tự động theo OS</p>
            </button>
          </div>
        </section>

        {/* Accent Color Section */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Màu nhấn chủ đạo (Accent Color)</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Định hình nhận diện các liên kết, huy hiệu và nút bấm chính.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAccentColor('emerald')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                accentColor === 'emerald'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface-container'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#00A67E]"></span>
              <span className="text-xs text-text-primary font-medium">Aether Emerald</span>
            </button>

            <button
              type="button"
              onClick={() => setAccentColor('cyan')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                accentColor === 'cyan'
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-border bg-surface-container'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#00E5FF]"></span>
              <span className="text-xs text-text-primary font-medium">Neon Cyan</span>
            </button>

            <button
              type="button"
              onClick={() => setAccentColor('amber')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                accentColor === 'amber'
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-border bg-surface-container'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#FFB300]"></span>
              <span className="text-xs text-text-primary font-medium">Solar Amber</span>
            </button>
          </div>
        </section>

        {/* Behavior & Sound FX */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Hành vi & Tương tác</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Tùy chỉnh phím tắt gửi tin nhắn và âm thanh hệ thống.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Âm thanh thông báo & Gõ phím</p>
                <p className="text-[10px] text-text-secondary">
                  Phát tiếng chuông nhẹ khi có tin nhắn mới hoặc gửi thành công.
                </p>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-border cursor-pointer">
              <div>
                <p className="text-xs font-medium text-text-primary">Nhấn Enter để gửi tin nhắn</p>
                <p className="text-[10px] text-text-secondary">
                  Sử dụng Shift + Enter để xuống dòng khi gõ tin nhắn.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enterToSend}
                onChange={(e) => setEnterToSend(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border"
              />
            </label>
          </div>
        </section>

        {/* Language selector */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Ngôn ngữ hiển thị</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Chọn ngôn ngữ cho giao diện ứng dụng.
            </p>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="w-full sm:w-64 bg-background border border-border rounded-lg p-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="vi">Tiếng Việt (Mặc định)</option>
            <option value="en">English (US)</option>
          </select>
        </section>

        {/* Save button */}
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={handleSave}>
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
}
