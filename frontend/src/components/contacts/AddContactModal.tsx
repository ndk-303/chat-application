'use client';

import React, { useState } from 'react';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onContactAdded,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [sentList, setSentList] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError('');
    setSearching(true);
    try {
      const res = await api.searchUsers(query.trim());
      setSearchResults(res.users || []);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy người dùng');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    setSendingRequest(receiverId);
    setError('');

    try {
      await api.sendFriendRequest(receiverId);
      setSentList((prev) => [...prev, receiverId]);
      onContactAdded();
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lời mời kết bạn');
    } finally {
      setSendingRequest(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Contact"
      subtitle="Search and connect with peers across the Aether mesh"
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-sm bg-error/10 border border-error/20 text-xs text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-secondary text-sm">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <Button type="submit" size="sm" loading={searching}>
            Search
          </Button>
        </form>

        {/* Results */}
        <div className="max-h-[260px] overflow-y-auto space-y-1 divide-y divide-border/20 pt-2">
          {searchResults.length === 0 && !searching && query && (
            <p className="text-xs text-text-secondary text-center py-6">
              No matching users found. Try another query.
            </p>
          )}

          {searchResults.map((peer) => {
            const alreadySent = sentList.includes(peer._id);

            return (
              <div
                key={peer._id}
                className="pt-2 pb-2 flex items-center justify-between hover:bg-surface-hover px-2 rounded-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={peer.displayName}
                    src={peer.avatar}
                    size="sm"
                    status={peer.status}
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-text-primary truncate">
                      {peer.displayName}
                    </h4>
                    <p className="text-[11px] text-text-secondary truncate">{peer.email}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={alreadySent ? 'secondary' : 'primary'}
                  disabled={alreadySent}
                  loading={sendingRequest === peer._id}
                  onClick={() => handleSendRequest(peer._id)}
                  className="shrink-0"
                >
                  {alreadySent ? 'Requested' : 'Connect'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default AddContactModal;
