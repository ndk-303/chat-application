'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useCall } from '../../../context/CallContext';
import api from '../../../lib/api';
import { FriendEntry } from '../../../types';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { AddContactModal } from '../../../components/contacts/AddContactModal';
import { ContactProfileModal } from '../../../components/contacts/ContactProfileModal';

type TabType = 'all' | 'online' | 'pending' | 'sent';

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { startCall } = useCall();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<FriendEntry | null>(null);

  const fetchContactsData = async () => {
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        api.getFriends(),
        api.getReceivedRequests(),
        api.getSentRequests(),
      ]);

      setFriends(friendsRes.friends || []);
      setPendingRequests(receivedRes.requests || []);
      setSentRequests(sentRes.requests || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, [user?._id]);

  // Actions
  const handleAcceptRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await api.acceptFriendRequest(requestId);
      await fetchContactsData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chấp nhận kết bạn');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await api.rejectFriendRequest(requestId);
      await fetchContactsData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi từ chối kết bạn');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartChat = async (contactId: string) => {
    try {
      const res = await api.createPrivateConversation(contactId);
      router.push(`/chat/${res.conversation._id}`);
    } catch (err: any) {
      alert(err.message || 'Không thể mở trò chuyện');
    }
  };

  // Filtered contacts
  const filteredFriends = useMemo(() => {
    let list = friends;
    if (activeTab === 'online') {
      list = list.filter((f) => f.status === 'online');
    }
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.customStatus && f.customStatus.toLowerCase().includes(q))
    );
  }, [friends, activeTab, searchQuery]);

  const onlineCount = friends.filter((f) => f.status === 'online').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b border-border bg-surface/60 backdrop-blur shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Danh bạ & Bạn bè</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {friends.length} liên hệ
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Quản lý mạng lưới kết nối, danh sách bạn bè và yêu cầu kết nối bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <span className="material-symbols-outlined text-base mr-1">person_add</span>
            Thêm bạn bè
          </Button>
        </div>
      </header>

      {/* Navigation Filter Tabs & Search */}
      <div className="px-6 py-3 border-b border-border bg-surface/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-surface-container border border-border text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-container/50'
            }`}
          >
            Tất cả
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-bright text-text-secondary">
              {friends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'online'
                ? 'bg-surface-container border border-border text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-container/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            Trực tuyến
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-bright text-success">
              {onlineCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-surface-container border border-border text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-container/50'
            }`}
          >
            Lời mời nhận
            {pendingRequests.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'sent'
                ? 'bg-surface-container border border-border text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-container/50'
            }`}
          >
            Đã gửi
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-bright text-text-secondary">
              {sentRequests.length}
            </span>
          </button>
        </div>

        {/* Filter Input */}
        {(activeTab === 'all' || activeTab === 'online') && (
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm bạn theo tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-text-secondary text-xs">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
            Đang tải danh bạ...
          </div>
        ) : activeTab === 'pending' ? (
          /* PENDING REQUESTS TAB */
          <div>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Lời mời kết bạn đang chờ ({pendingRequests.length})
            </h2>

            {pendingRequests.length === 0 ? (
              <EmptyState
                icon="mark_email_read"
                title="Không có lời mời nào"
                description="Hiện bạn không có lời mời kết bạn nào đang chờ phản hồi."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingRequests.map((req) => {
                  const sender = req.senderId;
                  return (
                    <div
                      key={req._id}
                      className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 shadow-sm hover:border-text-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={sender?.avatar}
                          name={sender?.displayName || 'User'}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {sender?.displayName}
                          </p>
                          <p className="text-xs text-text-secondary truncate">{sender?.email}</p>
                          <span className="text-[11px] text-text-secondary font-mono">
                            Gửi lúc {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={actionLoadingId === req._id}
                          onClick={() => handleAcceptRequest(req._id)}
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionLoadingId === req._id}
                          onClick={() => handleRejectRequest(req._id)}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'sent' ? (
          /* SENT REQUESTS TAB */
          <div>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Lời mời đã gửi ({sentRequests.length})
            </h2>

            {sentRequests.length === 0 ? (
              <EmptyState
                icon="send"
                title="Chưa gửi lời mời nào"
                description="Bạn chưa gửi lời mời kết bạn nào đi."
                action={{
                  label: 'Tìm bạn bè mới',
                  onClick: () => setIsAddModalOpen(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sentRequests.map((req) => {
                  const target = req.receiverId;
                  return (
                    <div
                      key={req._id}
                      className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={target?.avatar}
                          name={target?.displayName || 'User'}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {target?.displayName}
                          </p>
                          <p className="text-xs text-text-secondary truncate">{target?.email}</p>
                          <span className="text-[11px] text-text-secondary font-mono">
                            Đang chờ phản hồi...
                          </span>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-xs text-text-secondary">
                        Đang chờ
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ALL / ONLINE CONTACTS TAB */
          <div>
            {filteredFriends.length === 0 ? (
              <EmptyState
                icon="group"
                title="Chưa có bạn bè trong danh sách"
                description={
                  searchQuery
                    ? 'Không tìm thấy liên hệ nào khớp với từ khóa của bạn.'
                    : 'Hãy kết nối với bạn bè và đồng nghiệp để bắt đầu trò chuyện bảo mật.'
                }
                action={{
                  label: searchQuery ? 'Xóa bộ lọc' : 'Thêm bạn bè ngay',
                  onClick: () => (searchQuery ? setSearchQuery('') : setIsAddModalOpen(true)),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => setSelectedContact(friend)}
                    className="group cursor-pointer p-4 rounded-xl bg-surface border border-border hover:border-primary/40 hover:bg-surface-container transition-all duration-150 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={friend.avatar}
                        name={friend.displayName}
                        status={friend.status}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                            {friend.displayName}
                          </p>
                        </div>
                        <p className="text-xs text-text-secondary truncate">{friend.email}</p>
                        {friend.customStatus && (
                          <p className="text-[11px] text-text-secondary truncate mt-0.5 italic">
                            "{friend.customStatus}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleStartChat(friend._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-surface-bright transition-colors"
                        title="Nhắn tin"
                      >
                        <span className="material-symbols-outlined text-base">chat</span>
                      </button>
                      <button
                        onClick={() =>
                          startCall(
                            friend._id,
                            {
                              _id: friend._id,
                              displayName: friend.displayName,
                              avatar: friend.avatar,
                            },
                            'audio'
                          )
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-success hover:bg-surface-bright transition-colors"
                        title="Gọi thoại"
                      >
                        <span className="material-symbols-outlined text-base">call</span>
                      </button>
                      <button
                        onClick={() =>
                          startCall(
                            friend._id,
                            {
                              _id: friend._id,
                              displayName: friend.displayName,
                              avatar: friend.avatar,
                            },
                            'video'
                          )
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-surface-bright transition-colors"
                        title="Gọi video"
                      >
                        <span className="material-symbols-outlined text-base">videocam</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onContactAdded={fetchContactsData}
      />

      <ContactProfileModal
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onUnfriended={() => {
          setSelectedContact(null);
          fetchContactsData();
        }}
      />
    </div>
  );
}
