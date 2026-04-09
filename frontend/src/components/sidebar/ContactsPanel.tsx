import { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { useCallStore } from '../../stores/callStore';
import { friendService } from '../../services/friendService';
import { conversationService } from '../../services/conversationService';
import type { User } from '../../types';
import { Avatar, Spinner } from './SidebarShared';
import { Search, Users, Phone, Video, UserPlus } from 'lucide-react';

// ─── Contacts Panel — sorted A-Z with letter dividers ─────────────────────────

export function ContactsPanel() {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { setSidebarView, setFriendSearchModalOpen } = useUIStore();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const conversations = useChatStore((s) => s.conversations);
  const addConversation = useChatStore((s) => s.addConversation);
  const { startOutgoingCall, startCallFn } = useCallStore();

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

  /** Open the private conversation with this friend (create if not exists) */
  const handleOpenChat = async (friend: User) => {
    const existing = conversations.find(
      (c) => c.type === 'private' && c.participants.some((p) => p._id === friend._id)
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
        addConversation(conversation);
        setActiveConversation(id);
        setSidebarView('messages');
        fetchConversations();
      }
    } catch {
      await fetchConversations();
      const found = useChatStore.getState().conversations.find(
        (c) => c.type === 'private' && c.participants.some((p) => p._id === friend._id)
      );
      if (found) {
        setActiveConversation(found._id);
        setSidebarView('messages');
      }
    } finally {
      setOpeningId(null);
    }
  };

  /** Initiate audio or video call */
  const handleCall = (friend: User, type: 'audio' | 'video') => {
    const remoteUser = {
      _id: friend._id,
      displayName: friend.displayName || friend.email || 'Người dùng',
      avatar: friend.avatar,
    };
    startOutgoingCall(type, remoteUser);
    startCallFn?.(friend._id, type);
  };

  // Filter → sort A-Z with Vietnamese locale
  const filtered = friends
    .filter((f) =>
      !query.trim() ||
      f.displayName?.toLowerCase().includes(query.toLowerCase()) ||
      f.email?.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) =>
      (a.displayName || a.email || '').localeCompare(
        b.displayName || b.email || '',
        'vi',
        { sensitivity: 'base' }
      )
    );

  // Group by normalized first letter
  const groups: { letter: string; items: User[] }[] = [];
  for (const friend of filtered) {
    const raw = (friend.displayName || friend.email || '?')[0].toUpperCase();
    const letter = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '#';
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) {
      last.items.push(friend);
    } else {
      groups.push({ letter, items: [friend] });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0068FF] transition-colors">
              <Search size={17} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm danh bạ…"
              className="block w-full pl-10 pr-3 py-2.5 bg-[#0068FF]/5 border-transparent focus:ring-1 focus:ring-[#0068FF] focus:bg-white rounded-lg text-sm transition-all outline-none placeholder:text-slate-400"
            />
          </div>
          {/* Add Friend */}
          <button
            title="Thêm bạn bè"
            onClick={() => setFriendSearchModalOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all shrink-0"
          >
            <UserPlus size={19} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && <Spinner />}

        {!loading && friends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0068FF]/10 flex items-center justify-center">
              <Users size={22} color="#0068FF" strokeWidth={2} />
            </div>
            <p className="text-sm text-slate-400">Chưa có bạn bè</p>
            <button onClick={() => setFriendSearchModalOpen(true)} className="text-xs text-[#0068FF] font-medium hover:underline">
              Thêm ai đó
            </button>
          </div>
        )}

        {!loading && filtered.length === 0 && friends.length > 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Không có kết quả cho "{query}"</p>
        )}

        {!loading && groups.map(({ letter, items }) => (
          <div key={letter}>
            {/* Letter divider */}
            <div className="px-4 py-1.5 bg-[#F0F2F5] sticky top-0 z-10">
              <span className="text-xs font-bold text-[#0068FF] tracking-widest">{letter}</span>
            </div>

            {items.map((friend) => {
              const isOpening = openingId === friend._id;
              const isOnline = (friend as any).status === 'online';
              return (
                <button
                  key={friend._id}
                  onClick={() => handleOpenChat(friend)}
                  disabled={isOpening}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F5F7FA] active:bg-[#EEF3FF] transition-colors group disabled:opacity-60"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar src={friend.avatar} name={friend.displayName || friend.email} />
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {friend.displayName || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {isOpening ? 'Đang mở…' : isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                    </p>
                  </div>

                  {/* Call action buttons — stop event propagation so card click doesn't fire */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Audio call */}
                    <span
                      role="button"
                      title="Gọi thoại"
                      onClick={(e) => { e.stopPropagation(); handleCall(friend, 'audio'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-colors cursor-pointer"
                    >
                      <Phone size={16} strokeLinecap="round" strokeLinejoin="round" />
                    </span>

                    {/* Video call */}
                    <span
                      role="button"
                      title="Gọi video"
                      onClick={(e) => { e.stopPropagation(); handleCall(friend, 'video'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-colors cursor-pointer"
                    >
                      <Video size={16} strokeLinecap="round" strokeLinejoin="round" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
