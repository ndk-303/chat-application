'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
      {/* Icon */}
      <div className="w-14 h-14 rounded-lg bg-surface border border-border flex items-center justify-center text-primary mb-6 shadow-elev-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M9 11h4M11 9v4" strokeOpacity="0.5" />
        </svg>
      </div>

      {/* Status badge — micro text, mono for the numeric code */}
      <span className="px-2.5 py-1 rounded-xs text-micro font-mono text-primary bg-primary/10 border border-primary/20 mb-4">
        404
      </span>

      {/* Heading — use text-h1 token, not ad-hoc text-2xl */}
      <h1 className="text-h1 font-semibold text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-caption text-text-secondary max-w-[320px] mb-8 leading-relaxed">
        The page or channel you&apos;re looking for doesn&apos;t exist or has been moved to a different address.
      </p>

      <Link
        href="/chat"
        className={[
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-sm',
          'bg-primary hover:bg-primary-hover text-white text-ui font-medium',
          'transition-all duration-150 shadow-elev-1 hover:shadow-accent-sm hover:-translate-y-px',
          'active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ].join(' ')}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 10.5c0 3.59-3.13 6.5-7 6.5a7.57 7.57 0 0 1-3.18-.69L3 17l.69-3.63A6.27 6.27 0 0 1 3 10.5C3 6.91 6.13 4 10 4s7 2.91 7 6.5z" />
        </svg>
        Back to conversations
      </Link>
    </div>
  );
}
