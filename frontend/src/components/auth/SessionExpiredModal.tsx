'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleReLogin = () => {
    onClose?.();
    router.replace('/login');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} maxWidth="sm">
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error">
          <span className="material-symbols-outlined text-3xl">lock_clock</span>
        </div>

        <div>
          <h2 className="text-base font-bold text-text-primary">
            Phiên đăng nhập đã hết hạn
          </h2>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Khóa phiên mã hóa đã hết hiệu lực hoặc tài khoản của bạn đã được đăng xuất từ một thiết bị khác.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-container border border-border text-left font-mono text-[11px] space-y-1 text-text-secondary">
          <div className="flex justify-between">
            <span>Mã trạng thái:</span>
            <span className="text-error font-medium">ERR_AUTH_SESSION_EXPIRED_401</span>
          </div>
          <div className="flex justify-between">
            <span>Mã hóa thiết bị:</span>
            <span className="text-success">Đã khóa an toàn</span>
          </div>
        </div>

        <Button variant="primary" size="md" className="w-full" onClick={handleReLogin}>
          <span className="material-symbols-outlined text-base mr-1.5">login</span>
          Đăng nhập lại
        </Button>
      </div>
    </Modal>
  );
};
export default SessionExpiredModal;
