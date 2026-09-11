'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import NewDirectChatModal from '../../../components/chat/NewDirectChatModal';

export default function EmptyChatPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex-1 h-full bg-background flex flex-col items-center justify-center p-8 relative overflow-y-auto">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        {/* Minimalist Vector Badge */}
        <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-5 relative shadow-sm">
          <span className="material-symbols-outlined text-text-secondary text-2xl">forum</span>
          {/* Emerald Accent Dot */}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
        </div>

        {/* Headline */}
        <h1 className="text-2xl text-text-primary font-bold tracking-tight">Your inbox is empty</h1>

        {/* Subtext description */}
        <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-sm">
          Connect with colleagues and friends to start end-to-end encrypted chats and WebRTC peer calls.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 px-4 rounded-sm transition-colors inline-flex items-center gap-2 shadow-sm active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-base">edit_square</span>
            <span>New Direct Message</span>
          </button>

          <Link
            href="/contacts"
            className="bg-surface hover:bg-surface-hover border border-border text-text-primary text-xs font-medium py-2.5 px-4 rounded-sm transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base text-text-secondary">person_search</span>
            <span>Find Contacts</span>
          </Link>
        </div>

        {/* Shortcut hint */}
        <div className="mt-6 flex items-center gap-1.5 font-mono text-xs text-text-secondary/60">
          <span>Click</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[11px] text-text-secondary font-mono">
            +
          </kbd>
          <span>in the sidebar to start a new chat</span>
        </div>
      </div>

      <NewDirectChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
