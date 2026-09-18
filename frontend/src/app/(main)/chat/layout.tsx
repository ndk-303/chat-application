'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Conversation } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import Avatar from '../../../components/ui/Avatar';
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

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === msg.conversationId);
        if (index === -1) {
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

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessageId) return 'No messages yet';
    const last = conv.lastMessageId;
    if (last.type === 'call') {
      return last.callMeta?.callType === 'video' ? 'Video call' : 'Voice call';
    }
    if (last.files && last.files.length > 0) {
      return `Attachment: ${last.files[0].originalName || 'file'}`;
    }
    return last.content || 'Message';
  };

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

  const filterLabels: Record<typeof filter, string> = {
    all: 'All',
    unread: 'Unread',
    groups: 'Groups',
  };

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/*
        Conversations sidebar — narrowed from 320px → 288px (w-72)
        to give more breathing room to the chat area
      */}
      <aside className="w-72 h-full bg-background border-r border-border flex flex-col flex-shrink-0">

        {/* Sidebar header */}
        <div className="px-3 pt-3 pb-2 border-b border-border/60">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              {/* FIX: "Chats" h2 uses text-h2 token, not ad-hoc utility */}
              <h2 className="text-h2 font-semibold text-text-primary">Chats</h2>
              {/* Conversation count — Geist Sans, not font-mono */}
              <span className="text-micro text-text-secondary bg-surface-2 px-2 py-0.5 rounded-xs border border-border">
                {conversations.length}
              </span>
            </div>

            {/* New chat menu */}
            <div className="relative">
              <button
                type="button"
                id="new-chat-trigger"
                onClick={() => setMenuOpen(!menuOpen)}
                className={[
                  'w-8 h-8 rounded-sm flex items-center justify-center',
                  'text-text-secondary hover:text-text-primary',
                  'bg-surface-2 hover:bg-surface-3 border border-border',
                  'transition-colors duration-150 active:scale-95',
                ].join(' ')}
                aria-label="New chat"
                aria-expanded={menuOpen}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className={[
                    'absolute right-0 mt-1.5 w-48 z-30',
                    'bg-surface-2 border border-border rounded-md',
                    'shadow-elev-2 py-1',
                    'animate-slide-down',
                  ].join(' ')}
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); setIsNewDirectModalOpen(true); }}
                    className="w-full px-3 py-2 text-left text-ui text-text-primary hover:bg-surface-3 flex items-center gap-2.5 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-primary shrink-0">
                      <circle cx="8" cy="7" r="3" />
                      <path d="M2 17c0-3.31 2.69-6 6-6" />
                      <path d="M16 11v6M13 14h6" />
                    </svg>
                    <span>Direct message</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); setIsNewGroupModalOpen(true); }}
                    className="w-full px-3 py-2 text-left text-ui text-text-primary hover:bg-surface-3 flex items-center gap-2.5 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-primary shrink-0">
                      <circle cx="6" cy="7" r="2.5" />
                      <circle cx="13" cy="7" r="2.5" />
                      <path d="M1 17c0-2.76 2.24-5 5-5h4c2.76 0 5 2.24 5 5" />
                      <path d="M15 11c1.66 0 3 1.34 3 3v2" />
                    </svg>
                    <span>New group</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5l3 3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              aria-label="Search conversations"
              className={[
                'w-full bg-surface-2 border border-border rounded-sm',
                'pl-8 pr-3 py-1.5 text-caption text-text-primary',
                'placeholder:text-text-secondary',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                'transition-colors duration-150',
              ].join(' ')}
            />
          </div>

          {/* Filter pills — proper active state differentiation */}
          <div className="flex items-center gap-1" role="tablist">
            {(['all', 'unread', 'groups'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={filter === tab}
                onClick={() => setFilter(tab)}
                className={[
                  'px-2.5 py-1 text-micro rounded-xs font-medium transition-colors duration-150',
                  filter === tab
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                ].join(' ')}
              >
                {filterLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map((delay, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-[dot-bounce_1s_ease-in-out_infinite]"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <p className="text-caption text-text-secondary">Loading…</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="text-caption text-text-secondary mb-2">No conversations found.</p>
              <button
                type="button"
                onClick={() => setIsNewDirectModalOpen(true)}
                className="text-caption text-primary hover:underline underline-offset-2"
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
                  className={[
                    'flex items-center gap-3 px-2.5 py-2.5 rounded-sm transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    isActive
                      // FIX: was hardcoded #1E222A — now uses surface-2 token + left accent
                      ? 'bg-surface-2 border-l-2 border-primary text-text-primary'
                      : 'hover:bg-surface-2/70 text-text-secondary border-l-2 border-transparent',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Avatar
                    name={details.title}
                    src={details.avatar}
                    size="md"
                    status={details.status as any}
                    isGroup={details.isGroup}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      {/*
                        FIX: name was text-xs (12px) — now text-ui (13px) font-semibold
                        Creates proper hierarchy between name and preview
                      */}
                      <h3
                        className={[
                          'text-ui font-semibold truncate',
                          isActive || unread > 0 ? 'text-text-primary' : 'text-text-secondary',
                        ].join(' ')}
                      >
                        {details.title}
                      </h3>
                      {/*
                        FIX: timestamp was font-mono 10px — now caption (12px) Geist Sans
                        Timestamps are not technical data — no mono needed
                      */}
                      <span className="text-micro text-text-secondary shrink-0 ml-2">
                        {formatTimestamp(conv.lastMessageAt || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-micro text-text-secondary truncate pr-2">
                        {getLastMessagePreview(conv)}
                      </p>
                      {unread > 0 && (
                        /*
                          Unread badge — accent color with rounded-full
                          FIX: was bg-primary but primary was wrong color;
                          now correctly resolves to #00A67E via the fixed token
                        */
                        <span className="shrink-0 bg-primary text-white text-micro font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                          {unread > 99 ? '99+' : unread}
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

      {/* Right content pane */}
      <main className="flex-1 h-full overflow-hidden relative" id="chat-content">
        {children}
      </main>

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
