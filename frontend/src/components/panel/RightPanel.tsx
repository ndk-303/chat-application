import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { conversationService } from '../../services/conversationService';
import type { Conversation } from '../../types';

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

export function RightPanel({ conversation }: RightPanelProps) {
  const user = useAuthStore((s) => s.user);
  const messages = useChatStore((s) => s.messages[conversation._id] ?? []);
  const isRightPanelOpen = useUIStore((s) => s.isRightPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const openLightbox = useUIStore((s) => s.openLightbox);
  const [kickingId, setKickingId] = useState<string | null>(null);

  const isAdmin = conversation.type === 'group' && conversation.adminId?._id === user?._id;

  const other = conversation.type === 'private'
    ? conversation.participants.find((p) => p._id !== user?._id)
    : null;

  const name = conversation.type === 'group' ? (conversation.name || 'Group Chat') : (other?.displayName || 'Chat');
  const avatar = conversation.type === 'group' ? conversation.avatar : other?.avatar;

  // Collect all shared files from messages
  const allSharedFiles = messages.flatMap((m) => m.files ?? []);

  // Separate media (images/videos) from other files
  const mediaFiles = allSharedFiles
    .filter((f) => f.type === 'image' || f.mimeType?.startsWith('image/') || f.type === 'video' || f.mimeType?.startsWith('video/'))
    .slice(-12);

  const docFiles = allSharedFiles
    .filter((f) => !(f.type === 'image' || f.mimeType?.startsWith('image/') || f.type === 'video' || f.mimeType?.startsWith('video/')))
    .slice(-10);

  // All image files for lightbox gallery navigation
  const imageGallery = mediaFiles
    .filter((f) => f.type === 'image' || f.mimeType?.startsWith('image/'))
    .map((f) => ({ url: f.url, name: f.originalName ?? 'image' }));

  if (!isRightPanelOpen) return null;

  return (
    <aside className="w-[280px] flex-shrink-0 bg-white border-l border-gray-100 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          {conversation.type === 'group' ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center py-6 border-b border-gray-100 px-4">
        {avatar ? (
          <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover mb-3" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-xl font-bold mb-3">
            {conversation.type === 'group' ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ) : getInitials(name)}
          </div>
        )}
        <h2 className="text-base font-bold text-gray-800 mb-1 text-center">{name}</h2>
        {conversation.type === 'private' && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            other?.status === 'online'
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {other?.status || 'offline'}
          </span>
        )}
        {conversation.type === 'group' && (
          <span className="text-xs text-gray-400">{conversation.participants.length} members</span>
        )}
      </div>

      {/* Members (group only) */}
      {conversation.type === 'group' && (
        <div className="px-4 py-4 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Members</h4>
          <div className="space-y-2">
            {conversation.participants.map((p) => (
              <div key={p._id} className="flex items-center gap-3">
                <div className="relative">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.displayName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-xs font-bold">
                      {getInitials(p.displayName)}
                    </div>
                  )}
                  {p.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.displayName}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.status}</p>
                </div>
                {conversation.adminId?._id === p._id && (
                  <span className="text-[10px] bg-[#0068FF]/15 text-[#0068FF] font-medium px-1.5 py-0.5 rounded-md">Admin</span>
                )}
                {/* Kick button (only for admin, not for themselves or other admin) */}
                {isAdmin && p._id !== user?._id && conversation.adminId?._id !== p._id && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Kick ${p.displayName} khỏi nhóm?`)) return;
                      setKickingId(p._id);
                      try {
                        await conversationService.removeMember(conversation._id, p._id);
                        // Optimistic: remove from local conversation participants
                        useChatStore.setState((state) => ({
                          conversations: state.conversations.map((c) =>
                            c._id === conversation._id
                              ? { ...c, participants: c.participants.filter((m) => m._id !== p._id) }
                              : c
                          ),
                        }));
                      } catch { /* silent */ } finally {
                        setKickingId(null);
                      }
                    }}
                    disabled={kickingId === p._id}
                    title={`Kick ${p.displayName}`}
                    className="ml-auto p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {kickingId === p._id ? (
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ảnh & Video */}
      <div className="px-4 py-4 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
          Ảnh &amp; Video
          {mediaFiles.length > 0 && (
            <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 font-semibold px-1.5 py-0.5 rounded-full">
              {mediaFiles.length}
            </span>
          )}
        </h4>
        {mediaFiles.length === 0 ? (
          <p className="text-xs text-gray-400">Chưa có ảnh hoặc video nào</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {mediaFiles.map((file, i) => {
              const isImg = file.type === 'image' || file.mimeType?.startsWith('image/');
              const isVid = file.type === 'video' || file.mimeType?.startsWith('video/');
              const galleryIndex = isImg ? imageGallery.findIndex((g) => g.url === file.url) : -1;

              if (isImg) {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => openLightbox(imageGallery, galleryIndex >= 0 ? galleryIndex : 0)}
                    className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none"
                    title={file.originalName ?? 'image'}
                  >
                    <img
                      src={file.url}
                      alt={file.originalName ?? 'image'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <svg className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      </svg>
                    </div>
                  </button>
                );
              }

              if (isVid) {
                return (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden group bg-gray-900 flex items-center justify-center"
                    title={file.originalName ?? 'video'}
                  >
                    <video src={file.url} className="w-full h-full object-cover opacity-70" muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#0068FF">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </div>
                    </div>
                  </a>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      {/* Files */}
      <div className="px-4 py-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
          </svg>
          Files
          {docFiles.length > 0 && (
            <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 font-semibold px-1.5 py-0.5 rounded-full">
              {docFiles.length}
            </span>
          )}
        </h4>
        {docFiles.length === 0 ? (
          <p className="text-xs text-gray-400">Chưa có file nào được chia sẻ</p>
        ) : (
          <div className="space-y-1.5">
            {docFiles.map((file, i) => {
              const ext = file.originalName?.split('.').pop()?.toUpperCase() ?? 'FILE';
              return (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors no-underline group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0068FF]/10 flex flex-col items-center justify-center flex-shrink-0 gap-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0068FF" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                    <span className="text-[8px] font-bold text-[#0068FF] leading-none">{ext.slice(0, 4)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 truncate group-hover:text-[#0068FF] transition-colors">
                      {file.originalName ?? 'file'}
                    </p>
                    <p className="text-[10px] text-gray-400">{file.size ? formatFileSize(file.size) : ''}</p>
                  </div>
                  <svg className="text-gray-300 group-hover:text-[#0068FF] transition-colors shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="px-4 py-4 border-t border-gray-100 mt-auto space-y-2">
        {/* Giải tán nhóm — chỉ admin */}
        {isAdmin && (
          <button
            onClick={async () => {
              if (!window.confirm('Bạn có chắc muốn GIẢI TÁN nhóm này? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.')) return;
              try {
                await conversationService.dissolveGroup(conversation._id);
                // socketStore sẽ nhận group_dissolved event và tự xóa khỏi list
              } catch (e: any) {
                alert(e?.response?.data?.message || 'Giải tán thất bại');
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
            Giải tán nhóm
          </button>
        )}

        {/* Rời nhóm (non-admin) hoặc Xóa cuộc trò chuyện (private) */}
        <button
          onClick={async () => {
            const label = conversation.type === 'group' ? 'rời nhóm' : 'xóa cuộc trò chuyện này';
            if (!window.confirm(`Bạn có chắc muốn ${label}?`)) return;
            try {
              if (conversation.type === 'private') {
                // Soft delete: only hides for current user, other person still has messages
                await conversationService.hideConversation(conversation._id);
              } else {
                await conversationService.leaveConversation(conversation._id);
              }
              useChatStore.setState((state) => ({
                conversations: state.conversations.filter((c) => c._id !== conversation._id),
                activeConversationId: state.activeConversationId === conversation._id ? null : state.activeConversationId,
              }));
              setRightPanelOpen(false);
            } catch (e: any) {
              alert(e?.response?.data?.message || 'Thao tác thất bại');
            }
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {conversation.type === 'group'
              ? <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>
              : <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>
            }
          </svg>
          {conversation.type === 'group' ? 'Rời nhóm' : 'Xóa cuộc trò chuyện'}
        </button>
      </div>
    </aside>
  );
}
