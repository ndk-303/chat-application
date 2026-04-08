import { useEffect, useState, useRef, useMemo } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { friendService } from '../../services/friendService';
import { conversationService } from '../../services/conversationService';
import type { User } from '../../types';
import { Avatar, Spinner } from './SidebarShared';
import { X, Search, Check, Loader2 } from 'lucide-react';

const PAGE_SIZE = 15;

interface CreateGroupModalProps {
  onClose: () => void;
}

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
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
  const conversations = useChatStore((s) => s.conversations);
  const currentUserId = useAuthStore((s) => s.user?._id);

  // Tính set các friendId đã có nhóm chung với user hiện tại
  const inGroupFriendIds = useMemo(() => {
    const ids = new Set<string>();
    conversations
      .filter((c) => c.type === 'group')
      .forEach((c) => {
        c.participants.forEach((p) => {
          if (p._id !== currentUserId) ids.add(p._id);
        });
      });
    return ids;
  }, [conversations, currentUserId]);

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

  // Infinite scroll sentinel
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
          <h2 className="text-lg font-bold text-slate-900">Tạo Nhóm Chat</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
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
                    <X size={10} strokeWidth={2.5} />
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
                  <Search size={15} />
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
                          onClick={() => !inGroupFriendIds.has(u._id) && toggleUser(u)}
                          disabled={inGroupFriendIds.has(u._id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                            ${inGroupFriendIds.has(u._id)
                              ? 'opacity-50 cursor-default'
                              : isSelected ? 'bg-[#EEF5FF]' : 'hover:bg-slate-50'
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
                            <p className="text-xs text-slate-400 truncate">
                              {inGroupFriendIds.has(u._id) ? 'Đã có nhóm chung' : u.email}
                            </p>
                          </div>
                          {/* Không hiển thị checkbox nếu đã có nhóm chung */}
                          {!inGroupFriendIds.has(u._id) && (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-[#0068FF] border-[#0068FF]' : 'border-slate-300'}`}>
                              {isSelected && <Check size={10} strokeWidth={3} color="white" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
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
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${canCreate ? 'bg-[#0068FF] hover:bg-[#0052CC]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang tạo…
              </>
            ) : (
              <>Tạo nhóm</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
