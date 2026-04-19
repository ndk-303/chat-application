import { useState, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { conversationService } from '../../services/conversationService';
import { friendService } from '../../services/friendService';
import { toast } from 'sonner';
import type { User } from '../../types';
import { X, Loader2 } from 'lucide-react';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function PanelAvatar({ src, name }: { src?: string | null; name: string }) {
  if (src) return <img src={src} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  return (
    <div className="w-8 h-8 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-xs font-bold">
      {getInitials(name)}
    </div>
  );
}

interface AddMemberModalProps {
  conversationId: string;
  existingIds: string[];
  onClose: () => void;
}

export function AddMemberModal({ conversationId, existingIds, onClose }: AddMemberModalProps) {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await friendService.getFriends();
        const list: User[] = data.friends ?? data;
        list.sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
        setFriends(list);
      } finally { setLoading(false); }
    })();
  }, []);

  const existingSet = new Set(existingIds);
  const filtered = friends.filter((u) => {
    if (existingSet.has(u._id)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const handleAdd = async (memberId: string) => {
    setAdding(memberId);
    try {
      await conversationService.addMember(conversationId, memberId);
      existingSet.add(memberId);
      await fetchConversations();
      setFriends((prev) => prev.filter((f) => f._id !== memberId));
      toast.success('Đã thêm thành viên');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Thêm thất bại');
    } finally { setAdding(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[0.25rem] shadow-2xl w-full max-w-sm flex flex-col max-h-[70vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold text-slate-900">Thêm Thành Viên</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-[0.25rem] flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 pb-3">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm bạn bè…" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[0.25rem] text-sm outline-none focus:border-[#0068FF] placeholder:text-gray-400" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-[#0068FF]" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Không có bạn bè nào để thêm</p>
          ) : (
            filtered.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-3 py-2 rounded-[0.25rem] hover:bg-gray-50">
                <PanelAvatar src={u.avatar} name={u.displayName || u.email} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.displayName || u.email}</p>
                </div>
                <button
                  onClick={() => handleAdd(u._id)}
                  disabled={adding === u._id}
                  className="px-3 py-1 rounded-[0.25rem] bg-[#0068FF] text-white text-xs font-medium hover:bg-[#0052CC] transition-colors disabled:opacity-50"
                >
                  {adding === u._id ? '...' : 'Thêm'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
