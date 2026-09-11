'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { FriendEntry } from '../../types';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoadingFriends(true);
      setError('');
      setSelectedIds([]);
      setGroupName('');
      api
        .getFriends()
        .then((res) => setFriends(res.friends || []))
        .catch((err) => setError(err.message || 'Không thể tải danh sách bạn bè'))
        .finally(() => setLoadingFriends(false));
    }
  }, [isOpen]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên cho nhóm');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await api.createGroupConversation(groupName.trim(), selectedIds);
      onClose();
      router.push(`/chat/${res.conversation._id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo nhóm trò chuyện');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      subtitle="Assemble an encrypted multi-peer channel"
      maxWidth="md"
    >
      <form onSubmit={handleCreateGroup} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-sm bg-error/10 border border-error/20 text-xs text-error">
            {error}
          </div>
        )}

        {/* Group Name */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="groupName">
            GROUP NAME
          </label>
          <input
            id="groupName"
            type="text"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Protocol Core Engineering"
            className="w-full bg-background border border-border rounded-sm px-3.5 py-2 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Member Selection */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              SELECT PARTICIPANTS
            </label>
            <span className="text-[11px] font-mono text-primary font-medium">
              {selectedIds.length} selected
            </span>
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-1 bg-background border border-border rounded-sm p-2">
            {loadingFriends ? (
              <div className="py-6 text-center text-xs text-text-secondary">
                Loading contacts...
              </div>
            ) : friends.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-secondary">
                No contacts available. Add friends first.
              </div>
            ) : (
              friends.map((friend) => {
                const isSelected = selectedIds.includes(friend._id);
                return (
                  <div
                    key={friend._id}
                    onClick={() => toggleSelect(friend._id)}
                    className={`flex items-center justify-between p-2 rounded-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={friend.displayName}
                        src={friend.avatar}
                        size="xs"
                        status={friend.status}
                      />
                      <span className="text-xs font-medium text-text-primary">
                        {friend.displayName}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewGroupModal;
