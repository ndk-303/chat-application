'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../../components/ui/Avatar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { isConnected } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-text-secondary font-mono tracking-wider uppercase">
          Verifying Enclave Session...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/chat', icon: 'chat_bubble', label: 'Chats' },
    { href: '/calls/history', icon: 'call', label: 'Calls' },
    { href: '/contacts', icon: 'group', label: 'Contacts' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <div className="bg-background text-text-primary h-screen w-screen overflow-hidden flex flex-col antialiased select-none">
      {/* Top App Bar */}
      <header className="w-full bg-background border-b border-border z-30 flex-shrink-0">
        <div className="flex justify-between items-center w-full px-6 py-2.5">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <span className="text-base font-bold tracking-tight text-text-primary">Aether</span>
            </Link>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface border border-border text-xs text-text-secondary">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-success animate-pulse' : 'bg-warning'
                }`}
              />
              <span>{isConnected ? 'E2EE Mesh Active' : 'Connecting...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/settings/notifications')}
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-sm hover:bg-surface-hover transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>

            <Link
              href="/profile"
              className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-90 transition-opacity"
            >
              <Avatar
                name={user.displayName}
                src={user.avatar}
                size="sm"
                status={user.status || 'online'}
              />
              <span className="hidden md:block text-xs font-medium text-text-primary max-w-[120px] truncate">
                {user.displayName}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Left Navigation Rail (64px) */}
        <nav className="w-16 h-full bg-background border-r border-border py-4 flex flex-col justify-between items-center z-20 flex-shrink-0">
          <div className="flex flex-col items-center gap-3 w-full">
            {navItems.map((item) => {
              const isActive =
                item.href === '/chat'
                  ? pathname.startsWith('/chat')
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative w-10 h-10 rounded-sm flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-surface text-primary shadow-sm border border-border'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  title={item.label}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {isActive && (
                    <span className="absolute -left-3 w-1 h-5 rounded-r bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={logout}
              className="w-10 h-10 rounded-sm text-text-secondary hover:text-error hover:bg-surface-hover flex items-center justify-center transition-colors"
              title="Log out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </nav>

        {/* Content Viewport */}
        <div className="flex-1 flex overflow-hidden w-full h-full relative">
          {children}
        </div>
      </div>
    </div>
  );
}
