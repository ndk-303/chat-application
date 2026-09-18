import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-background text-text-primary min-h-[100dvh] flex flex-col justify-between selection:bg-primary/10 selection:text-primary antialiased"
    >
      {/* Header — logo anchor */}
      <header className="w-full pt-8 pb-4 flex justify-center items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group cursor-pointer"
          aria-label="Aether Chat home"
        >
          {/* Logo mark — static dot (no animate-pulse) */}
          <div className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
          <span className="text-[17px] font-bold tracking-[-0.03em] text-text-primary">
            Aether
          </span>
          {/* Version badge — mono is appropriate for version strings */}
          <span className="text-micro font-mono px-2 py-0.5 rounded-xs bg-surface border border-border text-text-secondary">
            v2.4.1
          </span>
        </Link>
      </header>

      {/* Central Content */}
      <main
        id="main-content"
        className="w-full flex-grow flex items-center justify-center px-4 py-6"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-caption text-text-secondary/60">
        <p>© 2026 Aether Chat · End-to-end encrypted WebRTC communication.</p>
      </footer>
    </div>
  );
}
