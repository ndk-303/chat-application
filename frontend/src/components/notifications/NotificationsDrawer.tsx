'use client';

import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export interface NotificationItem {
  id: string;
  type: 'mention' | 'call' | 'invite' | 'system';
  title: string;
  sender?: {
    name: string;
    avatar?: string;
  };
  content?: string;
  timestamp: string;
  read: boolean;
  meta?: any;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'mention' | 'call' | 'invite'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'mention',
      title: 'Sarah Lin nhắc đến bạn trong #core-protocol',
      sender: { name: 'Sarah Lin' },
      content: '@alexrivera bạn có thể kiểm tra nhật ký tái đàm phán WebRTC trên node-7 không?',
      timestamp: '10 phút trước',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'call',
      title: 'Cuộc gọi video nhỡ từ Marcus Vance',
      sender: { name: 'Marcus Vance' },
      content: 'Cuộc gọi WebRTC Direct Mesh (Không có phản hồi)',
      timestamp: 'Hôm qua lúc 18:40',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'invite',
      title: 'Elena Rostova đã gửi lời mời kết nối',
      sender: { name: 'Elena Rostova' },
      content: 'Chuyên gia bảo mật phân tán WebRTC mong muốn kết nối.',
      timestamp: 'Hôm qua',
      read: false,
    },
    {
      id: 'notif-4',
      type: 'system',
      title: 'Tái tạo khóa mã hóa Double Ratchet hoàn tất',
      content: 'Phiên kết nối P2P của bạn đã được làm mới với khóa Ed25519 mới.',
      timestamp: '2 ngày trước',
      read: true,
    },
  ]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative w-full max-w-[400px] h-full bg-surface border-l border-border z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-text-primary">Thông báo</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-primary/15 text-primary border border-primary/30">
                {unreadCount} mới
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded"
              >
                Đọc tất cả
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-bright transition-colors"
              title="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-2.5 border-b border-border flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-text-primary text-background font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('mention')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'mention'
                ? 'bg-text-primary text-background font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Nhắc tên
          </button>
          <button
            onClick={() => setFilter('call')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'call'
                ? 'bg-text-primary text-background font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Cuộc gọi
          </button>
          <button
            onClick={() => setFilter('invite')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'invite'
                ? 'bg-text-primary text-background font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Lời mời
          </button>
        </div>

        {/* Notification Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-xs">
              Không có thông báo nào trong mục này.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => markItemAsRead(item.id)}
                className={`p-4 hover:bg-surface-bright transition-colors cursor-pointer group relative ${
                  !item.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Indicator / Icon */}
                  <div className="relative shrink-0">
                    {item.type === 'call' ? (
                      <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center border border-error/20">
                        <span className="material-symbols-outlined text-base">phone_missed</span>
                      </div>
                    ) : item.type === 'system' ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-base">shield</span>
                      </div>
                    ) : (
                      <Avatar
                        src={item.sender?.avatar}
                        name={item.sender?.name || 'Aether'}
                        size="sm"
                      />
                    )}

                    {!item.read && (
                      <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface"></span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-1">
                      <span className="text-xs font-medium text-text-primary truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-text-secondary font-mono shrink-0">
                        {item.timestamp}
                      </span>
                    </div>

                    {item.type === 'mention' && item.content && (
                      <div className="bg-background border border-border rounded-lg p-2 mb-2 text-xs text-text-secondary font-mono leading-relaxed break-words">
                        {item.content}
                      </div>
                    )}

                    {item.type !== 'mention' && item.content && (
                      <p className="text-xs text-text-secondary mb-2 leading-relaxed">
                        {item.content}
                      </p>
                    )}

                    {/* Actions */}
                    {item.type === 'call' && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                          <span className="material-symbols-outlined text-xs">call</span>
                          Gọi lại
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};
export default NotificationsDrawer;
