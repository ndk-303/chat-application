import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { conversationService } from '../../services/conversationService';
import { friendService } from '../../services/friendService';
import { QRCodeSVG } from 'qrcode.react';
import type { Conversation, User } from '../../types';
import {
  ChevronDown, X, Users, Search, Link, UserPlus,
  Image, File, Play, Pencil, Check, Trash2, LogOut,
  Download, Loader2
} from 'lucide-react';

interface RightPanelProps {
  conversation: Conversation;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Collapsible Section ──────────────────────────────────────────── */
function Section({ title, icon, count, defaultOpen = true, children }: {
  title: string; icon: React.ReactNode; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {icon}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-1.5 py-0.5 rounded-full">{count}</span>
        )}
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/* ─── Avatar helper ────────────────────────────────────────────────── */
function PanelAvatar({ src, name, size = 'lg' }: { src?: string | null; name: string; size?: 'lg' | 'sm' }) {
  const px = size === 'lg' ? 'w-20 h-20' : 'w-8 h-8';
  const txt = size === 'lg' ? 'text-xl' : 'text-xs';
  if (src) return <img src={src} alt={name} className={`${px} rounded-full object-cover`} />;
  return (
    <div className={`${px} rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center ${txt} font-bold`}>
      {getInitials(name)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export function RightPanel({ conversation }: RightPanelProps) {
  const user = useAuthStore((s) => s.user);
  const messages = useChatStore((s) => s.messages[conversation._id] ?? []);
  const isRightPanelOpen = useUIStore((s) => s.isRightPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const openLightbox = useUIStore((s) => s.openLightbox);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const [kickingId, setKickingId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = conversation.type === 'group' && conversation.adminId?._id === user?._id;
  const other = conversation.type === 'private' ? conversation.participants.find((p) => p._id !== user?._id) : null;
  const name = conversation.type === 'group' ? (conversation.name || 'Group Chat') : (other?.displayName || 'Chat');
  const avatar = conversation.type === 'group' ? conversation.avatar : other?.avatar;

  // ── Shared files ───────────────────────────────────────────────────
  const allSharedFiles = messages.flatMap((m) => m.files ?? []);
  const mediaFiles = allSharedFiles.filter(
    (f) => f.type === 'image' || f.mimeType?.startsWith('image/') || f.type === 'video' || f.mimeType?.startsWith('video/')
  );
  const docFiles = allSharedFiles.filter(
    (f) => !(f.type === 'image' || f.mimeType?.startsWith('image/') || f.type === 'video' || f.mimeType?.startsWith('video/'))
  );
  const previewMedia = showAllMedia ? mediaFiles : mediaFiles.slice(-12);
  const imageGallery = mediaFiles
    .filter((f) => f.type === 'image' || f.mimeType?.startsWith('image/'))
    .map((f) => ({ url: f.url, name: f.originalName ?? 'image' }));

  // ── Search messages ────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content?.toLowerCase().includes(q)).reverse().slice(0, 20);
  }, [messages, searchQuery]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
    else setSearchQuery('');
  }, [searchOpen]);

  // ── Rename group ───────────────────────────────────────────────────
  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await conversationService.updateConversation(conversation._id, { name: newName.trim() });
      await fetchConversations();
    } catch { /* silent */ } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  if (!isRightPanelOpen) return null;

  return (
    <>
      <aside className="w-[300px] flex-shrink-0 bg-white border-l border-gray-100 flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-sm font-semibold text-gray-700">
            {conversation.type === 'group' ? 'Thông tin nhóm' : 'Thông tin liên hệ'}
          </h3>
          <button onClick={() => setRightPanelOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center py-5 border-b border-gray-100 px-4">
          {avatar ? (
            <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-xl font-bold mb-3">
              {conversation.type === 'group' ? (
                <Users size={30} fill="currentColor" />
              ) : getInitials(name)}
            </div>
          )}

          {/* Name — editable for group admin */}
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-[200px]">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false); }}
                className="flex-1 px-2 py-1 text-sm rounded-lg border border-[#0068FF] outline-none text-center"
                disabled={savingName}
              />
              <button onClick={handleRename} disabled={savingName} className="text-[#0068FF] hover:text-[#0052CC]">
                <Check size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { if (isAdmin) { setNewName(name); setEditingName(true); } }}
              className={`text-base font-bold text-gray-800 mb-1 text-center flex items-center gap-1.5 ${isAdmin ? 'hover:text-[#0068FF] cursor-pointer' : 'cursor-default'}`}
            >
              {name}
              {isAdmin && (
                <Pencil size={12} className="text-gray-400" />
              )}
            </button>
          )}

          {conversation.type === 'private' && (
            <>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${other?.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {other?.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
              </span>
              {other?.email && <p className="text-xs text-gray-400 mt-2">{other.email}</p>}
            </>
          )}
          {conversation.type === 'group' && (
            <span className="text-xs text-gray-400">{conversation.participants.length} thành viên</span>
          )}
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center justify-center gap-6 py-3 border-b border-gray-100">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`flex flex-col items-center gap-1 transition-colors ${searchOpen ? 'text-[#0068FF]' : 'text-gray-500 hover:text-[#0068FF]'}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${searchOpen ? 'bg-[#0068FF]/15' : 'bg-gray-100'}`}>
              <Search size={16} />
            </div>
            <span className="text-[10px] font-medium">Tìm kiếm</span>
          </button>
          {conversation.type === 'group' && isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#0068FF] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <Link size={16} />
              </div>
              <span className="text-[10px] font-medium">Mời</span>
            </button>
          )}
          {conversation.type === 'group' && isAdmin && (
            <button
              onClick={() => setShowAddMember(true)}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#0068FF] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <UserPlus size={16} />
              </div>
              <span className="text-[10px] font-medium">Thêm</span>
            </button>
          )}
        </div>

        {/* Search Messages */}
        {searchOpen && (
          <div className="border-b border-gray-100">
            <div className="p-3">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tin nhắn..."
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#0068FF] focus:ring-1 focus:ring-[#0068FF] placeholder:text-gray-400"
              />
            </div>
            {searchQuery.trim() && (
              <div className="max-h-48 overflow-y-auto px-3 pb-3 space-y-1">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Không tìm thấy tin nhắn</p>
                ) : (
                  searchResults.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => {
                        const el = document.getElementById(`msg-${m._id}`);
                        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('bg-yellow-50'); setTimeout(() => el.classList.remove('bg-yellow-50'), 2000); }
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-[11px] text-gray-400">{m.senderId.displayName}</p>
                      <p className="text-xs text-gray-700 line-clamp-2">{m.content}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Members (group only) */}
        {conversation.type === 'group' && (
          <Section
            title="Thành viên" count={conversation.participants.length} defaultOpen={true}
            icon={<Users size={13} strokeWidth={2.5} />}
          >
            <div className="space-y-1.5">
              {conversation.participants.map((p) => (
                <div key={p._id} className="flex items-center gap-2.5">
                  <div className="relative">
                    <PanelAvatar src={p.avatar} name={p.displayName} size="sm" />
                    {p.status === 'online' && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#22C55E] border-[1.5px] border-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.displayName}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{p.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                  </div>
                  {conversation.adminId?._id === p._id && (
                    <span className="text-[10px] bg-[#0068FF]/15 text-[#0068FF] font-medium px-1.5 py-0.5 rounded-md">Admin</span>
                  )}
                  {isAdmin && p._id !== user?._id && conversation.adminId?._id !== p._id && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Kick ${p.displayName} khỏi nhóm?`)) return;
                        setKickingId(p._id);
                        try {
                          await conversationService.removeMember(conversation._id, p._id);
                          useChatStore.setState((state) => ({
                            conversations: state.conversations.map((c) =>
                              c._id === conversation._id ? { ...c, participants: c.participants.filter((m) => m._id !== p._id) } : c
                            ),
                          }));
                        } catch { /* silent */ } finally { setKickingId(null); }
                      }}
                      disabled={kickingId === p._id}
                      title={`Kick ${p.displayName}`}
                      className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {kickingId === p._id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <X size={12} strokeWidth={2.5} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Ảnh & Video */}
        <Section
          title="Ảnh & Video" count={mediaFiles.length}
          icon={<Image size={13} strokeWidth={2.5} />}
        >
          {mediaFiles.length === 0 ? (
            <p className="text-xs text-gray-400">Chưa có ảnh hoặc video nào</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {previewMedia.map((file, i) => {
                  const isImg = file.type === 'image' || file.mimeType?.startsWith('image/');
                  const isVid = file.type === 'video' || file.mimeType?.startsWith('video/');
                  const galleryIndex = isImg ? imageGallery.findIndex((g) => g.url === file.url) : -1;

                  if (isImg) return (
                    <button key={i} type="button" onClick={() => openLightbox(imageGallery, galleryIndex >= 0 ? galleryIndex : 0)} className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none" title={file.originalName ?? 'image'}>
                      <img src={file.url} alt={file.originalName ?? 'image'} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  );
                  if (isVid) return (
                    <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden group bg-gray-900 flex items-center justify-center" title={file.originalName ?? 'video'}>
                      <video src={file.url} className="w-full h-full object-cover opacity-70" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow">
                          <Play size={14} fill="#0068FF" color="#0068FF" />
                        </div>
                      </div>
                    </a>
                  );
                  return null;
                })}
              </div>
              {mediaFiles.length > 12 && !showAllMedia && (
                <button onClick={() => setShowAllMedia(true)} className="w-full mt-2 text-xs text-[#0068FF] hover:underline font-medium">
                  Xem tất cả ({mediaFiles.length})
                </button>
              )}
              {showAllMedia && mediaFiles.length > 12 && (
                <button onClick={() => setShowAllMedia(false)} className="w-full mt-2 text-xs text-gray-400 hover:underline font-medium">
                  Thu gọn
                </button>
              )}
            </>
          )}
        </Section>

        {/* Files */}
        <Section
          title="Files" count={docFiles.length}
          icon={<File size={13} strokeWidth={2.5} />}
        >
          {docFiles.length === 0 ? (
            <p className="text-xs text-gray-400">Chưa có file nào được chia sẻ</p>
          ) : (
            <div className="space-y-1.5">
              {docFiles.slice(-10).map((file, i) => {
                const ext = file.originalName?.split('.').pop()?.toUpperCase() ?? 'FILE';
                return (
                  <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors no-underline group">
                    <div className="w-9 h-9 rounded-lg bg-[#0068FF]/10 flex flex-col items-center justify-center flex-shrink-0 gap-0.5">
                      <File size={14} color="#0068FF" strokeWidth={2} />
                      <span className="text-[8px] font-bold text-[#0068FF] leading-none">{ext.slice(0, 4)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 truncate group-hover:text-[#0068FF] transition-colors">{file.originalName ?? 'file'}</p>
                      <p className="text-[10px] text-gray-400">{file.size ? formatFileSize(file.size) : ''}</p>
                    </div>
                    <Download size={13} className="text-gray-300 group-hover:text-[#0068FF] transition-colors shrink-0" strokeWidth={2} />
                  </a>
                );
              })}
            </div>
          )}
        </Section>

        {/* Danger Zone */}
        <div className="px-4 py-4 border-t border-gray-100 mt-auto space-y-2">
          {isAdmin && (
            <button
              onClick={async () => {
                if (!window.confirm('Bạn có chắc muốn GIẢI TÁN nhóm này? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.')) return;
                try {
                  await conversationService.dissolveGroup(conversation._id);
                } catch (e: any) { alert(e?.response?.data?.message || 'Giải tán thất bại'); }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold"
            >
              <Trash2 size={16} strokeWidth={2} />
              Giải tán nhóm
            </button>
          )}
          <button
            onClick={async () => {
              const label = conversation.type === 'group' ? 'rời nhóm' : 'xóa cuộc trò chuyện này';
              if (!window.confirm(`Bạn có chắc muốn ${label}?`)) return;
              try {
                if (conversation.type === 'private') await conversationService.hideConversation(conversation._id);
                else await conversationService.leaveConversation(conversation._id);
                useChatStore.setState((state) => ({
                  conversations: state.conversations.filter((c) => c._id !== conversation._id),
                  activeConversationId: state.activeConversationId === conversation._id ? null : state.activeConversationId,
                }));
                setRightPanelOpen(false);
              } catch (e: any) { alert(e?.response?.data?.message || 'Thao tác thất bại'); }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm font-medium"
          >
            {conversation.type === 'group'
              ? <LogOut size={16} strokeWidth={2} />
              : <Trash2 size={16} strokeWidth={2} />
            }
            {conversation.type === 'group' ? 'Rời nhóm' : 'Xóa cuộc trò chuyện'}
          </button>
        </div>
      </aside>

      {/* ── Add Member Modal ──────────────────────────────────────────── */}
      {showAddMember && <AddMemberModal conversationId={conversation._id} existingIds={conversation.participants.map(p => p._id)} onClose={() => setShowAddMember(false)} />}

      {/* ── Invite Link Modal ────────────────────────────────────────── */}
      {showInvite && <InviteLinkModal conversationId={conversation._id} groupName={name} onClose={() => setShowInvite(false)} />}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Add Member Modal                                                    */
/* ═══════════════════════════════════════════════════════════════════ */
function AddMemberModal({ conversationId, existingIds, onClose }: { conversationId: string; existingIds: string[]; onClose: () => void }) {
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
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Thêm thất bại');
    } finally { setAdding(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[70vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold text-slate-900">Thêm Thành Viên</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 pb-3">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm bạn bè…" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0068FF] placeholder:text-gray-400" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-[#0068FF]" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Không có bạn bè nào để thêm</p>
          ) : (
            filtered.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                <PanelAvatar src={u.avatar} name={u.displayName || u.email} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.displayName || u.email}</p>
                </div>
                <button
                  onClick={() => handleAdd(u._id)}
                  disabled={adding === u._id}
                  className="px-3 py-1 rounded-lg bg-[#0068FF] text-white text-xs font-medium hover:bg-[#0052CC] transition-colors disabled:opacity-50"
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

/* ═══════════════════════════════════════════════════════════════════ */
/* Invite Link Modal                                                   */
/* ═══════════════════════════════════════════════════════════════════ */
function InviteLinkModal({ conversationId, groupName, onClose }: { conversationId: string; groupName: string; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const inviteUrl = token ? `${window.location.origin}/join/${token}` : '';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await conversationService.generateInvite(conversationId);
        setToken(data.inviteToken);
      } catch { /* silent */ } finally { setLoading(false); }
    })();
  }, [conversationId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">Mời vào nhóm</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-[#0068FF]" /></div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4 text-center">Chia sẻ link hoặc mã QR để mời bạn bè vào <strong>{groupName}</strong></p>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <QRCodeSVG value={inviteUrl} size={180} level="M" />
              </div>
            </div>

            {/* Link + Copy */}
            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly value={inviteUrl}
                className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-600 truncate"
              />
              <button onClick={handleCopy} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-[#0068FF] text-white hover:bg-[#0052CC]'}`}>
                {copied ? 'Đã copy!' : 'Copy'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
