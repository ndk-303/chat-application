import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { conversationService } from '../../services/conversationService';
import { toast } from 'sonner';
import type { Conversation } from '../../types';
import { AddMemberModal } from '../modals/AddMemberModal';
import { CreateGroupModal } from '../modals/CreateGroupModal';
import { InviteLinkModal } from '../modals/InviteLinkModal';
import {
  ChevronDown, X, Users, BellOff, Bell, Pin, UserPlus,
  File, Play, Pencil, Check, Trash2, LogOut,
  Download, Loader2, Search, Link,
} from 'lucide-react';

interface RightPanelProps {
  conversation: Conversation;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getFileExt(name: string) {
  return (name.split('.').pop() ?? 'FILE').toUpperCase().slice(0, 4);
}

function getExtColor(ext: string): string {
  const map: Record<string, string> = {
    PDF: 'bg-red-500', DOC: 'bg-blue-600', DOCX: 'bg-blue-600',
    XLS: 'bg-green-600', XLSX: 'bg-green-600', PPT: 'bg-orange-500', PPTX: 'bg-orange-500',
    ZIP: 'bg-yellow-600', RAR: 'bg-yellow-600',
  };
  return map[ext] ?? 'bg-slate-500';
}

/* ─── Collapsible Section (Zalo style — chevron right gutter) ───────── */
function Section({ title, defaultOpen = true, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-800">{title}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

/* ─── Quick action icon button ──────────────────────────────────────── */
function ActionBtn({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-[#0068FF] transition-colors"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-[#0068FF]/15 text-[#0068FF]' : 'bg-gray-100 hover:bg-[#0068FF]/10'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium text-center leading-tight max-w-[56px]">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export function RightPanel({ conversation }: RightPanelProps) {
  const user = useAuthStore((s) => s.user);
  const messages = useChatStore((s) => s.messages[conversation._id] ?? []);
  const isRightPanelOpen = useUIStore((s) => s.isRightPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const openLightbox = useUIStore((s) => s.openLightbox);
  const toggleMute = useChatStore((s) => s.toggleMute);
  const togglePin = useChatStore((s) => s.togglePin);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const conversations = useChatStore((s) => s.conversations);

  const isMuted = conversation.isMuted ?? false;
  const isPinned = conversation.isPinned ?? false;

  const [kickingId, setKickingId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = conversation.type === 'group' && conversation.adminId?._id === user?._id;
  const other = conversation.type === 'private' ? conversation.participants.find((p) => p._id !== user?._id) : null;
  const name = conversation.type === 'group' ? (conversation.name || 'Group Chat') : (other?.displayName || 'Chat');
  const avatar = conversation.type === 'group' ? conversation.avatar : other?.avatar;

  // ── Shared groups (private only) ──────────────────────────────────
  const sharedGroups = useMemo(() => {
    if (conversation.type !== 'private' || !other) return [];
    return conversations.filter(
      (c) => c.type === 'group' &&
        c.participants.some((p) => p._id === other._id) &&
        c.participants.some((p) => p._id === user?._id)
    );
  }, [conversations, conversation.type, other, user?._id]);
  const [showSharedGroups, setShowSharedGroups] = useState(false);

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
    } catch (err) {
      console.warn('[RightPanel] rename failed', err);
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  if (!isRightPanelOpen) return null;

  return (
    <>
      <aside className="w-full md:w-[300px] flex-shrink-0 bg-white border-l border-gray-100 flex flex-col h-full overflow-y-auto custom-scrollbar">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-7" /> {/* spacer */}
          <h3 className="text-sm font-bold text-gray-800 tracking-tight">
            Thông tin hội thoại
          </h3>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Profile section ───────────────────────────────────────────── */}
        <div className="flex flex-col items-center py-4 px-4 border-b border-gray-100">
          {/* Avatar */}
          {avatar ? (
            <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover mb-2" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-lg font-bold mb-2">
              {conversation.type === 'group' ? <Users size={22} fill="currentColor" /> : getInitials(name)}
            </div>
          )}

          {/* Name */}
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-[200px] mb-1">
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
              onClick={() => { if (isAdmin || conversation.type === 'private') { setNewName(name); setEditingName(true); } }}
              className={`text-sm font-bold text-gray-900 mb-1 text-center flex items-center gap-1 ${(isAdmin || conversation.type === 'private') ? 'hover:text-[#0068FF] cursor-pointer' : 'cursor-default'}`}
            >
              {name}
              {(isAdmin || conversation.type === 'private') && (
                <Pencil size={13} className="text-gray-400" />
              )}
            </button>
          )}

          {/* Status / member count */}
          {conversation.type === 'private' && (
            <span className={`text-xs font-medium ${other?.status === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
              {other?.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
            </span>
          )}
          {conversation.type === 'group' && (
            <span className="text-xs text-gray-400">{conversation.participants.length} thành viên</span>
          )}
        </div>

        {/* ── Quick Action Bar ──────────────────────────────────────────── */}
        <div className="flex items-start justify-center gap-4 py-3 border-b border-gray-100 px-4">
          <ActionBtn
            icon={isMuted ? <Bell size={18} /> : <BellOff size={18} />}
            label={isMuted ? 'Bật thông\nbáo' : 'Tắt thông\nbáo'}
            active={isMuted}
            onClick={async () => {
              try {
                await toggleMute(conversation._id);
                toast.success(isMuted ? 'Đã bật thông báo' : 'Đã tắt thông báo');
              } catch {
                toast.error('Thao tác thất bại');
              }
            }}
          />
          <ActionBtn
            icon={<Pin size={18} className={isPinned ? 'fill-current' : ''} />}
            label={isPinned ? 'Bỏ ghim\nhội thoại' : 'Ghim hội\nthoại'}
            active={isPinned}
            onClick={async () => {
              try {
                await togglePin(conversation._id);
                toast.success(isPinned ? 'Đã bỏ ghim hội thoại' : 'Đã ghim hội thoại');
              } catch {
                toast.error('Thao tác thất bại');
              }
            }}
          />
          {conversation.type === 'private' ? (
            <ActionBtn
              icon={<UserPlus size={18} />}
              label={'Tạo nhóm\ntrò chuyện'}
              onClick={() => setShowCreateGroup(true)}
            />
          ) : isAdmin ? (
            <ActionBtn
              icon={<UserPlus size={18} />}
              label={'Thêm\nthành viên'}
              onClick={() => setShowAddMember(true)}
            />
          ) : (
            <ActionBtn
              icon={<Search size={18} />}
              label={'Tìm kiếm\ntin nhắn'}
              onClick={() => setSearchOpen(!searchOpen)}
              active={searchOpen}
            />
          )}
        </div>

        {/* ── Search Messages ───────────────────────────────────────────── */}
        {searchOpen && (
          <div className="border-b border-gray-100 px-4 pb-3 pt-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tin nhắn..."
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#0068FF] focus:ring-1 focus:ring-[#0068FF] placeholder:text-gray-400"
            />
            {searchQuery.trim() && (
              <div className="max-h-44 overflow-y-auto mt-2 space-y-1">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Không tìm thấy tin nhắn</p>
                ) : searchResults.map((m) => (
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Quick Info Rows ───────────────────────────────────────────── */}
        <div className="border-b border-gray-100">
          {/* Nhóm chung (private only) */}
          {conversation.type === 'private' && (
            <div>
              <button
                onClick={() => setShowSharedGroups((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-t border-gray-50"
              >
                <Users size={16} className="text-gray-500 shrink-0" />
                <span className="text-xs text-gray-700 font-medium flex-1">
                  {sharedGroups.length} nhóm chung
                </span>
                {sharedGroups.length > 0 && (
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${showSharedGroups ? 'rotate-0' : '-rotate-90'}`}
                  />
                )}
              </button>
              {showSharedGroups && sharedGroups.length > 0 && (
                <div className="px-4 pb-2 space-y-1">
                  {sharedGroups.map((g) => (
                    <div key={g._id} className="flex items-center gap-2 py-1.5">
                      {g.avatar
                        ? <img src={g.avatar} alt={g.name ?? ''} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        : <div className="w-7 h-7 rounded-full bg-[#0068FF]/10 flex items-center justify-center shrink-0"><Users size={13} className="text-[#0068FF]" /></div>
                      }
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{g.name || 'Nhóm chat'}</p>
                        <p className="text-[11px] text-gray-400">{g.participants.length} thành viên</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members (group only) — quick link row */}
          {conversation.type === 'group' && (
            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-t border-gray-50">
              <Users size={16} className="text-gray-500 shrink-0" />
              <span className="text-xs text-gray-700 font-medium">{conversation.participants.length} thành viên</span>
            </button>
          )}
        </div>

        {/* ── Members list (group only) ─────────────────────────────────── */}
        {conversation.type === 'group' && (
          <Section title="Thành viên nhóm" defaultOpen={false}>
            <div className="space-y-1 px-4">
              {conversation.participants.map((p) => (
                <div key={p._id} className="flex items-center gap-2.5 py-1">
                  <div className="relative shrink-0">
                    {p.avatar
                      ? <img src={p.avatar} alt={p.displayName} className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-xs font-bold">{getInitials(p.displayName)}</div>
                    }
                    {p.status === 'online' && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#22C55E] border-[1.5px] border-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.displayName}</p>
                  </div>
                  {conversation.adminId?._id === p._id && (
                    <span className="text-[10px] bg-[#0068FF]/15 text-[#0068FF] font-semibold px-1.5 py-0.5 rounded-md shrink-0">Admin</span>
                  )}
                  {isAdmin && p._id !== user?._id && conversation.adminId?._id !== p._id && (
                    <button
                      onClick={async () => {
                        setKickingId(p._id);
                        try {
                          await conversationService.removeMember(conversation._id, p._id);
                          useChatStore.setState((state) => ({
                            conversations: state.conversations.map((c) =>
                              c._id === conversation._id ? { ...c, participants: c.participants.filter((m) => m._id !== p._id) } : c
                            ),
                          }));
                          toast.success(`Đã xóa ${p.displayName} khỏi nhóm`);
                        } catch (e) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Xóa thành viên thất bại'); }
                        finally { setKickingId(null); }
                      }}
                      disabled={kickingId === p._id}
                      className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {kickingId === p._id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={2.5} />}
                    </button>
                  )}
                </div>
              ))}
              {isAdmin && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-1.5 text-xs text-[#0068FF] hover:underline font-medium"
                  >
                    <UserPlus size={13} /> Thêm thành viên
                  </button>
                  {showInvite === false && (
                    <button
                      onClick={() => setShowInvite(true)}
                      className="flex items-center gap-1.5 text-xs text-[#0068FF] hover:underline font-medium ml-2"
                    >
                      <Link size={13} /> Mời qua link
                    </button>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Ảnh / Video ───────────────────────────────────────────────── */}
        <Section title="Ảnh/Video" defaultOpen={true}>
          {mediaFiles.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3 px-4">
              Sử dụng ứng dụng để xem<br />Ảnh/Video được chia sẻ
            </p>
          ) : (
            <div className="px-4">
              <div className="grid grid-cols-3 gap-1.5">
                {previewMedia.map((file, i) => {
                  const isImg = file.type === 'image' || file.mimeType?.startsWith('image/');
                  const isVid = file.type === 'video' || file.mimeType?.startsWith('video/');
                  const galleryIndex = isImg ? imageGallery.findIndex((g) => g.url === file.url) : -1;

                  if (isImg) return (
                    <button key={i} type="button"
                      onClick={() => openLightbox(imageGallery, galleryIndex >= 0 ? galleryIndex : 0)}
                      className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none"
                    >
                      <img src={file.url} alt={file.originalName ?? 'image'} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    </button>
                  );
                  if (isVid) return (
                    <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                      className="relative aspect-square rounded-lg overflow-hidden group bg-gray-900 flex items-center justify-center"
                    >
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
                <button onClick={() => setShowAllMedia(true)} className="w-full mt-2.5 text-xs text-[#0068FF] hover:underline font-medium">
                  Xem tất cả ({mediaFiles.length})
                </button>
              )}
              {showAllMedia && mediaFiles.length > 12 && (
                <button onClick={() => setShowAllMedia(false)} className="w-full mt-2.5 text-xs text-gray-400 hover:underline font-medium">Thu gọn</button>
              )}
            </div>
          )}
        </Section>

        {/* ── File ──────────────────────────────────────────────────────── */}
        <Section title="File" defaultOpen={true}>
          {docFiles.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3 px-4">Chưa có file nào được chia sẻ</p>
          ) : (
            <div className="space-y-0 px-4">
              {docFiles.slice(-10).map((file, i) => {
                const ext = getFileExt(file.originalName ?? 'file');
                const color = getExtColor(ext);
                const msg = messages.find((m) => m.files?.some((f) => f.url === file.url));
                const dateStr = msg ? formatDate(msg.createdAt) : '';

                return (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50 transition-colors -mx-4 px-4 no-underline"
                  >
                    {/* File icon badge */}
                    <div className={`w-10 h-10 ${color} rounded-lg flex flex-col items-center justify-center shrink-0 gap-0.5`}>
                      <File size={14} color="white" strokeWidth={2} />
                      <span className="text-[8px] font-bold text-white leading-none">{ext}</span>
                    </div>

                    {/* File info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#0068FF] transition-colors">
                        {file.originalName ?? 'file'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-400">{file.size ? formatFileSize(file.size) : ''}</span>
                        {dateStr && (
                          <>
                            <span className="text-gray-300 text-[10px]">•</span>
                            <span className="text-[11px] text-gray-400">{dateStr}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Download size={14} className="text-gray-300 group-hover:text-[#0068FF] transition-colors shrink-0" strokeWidth={2} />
                  </a>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <div className="px-4 py-4 border-t border-gray-100 mt-auto space-y-1">
          {isAdmin && (
            <button
              onClick={() => {
                toast('Bạn có chắc muốn giải tán nhóm?', {
                  description: 'Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.',
                  action: {
                    label: 'Giải tán',
                    onClick: async () => {
                      try {
                        await conversationService.dissolveGroup(conversation._id);
                        toast.success('Đã giải tán nhóm');
                      } catch (e) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Giải tán thất bại'); }
                    },
                  },
                  cancel: { label: 'Hủy', onClick: () => { } },
                });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold"
            >
              <Trash2 size={16} strokeWidth={2} />
              Giải tán nhóm
            </button>
          )}
          <button
            onClick={() => {
              const label = conversation.type === 'group' ? 'rời nhóm' : 'xóa cuộc trò chuyện này';
              toast(`Bạn có chắc muốn ${label}?`, {
                action: {
                  label: 'Xác nhận',
                  onClick: async () => {
                    try {
                      if (conversation.type === 'private') await conversationService.hideConversation(conversation._id);
                      else await conversationService.leaveConversation(conversation._id);
                      useChatStore.setState((state) => ({
                        conversations: state.conversations.filter((c) => c._id !== conversation._id),
                        activeConversationId: state.activeConversationId === conversation._id ? null : state.activeConversationId,
                      }));
                      setRightPanelOpen(false);
                      toast.success('Thao tác thành công');
                    } catch (e) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Thao tác thất bại'); }
                  },
                },
                cancel: { label: 'Hủy', onClick: () => { } },
              });
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm font-medium"
          >
            {conversation.type === 'group' ? <LogOut size={16} strokeWidth={2} /> : <Trash2 size={16} strokeWidth={2} />}
            {conversation.type === 'group' ? 'Rời nhóm' : 'Xóa cuộc trò chuyện'}
          </button>
        </div>
      </aside>

      {showAddMember && (
        <AddMemberModal
          conversationId={conversation._id}
          existingIds={conversation.participants.map((p) => p._id)}
          onClose={() => setShowAddMember(false)}
        />
      )}
      {showCreateGroup && other && (
        <CreateGroupModal
          initialSelected={[other]}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
      {showInvite && (
        <InviteLinkModal
          conversationId={conversation._id}
          groupName={name}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}
