'use client';

import React, { useState } from 'react';
import api from '../../lib/api';
import { Conversation, User } from '../../types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface GroupInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUser: User | null;
  onConversationUpdated: () => void;
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onConversationUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(conversation.isMuted || false);

  if (!isOpen) return null;

  const isAdmin =
    conversation.creatorId === currentUser?._id ||
    conversation.members?.some((m) => m.userId === currentUser?._id && m.role === 'admin');

  const handleToggleMute = async () => {
    try {
      if (isMuted) {
        await api.unmuteConversation(conversation._id);
        setIsMuted(false);
      } else {
        await api.muteConversation(conversation._id);
        setIsMuted(true);
      }
      onConversationUpdated();
    } catch (err: any) {
      setError(err.message || 'Không thể thay đổi cài đặt thông báo');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;
    setLoading(true);
    try {
      await api.leaveConversation(conversation._id);
      window.location.href = '/chat';
    } catch (err: any) {
      setError(err.message || 'Không thể rời nhóm');
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Xóa thành viên này khỏi nhóm?')) return;
    try {
      await api.removeMember(conversation._id, memberId);
      onConversationUpdated();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa thành viên');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0D0F12]/60 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-surface border-l border-border h-full flex flex-col z-10 animate-in slide-in-from-right duration-200 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Conversation Info</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && (
            <div className="p-2.5 rounded-sm bg-error/10 border border-error/20 text-xs text-error">
              {error}
            </div>
          )}

          {/* Group Header Info */}
          <div className="flex flex-col items-center text-center">
            <Avatar
              name={conversation.name || 'Group'}
              src={conversation.avatar}
              size="xl"
            />
            <h2 className="text-base font-bold text-text-primary mt-3">
              {conversation.name || 'Conversation'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5 font-mono">
              {conversation.type === 'group'
                ? `${conversation.participants?.length || 0} participants`
                : 'Direct P2P Encrypted Session'}
            </p>
          </div>

          {/* Quick Settings */}
          <div className="space-y-2 border-t border-b border-border py-3">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-xs text-text-primary">
                <span className="material-symbols-outlined text-text-secondary text-base">
                  notifications_off
                </span>
                <span>Mute Notifications</span>
              </div>
              <input
                type="checkbox"
                checked={isMuted}
                onChange={handleToggleMute}
                className="w-4 h-4 rounded bg-background border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Participants List */}
          {conversation.type === 'group' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-text-secondary uppercase font-mono tracking-wider">
                  MEMBERS ({conversation.participants?.length || 0})
                </h4>
              </div>

              <div className="space-y-1 divide-y divide-border/20">
                {conversation.participants?.map((participant) => {
                  const isUserAdmin =
                    participant._id === conversation.creatorId ||
                    conversation.members?.some(
                      (m) => m.userId === participant._id && m.role === 'admin'
                    );

                  return (
                    <div
                      key={participant._id}
                      className="pt-2 pb-2 flex items-center justify-between hover:bg-surface-hover px-1 rounded-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={participant.displayName}
                          src={participant.avatar}
                          size="sm"
                          status={participant.status}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {participant.displayName}
                            {participant._id === currentUser?._id && ' (You)'}
                          </p>
                          <span className="text-[10px] text-text-secondary">
                            {isUserAdmin ? 'Admin' : 'Member'}
                          </span>
                        </div>
                      </div>

                      {isAdmin && participant._id !== currentUser?._id && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(participant._id)}
                          className="p-1 text-text-secondary hover:text-error transition-colors"
                          title="Remove from group"
                        >
                          <span className="material-symbols-outlined text-sm">person_remove</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-4 border-t border-border space-y-2">
            {conversation.type === 'group' && (
              <Button
                variant="danger"
                size="sm"
                loading={loading}
                onClick={handleLeaveGroup}
                className="w-full flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Leave Group</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoDrawer;
