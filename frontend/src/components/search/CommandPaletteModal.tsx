'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'conversations' | 'contacts' | 'commands'>('all');
  const [conversations, setConversations] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);

      // Load data
      api.getConversations(1, 20).then((res) => setConversations(res.conversations || []));
      api.getFriends().then((res) => setFriends(res.friends || []));
    }
  }, [isOpen]);

  // Built-in Commands
  const commands = useMemo(
    () => [
      {
        id: 'cmd-chats',
        title: 'Đi đến Trò chuyện (Chats)',
        subtitle: 'Mở danh sách hội thoại gần nhất',
        icon: 'chat',
        action: () => router.push('/chat'),
      },
      {
        id: 'cmd-calls',
        title: 'Lịch sử cuộc gọi (Calls)',
        subtitle: 'Xem nhật ký cuộc gọi thoại và video',
        icon: 'call',
        action: () => router.push('/calls/history'),
      },
      {
        id: 'cmd-contacts',
        title: 'Danh bạ & Bạn bè',
        subtitle: 'Xem danh sách bạn bè và lời mời',
        icon: 'group',
        action: () => router.push('/contacts'),
      },
      {
        id: 'cmd-profile',
        title: 'Hồ sơ cá nhân & E2EE',
        subtitle: 'Xem khóa định danh mã hóa và thông tin',
        icon: 'person',
        action: () => router.push('/profile'),
      },
      {
        id: 'cmd-settings',
        title: 'Cài đặt hệ thống',
        subtitle: 'Giao diện, âm thanh WebRTC và quyền riêng tư',
        icon: 'settings',
        action: () => router.push('/settings'),
      },
    ],
    [router]
  );

  // Filtered lists
  const filteredConversations = useMemo(() => {
    if (filter === 'contacts' || filter === 'commands') return [];
    if (!query.trim()) return conversations.slice(0, 4);
    const q = query.toLowerCase();
    return conversations.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.participants?.some((p: any) => p.displayName?.toLowerCase().includes(q))
    );
  }, [conversations, query, filter]);

  const filteredFriends = useMemo(() => {
    if (filter === 'conversations' || filter === 'commands') return [];
    if (!query.trim()) return friends.slice(0, 4);
    const q = query.toLowerCase();
    return friends.filter(
      (f) =>
        f.displayName?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q)
    );
  }, [friends, query, filter]);

  const filteredCommands = useMemo(() => {
    if (filter === 'conversations' || filter === 'contacts') return [];
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q)
    );
  }, [commands, query, filter]);

  const totalResults =
    filteredConversations.length + filteredFriends.length + filteredCommands.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-20 sm:pt-28 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Panel */}
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-surface">
          <span className="material-symbols-outlined text-text-secondary text-xl">search</span>
          <input
            type="text"
            autoFocus
            placeholder="Tìm cuộc trò chuyện, bạn bè hoặc lệnh hệ thống..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-text-secondary bg-surface-container border border-border rounded">
            Esc
          </kbd>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-border flex items-center gap-1.5 bg-surface-container/30 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Tất cả ({totalResults})
          </button>
          <button
            onClick={() => setFilter('conversations')}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'conversations'
                ? 'bg-primary text-white font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Hội thoại ({filteredConversations.length})
          </button>
          <button
            onClick={() => setFilter('contacts')}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'contacts'
                ? 'bg-primary text-white font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Bạn bè ({filteredFriends.length})
          </button>
          <button
            onClick={() => setFilter('commands')}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'commands'
                ? 'bg-primary text-white font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-bright'
            }`}
          >
            Lệnh nhanh ({filteredCommands.length})
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 divide-y divide-border/40">
          {totalResults === 0 ? (
            <div className="p-8 text-center text-xs text-text-secondary">
              Không tìm thấy kết quả phù hợp với "{query}".
            </div>
          ) : (
            <>
              {/* Commands */}
              {filteredCommands.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-secondary font-mono px-3">
                    Lệnh điều hướng
                  </span>
                  {filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        onClose();
                        cmd.action();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-lg">{cmd.icon}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                            {cmd.title}
                          </p>
                          <p className="text-[10px] text-text-secondary">{cmd.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        ↵ Mở
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Conversations */}
              {filteredConversations.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-secondary font-mono px-3">
                    Cuộc trò chuyện
                  </span>
                  {filteredConversations.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        onClose();
                        router.push(`/chat/${c._id}`);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-xs">
                          {c.type === 'group' ? '#' : '@'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                            {c.name || 'Trò chuyện'}
                          </p>
                          <p className="text-[10px] text-text-secondary">
                            {c.type === 'group' ? 'Nhóm trò chuyện' : 'Tin nhắn riêng'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        ↵ Vào chat
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Contacts */}
              {filteredFriends.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-secondary font-mono px-3">
                    Bạn bè & Liên hệ
                  </span>
                  {filteredFriends.map((f) => (
                    <button
                      key={f._id}
                      onClick={async () => {
                        onClose();
                        try {
                          const res = await api.createPrivateConversation(f._id);
                          router.push(`/chat/${res.conversation._id}`);
                        } catch {
                          router.push('/contacts');
                        }
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-border flex items-center justify-center text-xs font-semibold text-primary">
                          {f.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                            {f.displayName}
                          </p>
                          <p className="text-[10px] text-text-secondary">{f.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        ↵ Nhắn tin
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-border bg-surface/80 flex items-center justify-between text-[11px] font-mono text-text-secondary">
          <span>Dùng phím ↑ ↓ để di chuyển, Enter để mở</span>
          <span>Aether QuickJump</span>
        </div>
      </div>
    </div>
  );
};
export default CommandPaletteModal;
