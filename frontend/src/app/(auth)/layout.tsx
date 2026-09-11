import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-text-primary min-h-screen flex flex-col justify-between selection:bg-primary/20 selection:text-primary antialiased">
      {/* Header Anchor */}
      <header className="w-full pt-8 pb-4 flex justify-center items-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          </div>
          <span className="text-xl text-text-primary font-bold tracking-tight">Aether</span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface border border-border text-text-secondary">
            v2.4.1
          </span>
        </Link>
      </header>

      {/* Central Content */}
      <main className="w-full flex-grow flex items-center justify-center px-4 py-6">
        {children}
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full py-6 text-center text-xs text-text-secondary/70">
        <p>© 2026 Aether Chat. End-to-end encrypted WebRTC communication.</p>
      </footer>
    </div>
  );
}
