'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Cài đặt chung & Giao diện',
      href: '/settings',
      icon: 'palette',
      active: pathname === '/settings',
    },
    {
      label: 'Âm thanh & Video (WebRTC)',
      href: '/settings/voice-video',
      icon: 'mic',
      active: pathname === '/settings/voice-video',
    },
    {
      label: 'Quyền riêng tư & Bảo mật',
      href: '/settings/privacy',
      icon: 'lock',
      active: pathname === '/settings/privacy',
    },
    {
      label: 'Thông báo & Chuông',
      href: '/settings/notifications',
      icon: 'notifications',
      active: pathname === '/settings/notifications',
    },
    {
      label: 'Thiết bị & Phiên kết nối',
      href: '/settings/devices',
      icon: 'devices',
      active: pathname === '/settings/devices',
    },
  ];

  return (
    <div className="flex-1 flex w-full h-full bg-background overflow-hidden">
      {/* Settings Sub-Navigation Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col justify-between p-4 hidden md:flex">
        <div>
          <div className="px-3 pb-3 mb-2 border-b border-border/40">
            <p className="text-[11px] font-semibold text-text-secondary tracking-wider uppercase font-mono">
              Tùy chỉnh hệ thống
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  item.active
                    ? 'bg-surface-bright text-text-primary border-l-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright/50'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-lg ${
                    item.active ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sync status footer */}
        <div className="p-3 rounded-xl bg-surface-container border border-border">
          <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              E2EE Mesh Đồng bộ
            </span>
            <span className="font-mono text-primary">0ms</span>
          </div>
          <p className="font-mono text-[10px] text-text-secondary/70">
            Mã hóa đầu-cuối WebRTC v2.4.1
          </p>
        </div>
      </aside>

      {/* Main Settings Sub-Page Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Sub-Nav Tab Bar */}
        <div className="md:hidden flex items-center gap-2 p-3 border-b border-border bg-surface overflow-x-auto shrink-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1.5 ${
                item.active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
