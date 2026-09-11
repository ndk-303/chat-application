'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Conversation } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import NewDirectChatModal from '../../../components/chat/NewDirectChatModal';
import NewGroupModal from '../../../components/chat/NewGroupModal';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const params = useParams();
  const router = useRouter();
  const activeChatId = params?.chatId as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations || []);
    } catch (err) {
      console.error('[ChatLayout] Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime Socket listeners for conversation updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === msg.conversationId);
        if (index === -1) {
          // New conversation for this user, refresh list
          fetchConversations();
          return prev;
        }
        const updated = [...prev];
        const target = { ...updated[index] };
        target.lastMessageId = msg;
        target.lastMessageAt = msg.createdAt;
        if (activeChatId !== msg.conversationId && msg.senderId?._id !== user?._id) {
          target.unreadCount = (target.unreadCount || 0) + 1;
        }
        // Move updated conversation to top
        updated.splice(index, 1);
        return [target, ...updated];
      });
    };

    const handleConversationUpdated = (data: any) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === data.conversationId);
        if (index === -1) return prev;
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessageId: data.lastMessage,
          lastMessageAt: data.lastMessageAt,
        };
        const [item] = updated.splice(index, 1);
        return [item, ...updated];
      });
    };

    const handlePrivateCreated = (conv: any) => {
      setConversations((prev) => [conv, ...prev.filter((c) => c._id !== conv._id)]);
    };

    const handleConversationSeen = (data: { conversationId: string; userId: string }) => {
      if (data.userId === user?._id) {
        setConversations((prev) =>
          prev.map((c) => (c._id === data.conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('private_conversation_created', handlePrivateCreated);
    socket.on('conversation_seen', handleConversationSeen);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('private_conversation_created', handlePrivateCreated);
      socket.off('conversation_seen', handleConversationSeen);
    };
  }, [socket, activeChatId, user, fetchConversations]);

  // Helper to extract partner details for private chats
  const getConversationDetails = (conv: Conversation) => {
    if (conv.type === 'group') {
      return {
        title: conv.name || 'Group Chat',
        avatar: conv.avatar,
        status: undefined,
        isGroup: true,
      };
    }
    const partner = conv.participants?.find((p) => p._id !== user?._id);
    return {
      title: partner?.displayName || 'Direct Chat',
      avatar: partner?.avatar,
      status: partner?.status || 'offline',
      isGroup: false,
    };
  };

  // Helper for last message preview
  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessageId) return 'No messages yet';
    const last = conv.lastMessageId;
    if (last.type === 'call') {
      return last.callMeta?.callType === 'video' ? '📹 Video Call' : '📞 Voice Call';
    }
    if (last.files && last.files.length > 0) {
      return `📎 ${last.files[0].originalName || 'Attachment'}`;
    }
    return last.content || 'Message';
  };

  // Format timestamp (e.g. 14:32 or Yesterday)
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter((c) => {
    const details = getConversationDetails(c);
    const matchesSearch =
      details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessageId?.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'unread') return (c.unreadCount || 0) > 0;
    if (filter === 'groups') return c.type === 'group';
    return true;
  });

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Middle Pane: Conversations Sidebar (320px) */}
      <aside className="w-80 h-full bg-background border-r border-border flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">Chats</h2>
              <span className="text-[11px] font-mono text-text-secondary bg-surface px-2 py-0.5 rounded-full border border-border">
                {conversations.length}
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-sm bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-primary transition-colors"
                title="New Chat"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-surface border border-border rounded-md shadow-xl py-1 z-30 animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsNewDirectModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-primary">person_add</span>
                    <span>Direct Message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsNewGroupModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-primary">group_add</span>
                    <span>New Group</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-text-secondary text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-surface border border-border rounded-sm pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            {(['all', 'unread', 'groups'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 text-xs rounded-sm capitalize font-medium transition-colors ${
                  filter === tab
                    ? 'bg-surface text-primary border border-border shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/20 p-2 space-y-0.5">
          {loading ? (
            <div className="py-12 text-center text-xs text-text-secondary">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary px-4">
              No conversations found.
              <button
                type="button"
                onClick={() => setIsNewDirectModalOpen(true)}
                className="text-primary block mx-auto mt-2 hover:underline"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const details = getConversationDetails(conv);
              const isActive = activeChatId === conv._id;
              const unread = conv.unreadCount || 0;

              return (
                <Link
                  key={conv._id}
                  href={`/chat/${conv._id}`}
                  className={`flex items-center gap-3 p-2.5 rounded-sm transition-colors block ${
                    isActive
                      ? 'bg-surface border border-border'
                      : 'hover:bg-surface/50 text-text-secondary'
                  }`}
                >
                  <Avatar
                    name={details.title}
                    src={details.avatar}
                    size="md"
                    status={details.status}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3
                        className={`text-xs font-semibold truncate ${
                          isActive || unread > 0 ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {details.title}
                      </h3>
                      <span className="text-[10px] font-mono text-text-secondary/70 shrink-0">
                        {formatTimestamp(conv.lastMessageAt || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-text-secondary truncate pr-2">
                        {getLastMessagePreview(conv)}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Content Pane (Chat View or Empty State) */}
      <main className="flex-1 h-full overflow-hidden relative">{children}</main>

      {/* Modals */}
      <NewDirectChatModal
        isOpen={isNewDirectModalOpen}
        onClose={() => setIsNewDirectModalOpen(false)}
      />
      <NewGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
      />
    </div>
  );
}
