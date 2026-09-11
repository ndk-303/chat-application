'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface P2PTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileSize?: string;
  peerName?: string;
  speed?: string;
  progress?: number;
  status?: 'transferring' | 'completed' | 'failed';
}

export const P2PTransferModal: React.FC<P2PTransferModalProps> = ({
  isOpen,
  onClose,
  fileName = 'aether-dataset-bundle.tar.gz',
  fileSize = '42.8 MB',
  peerName = 'Elena Rostova',
  speed = '12.4 MB/s',
  progress = 76,
  status = 'transferring',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl">
              {status === 'completed' ? 'check_circle' : 'swap_horiz'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Truyền tệp WebRTC P2P</h3>
            <p className="text-xs text-text-secondary">Trực tiếp qua WebRTC Data Channel</p>
          </div>
        </div>

        {/* File Card */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-primary truncate max-w-[200px]">{fileName}</span>
            <span className="font-mono text-text-secondary">{fileSize}</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
              <span>{progress}% hoàn tất</span>
              <span className="text-primary">{speed}</span>
            </div>
          </div>
        </div>

        {/* Transfer Metadata */}
        <div className="space-y-1.5 text-xs text-text-secondary font-mono">
          <div className="flex items-center justify-between">
            <span>Đối tác kết nối:</span>
            <span className="text-text-primary">{peerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Kênh bảo mật:</span>
            <span className="text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              SCTP / DTLS 1.3
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {status === 'completed' ? 'Đóng' : 'Thu nhỏ tiến trình'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default P2PTransferModal;
