'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { FriendEntry } from '../../types';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

interface NewDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDirectChatModal: React.FC<NewDirectChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      api
        .getFriends()
        .then((res) => setFriends(res.friends || []))
        .catch((err) => setError(err.message || 'Không thể tải danh sách bạn bè'))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async (targetUserId: string) => {
    setStartingChat(targetUserId);
    setError('');

    try {
      const res = await api.createPrivateConversation(targetUserId);
      onClose();
      router.push(`/chat/${res.conversation._id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể bắt đầu cuộc trò chuyện');
    } finally {
      setStartingChat(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Direct Message"
      subtitle="Start an encrypted conversation with a contact"
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-sm bg-error/10 border border-error/20 text-xs text-error">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-secondary text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name or email..."
            className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Contact List */}
        <div className="max-h-[300px] overflow-y-auto space-y-1 divide-y divide-border/30">
          {loading ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading contacts...
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              No contacts found. Add friends from the Contacts tab first!
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend._id}
                className="pt-2 pb-2 flex items-center justify-between hover:bg-surface-hover px-2 rounded-sm transition-colors cursor-pointer"
                onClick={() => handleStartChat(friend._id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={friend.displayName}
                    src={friend.avatar}
                    size="sm"
                    status={friend.status}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">
                      {friend.displayName}
                    </h4>
                    <p className="text-[11px] text-text-secondary">{friend.email}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={startingChat === friend._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartChat(friend._id);
                  }}
                >
                  Message
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NewDirectChatModal;
