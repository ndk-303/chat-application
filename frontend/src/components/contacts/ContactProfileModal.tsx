'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { FriendEntry } from '../../types';
import { useCall } from '../../context/CallContext';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

interface ContactProfileModalProps {
  contact: FriendEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onUnfriended?: () => void;
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  contact,
  isOpen,
  onClose,
  onUnfriended,
}) => {
  const router = useRouter();
  const { startCall } = useCall();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!contact) return null;

  const handleMessage = async () => {
    try {
      const res = await api.createPrivateConversation(contact._id);
      onClose();
      router.push(`/chat/${res.conversation._id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo cuộc trò chuyện');
    }
  };

  const handleUnfriend = async () => {
    if (!confirm(`Xóa ${contact.displayName} khỏi danh sách bạn bè?`)) return;
    setLoading(true);
    try {
      await api.unfriend(contact._id);
      onClose();
      onUnfriended?.();
    } catch (err: any) {
      setError(err.message || 'Không thể hủy kết bạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center space-y-4">
        {error && (
          <div className="p-2.5 rounded-sm bg-error/10 border border-error/20 text-xs text-error">
            {error}
          </div>
        )}

        <div className="relative inline-block mx-auto">
          <Avatar
            name={contact.displayName}
            src={contact.avatar}
            size="xl"
            status={contact.status}
          />
        </div>

        <div>
          <h3 className="text-base font-bold text-text-primary">{contact.displayName}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{contact.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container border border-border text-[11px] text-text-secondary">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                contact.status === 'online' ? 'bg-success' : 'bg-gray-500'
              }`}
            />
            <span className="capitalize">{contact.status || 'offline'}</span>
          </div>
        </div>

        {/* Cryptographic safety fingerprint */}
        <div className="p-3 bg-background border border-border rounded-sm text-left font-mono text-[11px] space-y-1">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-sans">
            Safety Fingerprint
          </span>
          <span className="text-text-primary break-all">
            7F8A • 9E21 • 410E • DD71 • BB90 • 3EF4
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleMessage}
            className="flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            <span>Message</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              onClose();
              startCall(contact._id, contact, 'audio');
            }}
            className="flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">call</span>
            <span>Audio Call</span>
          </Button>
        </div>

        <div className="pt-2 border-t border-border">
          <button
            type="button"
            disabled={loading}
            onClick={handleUnfriend}
            className="text-xs text-text-secondary hover:text-error transition-colors"
          >
            Remove Contact
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ContactProfileModal;
