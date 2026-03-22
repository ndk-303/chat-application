import { useEffect, useState, useCallback, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useFriendStore } from '../../stores/friendStore';
import { ConversationItem } from './ConversationItem';
import { userService } from '../../services/userService';
import { friendService } from '../../services/friendService';
import { conversationService } from '../../services/conversationService';
import type { Conversation, User, FriendRequest } from '../../types';

// ─── Avatar helper ────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 10 }: { src?: string | null; name?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full bg-[#0068FF]/10 flex items-center justify-center text-[#0068FF] font-semibold text-sm shrink-0 overflow-hidden`;
  return (
    <div className={cls}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : (name?.[0] ?? '?').toUpperCase()
      }
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <svg className="animate-spin text-[#0068FF]" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Friend Requests Tab ──────────────────────────────────────────────────────

function FriendRequestsTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  // Use friendStore so socket events auto-update this list
  const receivedRequests = useFriendStore((s) => s.receivedRequests);
  const fetchReceivedRequests = useFriendStore((s) => s.fetchReceivedRequests);
  const isLoading = useFriendStore((s) => s.isLoadingRequests);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchReceivedRequests(); }, [fetchReceivedRequests]);
  useEffect(() => { onCountChange(receivedRequests.length); }, [receivedRequests.length, onCountChange]);

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => { const n = new Set(prev); busy ? n.add(id) : n.delete(id); return n; });

  const handleAccept = async (req: FriendRequest) => {
    setBusy(req._id, true);
    try {
      await friendService.acceptFriendRequest(req._id);
      useFriendStore.setState((state) => ({
        receivedRequests: state.receivedRequests.filter((r) => r._id !== req._id),
      }));
      useFriendStore.getState().fetchFriends();
    } finally { setBusy(req._id, false); }
  };

  const handleReject = async (req: FriendRequest) => {
    setBusy(req._id, true);
    try {
      await friendService.rejectFriendRequest(req._id);
      useFriendStore.setState((state) => ({
        receivedRequests: state.receivedRequests.filter((r) => r._id !== req._id),
      }));
    } finally { setBusy(req._id, false); }
  };

  if (isLoading) return <Spinner />;

  if (receivedRequests.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#0068FF]/10 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0068FF" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      </div>
      <p className="text-sm text-slate-400">Không có lời mời kết bạn nào</p>
    </div>
  );

  return (
    <div className="py-2">
      {receivedRequests.map((req) => {
        const sender = req.senderId;
        const busy = busyIds.has(req._id);
        return (
          <div key={req._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
            <Avatar src={sender.avatar} name={sender.displayName || sender.email} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{sender.displayName || 'Không rõ'}</p>
              <p className="text-xs text-slate-400 truncate">{sender.email}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                disabled={busy}
                onClick={() => handleAccept(req)}
                className="px-2.5 py-1.5 rounded-lg bg-[#0068FF] text-white text-xs font-semibold hover:bg-[#0052CC] transition-colors disabled:opacity-50"
              >
                Chấp nhận
              </button>
              <button
                disabled={busy}
                onClick={() => handleReject(req)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Friend Search Tab ────────────────────────────────────────────────────────

function FriendSearchTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await userService.searchUsers(q);
      setResults(data.users ?? data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleAdd = async (userId: string) => {
    try {
      await friendService.sendFriendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col">
      {/* Search input */}
      <div className="p-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0068FF] transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            className="block w-full pl-10 pr-3 py-2.5 bg-[#0068FF]/5 border-transparent focus:ring-1 focus:ring-[#0068FF] focus:bg-white rounded-lg text-sm transition-all outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && !query.trim() && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0068FF]/10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0068FF" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">Tìm kiếm mọi người để kết bạn</p>
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-8">Không tìm thấy người dùng</p>
      )}

      {results.map((u) => (
        <div key={u._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
          <Avatar src={u.avatar} name={u.displayName || u.email} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{u.displayName || 'Không rõ'}</p>
            <p className="text-xs text-slate-400 truncate">{u.email}</p>
          </div>
          {sentIds.has(u._id) ? (
            <span className="text-xs text-green-600 font-medium shrink-0">Đã gửi ✓</span>
          ) : (
            <button
              onClick={() => handleAdd(u._id)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0068FF] text-white text-xs font-semibold hover:bg-[#0052CC] transition-colors"
            >
              Thêm bạn
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Contacts Panel ──────────────────────────────────────────────────────────

function ContactsPanel() {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [unfriendingId, setUnfriendingId] = useState<string | null>(null);
  const { setSidebarView } = useUIStore();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await friendService.getFriends();
        setFriends(data.friends ?? data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const conversations = useChatStore((s) => s.conversations);
  const addConversation = useChatStore((s) => s.addConversation);

  const handleChat = async (friend: User) => {
    // Check if private conversation with this friend already exists in list
    const existing = conversations.find(
      (c) =>
        c.type === 'private' &&
        c.participants.some((p) => p._id === friend._id)
    );
    if (existing) {
      setActiveConversation(existing._id);
      setSidebarView('messages');
      return;
    }

    setOpeningId(friend._id);
    try {
      const resp = await conversationService.createPrivateConversation(friend._id);
      const conversation = resp.conversation ?? resp;
      const id = conversation?._id;
      if (id) {
        // Add to store immediately so ChatWindow can find it
        addConversation(conversation);
        setActiveConversation(id);
        setSidebarView('messages');
        // Then also refresh full list in background
        fetchConversations();
      }
    } catch (e: any) {
      // If already exists, re-fetch and find it
      await fetchConversations();
      const found = useChatStore.getState().conversations.find(
        (c) =>
          c.type === 'private' &&
          c.participants.some((p) => p._id === friend._id)
      );
      if (found) {
        setActiveConversation(found._id);
        setSidebarView('messages');
      }
    } finally {
      setOpeningId(null);
    }
  };

  const handleUnfriend = async (friend: User) => {
    if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${friend.displayName}?`)) return;
    setUnfriendingId(friend._id);
    try {
      await friendService.unfriend(friend._id);
      setFriends((prev) => prev.filter((f) => f._id !== friend._id));
    } catch {
      // silent
    } finally {
      setUnfriendingId(null);
    }
  };

  const filtered = friends.filter((f) =>
    !query.trim() ||
    f.displayName?.toLowerCase().includes(query.toLowerCase()) ||
    f.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Danh bạ</h2>
          {!loading && (
            <span className="text-xs text-slate-400 font-medium">{friends.length} bạn bè</span>
          )}
        </div>
        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0068FF] transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm danh bạ…"
            className="block w-full pl-10 pr-3 py-2.5 bg-[#0068FF]/5 border-transparent focus:ring-1 focus:ring-[#0068FF] focus:bg-white rounded-lg text-sm transition-all outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && <Spinner />}

        {!loading && friends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0068FF]/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0068FF" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">Chưa có bạn bè</p>
            <button
              onClick={() => setSidebarView('friends')}
              className="text-xs text-[#0068FF] font-medium hover:underline"
            >
              Thêm ai đó
            </button>
          </div>
        )}

        {!loading && filtered.length === 0 && friends.length > 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Không có kết quả cho "{query}"</p>
        )}

        {!loading && filtered.map((friend) => {
          const isOpening = openingId === friend._id;
          const isUnfriending = unfriendingId === friend._id;
          const isOnline = (friend as any).status === 'online';
          return (
            <div
              key={friend._id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
            >
              {/* Avatar with online dot */}
              <div className="relative shrink-0">
                <Avatar src={friend.avatar} name={friend.displayName || friend.email} />
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{friend.displayName || 'Unknown'}</p>
                <p className="text-xs text-slate-400 truncate">{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Chat */}
                <button
                  onClick={() => handleChat(friend)}
                  disabled={!!openingId || isUnfriending}
                  title="Nhắn tin"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-colors disabled:opacity-50"
                >
                  {isOpening ? (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                </button>
                {/* Unfriend */}
                <button
                  onClick={() => handleUnfriend(friend)}
                  disabled={!!openingId || isUnfriending}
                  title="Hủy kết bạn"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isUnfriending ? (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Friend Panel (tabbed) ────────────────────────────────────────────────────

function FriendSearchPanel() {
  const [activeTab, setActiveTab] = useState<'requests' | 'search'>('requests');
  const [requestCount, setRequestCount] = useState(0);

  const tabs = [
    { key: 'requests' as const, label: 'Lời mời', badge: requestCount },
    { key: 'search' as const, label: 'Tìm kiếm' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header + sub-tabs */}
      <div className="px-4 pt-4 pb-0 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Bạn bè</h2>
        <div className="flex gap-4">
          {tabs.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${activeTab === key
                ? 'border-[#0068FF] text-[#0068FF] font-semibold'
                : 'border-transparent text-slate-500 hover:text-[#0068FF]'
                }`}
            >
              {label}
              {badge != null && badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'requests'
          ? <FriendRequestsTab onCountChange={setRequestCount} />
          : <FriendSearchTab />
        }
      </div>
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [allFriends, setAllFriends] = useState<User[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  // Load all friends once on mount, sort A-Z
  useEffect(() => {
    (async () => {
      setLoadingFriends(true);
      try {
        const data = await friendService.getFriends();
        const list: User[] = data.friends ?? data;
        list.sort((a, b) =>
          (a.displayName || a.email).localeCompare(b.displayName || b.email)
        );
        setAllFriends(list);
      } finally {
        setLoadingFriends(false);
      }
    })();
  }, []);

  // IntersectionObserver to load more when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount((n) => n + PAGE_SIZE); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingFriends]);

  // Reset pagination on search
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query]);

  const filtered = allFriends.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const toggleUser = (u: User) =>
    setSelected((prev) =>
      prev.find((s) => s._id === u._id) ? prev.filter((s) => s._id !== u._id) : [...prev, u]
    );

  // Need >= 2 selected → total 3 (admin + 2)
  const canCreate = name.trim().length > 0 && selected.length >= 2 && !creating;

  const handleCreate = async () => {
    if (!name.trim()) { setError('Vui lòng nhập tên nhóm'); return; }
    if (selected.length < 2) { setError('Cần ít nhất 2 thành viên (tổng 3 người gồm bạn)'); return; }
    setCreating(true);
    setError(null);
    try {
      const resp = await conversationService.createGroupConversation(name.trim(), selected.map((u) => u._id));
      await fetchConversations();
      const id = resp._id ?? resp.conversation?._id;
      if (id) setActiveConversation(id);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Tạo nhóm thất bại');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tạo Nhóm Chat</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-4">
            {/* Group name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tên nhóm</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nhóm duyệt phim, Team Alpha…"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0068FF] focus:ring-1 focus:ring-[#0068FF] rounded-xl text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((u) => (
                  <span key={u._id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0068FF]/10 text-[#0068FF] rounded-full text-xs font-medium">
                    {u.displayName || u.email}
                    <button onClick={() => toggleUser(u)} className="hover:text-red-500 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Member picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Thành viên</label>
                <span className={`text-xs font-semibold ${selected.length >= 2 ? 'text-green-600' : 'text-slate-400'}`}>
                  {selected.length}/2 tối thiểu
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm bạn bè…"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0068FF] focus:ring-1 focus:ring-[#0068FF] rounded-xl text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Friend list */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                {loadingFriends ? (
                  <div className="py-6 flex justify-center"><Spinner /></div>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">
                    {query ? 'Không tìm thấy bạn bè nào' : 'Bạn chưa có bạn bè'}
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto no-scrollbar">
                    {visible.map((u) => {
                      const isSelected = !!selected.find((s) => s._id === u._id);
                      return (
                        <button
                          key={u._id}
                          onClick={() => toggleUser(u)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isSelected ? 'bg-[#EEF5FF]' : 'hover:bg-slate-50'
                            }`}
                        >
                          <div className="relative shrink-0">
                            <Avatar src={u.avatar} name={u.displayName || u.email} size={8} />
                            {(u as any).status === 'online' && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{u.displayName || u.email}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                          {/* Circular checkbox */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-[#0068FF] border-[#0068FF]' : 'border-slate-300'
                            }`}>
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {/* Infinite scroll sentinel */}
                    {hasMore && <div ref={sentinelRef} className="h-4" />}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            title={selected.length < 2 ? 'Cần chọn ít nhất 2 thành viên' : ''}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${canCreate ? 'bg-[#0068FF] hover:bg-[#0052CC]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {creating ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Đang tạo…
              </>
            ) : (
              <>
                Tạo nhóm
                {selected.length >= 2 && (
                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{selected.length + 1} người</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const activeId = useChatStore((s) => s.activeConversationId);
  const { sidebarTab, setSidebarTab, sidebarView, isCreateGroupModalOpen, setCreateGroupModalOpen } = useUIStore();

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const filtered: Conversation[] = (() => {
    switch (sidebarTab) {
      case 'groups': return conversations.filter((c) => c.type === 'group');
      case 'unread': return conversations.filter((c) => (c.unreadCount ?? 0) > 0);
      default: return conversations;
    }
  })();

  const getName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Nhóm chat';
    return conv.participants.find((p) => p._id !== user?._id)?.displayName || 'Chat';
  };

  const getAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.avatar || null;
    return conv.participants.find((p) => p._id !== user?._id)?.avatar || null;
  };

  const getOnline = (conv: Conversation) => {
    if (conv.type === 'group') return false;
    return conv.participants.find((p) => p._id !== user?._id)?.status === 'online';
  };

  return (
    <>
      <aside className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0">
        {sidebarView === 'friends' ? (
          <FriendSearchPanel />
        ) : sidebarView === 'contacts' ? (
          <ContactsPanel />
        ) : (
          <>
            {/* Header */}
            <div className="p-4 space-y-4">
              <h1 className="text-xl font-bold text-slate-900">Tin nhắn</h1>

              {/* Search */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0068FF] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm cuộc trò chuyện"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0068FF]/5 border-transparent focus:ring-1 focus:ring-[#0068FF] focus:bg-white rounded-lg text-sm transition-all outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E7EB] gap-6">
                {(['all', 'unread', 'groups'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`pb-3 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${sidebarTab === tab
                      ? 'border-[#0068FF] text-[#0068FF] font-semibold'
                      : 'border-transparent text-slate-500 hover:text-[#0068FF]'
                      }`}
                  >
                    {tab === 'all' ? 'Tất cả' : tab === 'unread' ? 'Chưa đọc' : 'Nhóm'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 px-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0068FF]/10 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0068FF" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 text-center">
                    {sidebarTab === 'unread' ? 'Không có tin nhắn chưa đọc' : 'Chưa có cuộc trò chuyện nào'}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {filtered.map((conv) => (
                    <ConversationItem
                      key={conv._id}
                      conversation={conv}
                      name={getName(conv)}
                      avatar={getAvatar(conv)}
                      isOnline={getOnline(conv)}
                      isActive={activeId === conv._id}
                      onClick={() => setActiveConversation(conv._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <CreateGroupModal onClose={() => setCreateGroupModalOpen(false)} />
      )}
    </>
  );
}
