'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface QrIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  displayName?: string;
}

export const QrIdentityModal: React.FC<QrIdentityModalProps> = ({
  isOpen,
  onClose,
  userId,
  displayName,
}) => {
  const [copied, setCopied] = useState(false);
  const fingerprint = `7F8A-9E21-410E-DD71-BB90-3EF4-${userId ? userId.slice(-4).toUpperCase() : '88A1'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Identity Key & QR Code"
      subtitle="Verify your cryptographic identity with peer contacts"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-xl shadow-md inline-block">
          <svg
            className="w-48 h-48 text-black"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            {/* Minimalist stylistic vector QR pattern */}
            <rect width="28" height="28" x="8" y="8" rx="4" />
            <rect width="16" height="16" x="14" y="14" fill="white" />
            <rect width="8" height="8" x="18" y="18" />

            <rect width="28" height="28" x="64" y="8" rx="4" />
            <rect width="16" height="16" x="70" y="14" fill="white" />
            <rect width="8" height="8" x="74" y="18" />

            <rect width="28" height="28" x="8" y="64" rx="4" />
            <rect width="16" height="16" x="14" y="70" fill="white" />
            <rect width="8" height="8" x="18" y="74" />

            <rect width="12" height="12" x="44" y="44" />
            <rect width="6" height="6" x="44" y="14" />
            <rect width="6" height="6" x="44" y="74" />
            <rect width="6" height="6" x="74" y="44" />
            <rect width="6" height="6" x="14" y="44" />
          </svg>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-text-primary">{displayName}</h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Scan this code to verify peer identity
          </p>
        </div>

        {/* Monospace Fingerprint */}
        <div className="w-full p-3 bg-background border border-border rounded-sm font-mono text-xs text-text-primary flex items-center justify-between">
          <span className="truncate pr-2">{fingerprint}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-primary hover:text-primary-hover shrink-0 text-xs font-sans font-medium"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <Button size="sm" variant="secondary" onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default QrIdentityModal;
