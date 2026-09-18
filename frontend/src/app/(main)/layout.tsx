'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { CallProvider } from '../../context/CallContext';
import CallOverlay from '../../components/call/CallOverlay';
import NotificationsDrawer from '../../components/notifications/NotificationsDrawer';
import ReconnectingBanner from '../../components/network/ReconnectingBanner';
import CommandPaletteModal from '../../components/search/CommandPaletteModal';
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        {/* 3-dot loader — matches Button loading state for visual consistency */}
        <div className="flex items-center gap-1.5 mb-4" aria-label="Loading">
          {[0, 150, 300].map((delay, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-primary opacity-80 animate-[dot-bounce_1s_ease-in-out_infinite]"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <p className="text-caption text-text-secondary">
          Verifying session…
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    {
      href: '/chat',
      label: 'Chats',
      icon: (
        /* Chat bubble — inline SVG to avoid Material Symbols dependency */
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 10.5c0 3.59-3.13 6.5-7 6.5a7.57 7.57 0 0 1-3.18-.69L3 17l.69-3.63A6.27 6.27 0 0 1 3 10.5C3 6.91 6.13 4 10 4s7 2.91 7 6.5z" />
        </svg>
      ),
    },
    {
      href: '/calls/history',
      label: 'Calls',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13.73 10.73a8.91 8.91 0 0 1-3.95 3.95l-1.55-1.55a1 1 0 0 0-1.11-.21A11.36 11.36 0 0 1 3.5 13.5a1 1 0 0 0-1 1v3.5a1 1 0 0 0 1 1A16.5 16.5 0 0 0 20 2.5a1 1 0 0 0-1-1H15.5a1 1 0 0 0-1 1 11.36 11.36 0 0 1-.56 3.62 1 1 0 0 0 .21 1.11l1.58 1.5z" />
        </svg>
      ),
    },
    {
      href: '/contacts',
      label: 'Contacts',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="7" r="3" />
          <path d="M2 17c0-3.31 2.69-6 6-6s6 2.69 6 6" />
          <path d="M14 5h4M14 9h4" />
        </svg>
      ),
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="2" />
          <path d="M17.07 7.07l-.58-.35a6.07 6.07 0 0 0 0-1.44l.58-.35a1 1 0 0 0 .37-1.37l-1-1.72a1 1 0 0 0-1.37-.37l-.58.35a6 6 0 0 0-1.25-.72V1a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v.6a6 6 0 0 0-1.25.72l-.58-.35a1 1 0 0 0-1.37.37l-1 1.72a1 1 0 0 0 .37 1.37l.58.35a6.07 6.07 0 0 0 0 1.44l-.58.35a1 1 0 0 0-.37 1.37l1 1.72a1 1 0 0 0 1.37.37l.58-.35a6 6 0 0 0 1.25.72V18a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.6a6 6 0 0 0 1.25-.72l.58.35a1 1 0 0 0 1.37-.37l1-1.72a1 1 0 0 0-.37-1.37z" />
        </svg>
      ),
    },
  ];

  return (
    <CallProvider>
      {/*
        CRITICAL FIX: h-screen → min-h-[100dvh]
        h-screen uses 100vh which triggers the iOS Safari viewport jump bug
        100dvh accounts for the dynamic viewport (browser chrome show/hide)
        Also: removed select-none from here — scoped to nav only
      */}
      <div className="bg-background text-text-primary min-h-[100dvh] h-[100dvh] w-screen overflow-hidden flex flex-col antialiased">
        {/* Reconnecting Alert Banner */}
        <ReconnectingBanner />

        {/* Top App Bar */}
        <header className="w-full bg-background border-b border-border z-30 flex-shrink-0 h-11">
          <div className="flex justify-between items-center w-full h-full px-5">
            {/* Left: Logo + connection status */}
            <div className="flex items-center gap-3">
              <Link href="/chat" className="flex items-center gap-2 group" aria-label="Aether Chat home">
                {/* Logo mark — slightly larger for brand presence */}
                <div className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
                <span className="text-[17px] font-bold tracking-[-0.03em] text-text-primary">Aether</span>
              </Link>

              {/* E2EE status pill — static dot, no animate-pulse or animate-ping */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-caption text-text-secondary">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                    isConnected ? 'bg-success' : 'bg-warning'
                  }`}
                />
                <span>{isConnected ? 'E2EE Active' : 'Connecting…'}</span>
              </div>
            </div>

            {/* Right: Search + Notifications + Profile */}
            <div className="flex items-center gap-1.5">
              {/* Search trigger */}
              <button
                type="button"
                id="search-trigger"
                onClick={() => setIsSearchOpen(true)}
                className={[
                  'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-sm',
                  'bg-surface border border-border',
                  'text-caption text-text-secondary',
                  'hover:text-text-primary hover:bg-surface-2 hover:border-border',
                  'transition-colors duration-150',
                ].join(' ')}
                aria-label="Open search (⌘K)"
                title="Search (⌘K)"
              >
                {/* Search icon */}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5l3 3" />
                </svg>
                <span>Search…</span>
                <kbd className="px-1.5 py-0.5 text-micro font-mono bg-background rounded-xs border border-border">
                  ⌘K
                </kbd>
              </button>

              {/* Notifications */}
              <button
                type="button"
                id="notifications-trigger"
                onClick={() => setIsNotificationsOpen(true)}
                className="w-8 h-8 rounded-sm flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors active:scale-95"
                aria-label="Open notifications"
                title="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2a6 6 0 0 1 6 6v3.5l1.5 1.5v1H2.5v-1L4 11.5V8a6 6 0 0 1 6-6z" />
                  <path d="M8 17.5a2 2 0 0 0 4 0" />
                </svg>
              </button>

              {/* Profile link */}
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-2.5 border-l border-border ml-1 hover:opacity-80 transition-opacity"
                aria-label="View profile"
              >
                <Avatar
                  name={user.displayName}
                  src={user.avatar}
                  size="sm"
                  status={user.status || 'online'}
                />
                <span className="hidden md:block text-ui text-text-primary max-w-[120px] truncate">
                  {user.displayName}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden w-full relative">
          {/*
            Left Navigation Rail (64px)
            select-none scoped here only — not on the whole body
          */}
          <nav
            className="w-16 h-full bg-background border-r border-border py-3 flex flex-col justify-between items-center z-20 flex-shrink-0 select-none"
            aria-label="Main navigation"
          >
            <div className="flex flex-col items-center gap-1 w-full px-3">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/chat'
                    ? pathname.startsWith('/chat')
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'relative w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isActive
                        ? 'bg-surface-2 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                    ].join(' ')}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.icon}

                    {/* Active indicator pill — inside element bounds (fixes clip risk) */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <div className="flex flex-col items-center gap-1 px-3 w-full">
              <button
                type="button"
                onClick={logout}
                className="w-10 h-10 rounded-sm flex items-center justify-center text-text-secondary hover:text-error hover:bg-surface-2 transition-colors active:scale-95"
                aria-label="Log out"
                title="Log out"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" />
                  <path d="M14 14l3-4-3-4" />
                  <path d="M17 10H8" />
                </svg>
              </button>
            </div>
          </nav>

          {/* Content Viewport */}
          <main
            id="main-content"
            className="flex-1 flex overflow-hidden w-full h-full relative"
          >
            {children}
          </main>
        </div>
      </div>

      <CallOverlay />
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </CallProvider>
  );
}
