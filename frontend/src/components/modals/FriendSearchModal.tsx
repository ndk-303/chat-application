import { useEffect, useState, useCallback } from 'react';
import { useFriendStore } from '../../stores/friendStore';
import { useUIStore } from '../../stores/uiStore';
import { friendService } from '../../services/friendService';
import { userService } from '../../services/userService';
import type { User, FriendRequest } from '../../types';
import { Avatar, Spinner } from '../sidebar/SidebarShared';
import { UserCheck, Search, X } from 'lucide-react';

// ─── Friend Requests Tab ──────────────────────────────────────────────────────

function FriendRequestsTab({ onCountChange }: { onCountChange: (n: number) => void }) {
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
        <UserCheck size={22} color="#0068FF" strokeWidth={2} />
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
      <div className="p-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0068FF] transition-colors">
            <Search size={17} />
          </div>
          <input
            type="text"
            autoFocus
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
            <Search size={22} color="#0068FF" strokeWidth={2} />
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

// ─── Friend Search Modal ──────────────────────────────────────────────────────

export function FriendSearchModal() {
  const { isFriendSearchModalOpen, setFriendSearchModalOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'search'>('requests');
  const [requestCount, setRequestCount] = useState(0);

  if (!isFriendSearchModalOpen) return null;

  const tabs = [
    { key: 'requests' as const, label: 'Lời mời', badge: requestCount },
    { key: 'search' as const, label: 'Tìm kiếm' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setFriendSearchModalOpen(false)}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 pt-5 pb-0 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">Bạn bè</h2>
            <button
              onClick={() => setFriendSearchModalOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-5">
            {tabs.map(({ key, label, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                  activeTab === key
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'requests'
            ? <FriendRequestsTab onCountChange={setRequestCount} />
            : <FriendSearchTab />
          }
        </div>
      </div>
    </div>
  );
}
