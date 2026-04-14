import { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { useCallStore } from '../../stores/callStore';
import { useFriendStore } from '../../stores/friendStore';
import { conversationService } from '../../services/conversationService';
import type { User } from '../../types';
import { Avatar, PanelHeader, Spinner } from './SidebarShared';
import { Users, Phone, Video, UserPlus } from 'lucide-react';

// ─── Contacts Panel — sorted A-Z with letter dividers ─────────────────────────

export function ContactsPanel() {
  const friends = useFriendStore((s) => s.friends);
  const loading = useFriendStore((s) => s.isLoadingFriends);
  const fetchFriends = useFriendStore((s) => s.fetchFriends);
  const [query, setQuery] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { setSidebarView, setFriendSearchModalOpen, setCreateGroupModalOpen } = useUIStore();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const conversations = useChatStore((s) => s.conversations);
  const addConversation = useChatStore((s) => s.addConversation);
  const { startOutgoingCall, startCallFn } = useCallStore();

  useEffect(() => {
    fetchFriends();
  }, []); // Empty dependency array - fetch once on mount

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
      {/* Header — dùng PanelHeader dùng chung */}
      <PanelHeader
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm kiếm danh bạ…"
        actions={
          <>
            <button
              title="Thêm bạn bè"
              onClick={() => setFriendSearchModalOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all shrink-0"
            >
              <UserPlus size={16} strokeWidth={2} />
            </button>
            <button
              title="Tạo nhóm"
              onClick={() => setCreateGroupModalOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all shrink-0"
            >
              <Users size={16} strokeWidth={2} />
            </button>
          </>
        }
      />

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
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F5F7FA] active:bg-[#EEF3FF] transition-colors group disabled:opacity-60"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar src={friend.avatar} name={friend.displayName || friend.email} size={9} />
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
                      className="p-1 rounded-lg text-slate-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-colors cursor-pointer"
                    >
                      <Phone size={14} strokeLinecap="round" strokeLinejoin="round" />
                    </span>

                    {/* Video call */}
                    <span
                      role="button"
                      title="Gọi video"
                      onClick={(e) => { e.stopPropagation(); handleCall(friend, 'video'); }}
                      className="p-1 rounded-lg text-slate-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-colors cursor-pointer"
                    >
                      <Video size={14} strokeLinecap="round" strokeLinejoin="round" />
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
