import { useState, useCallback } from 'react';
import type { Message } from '../../types';
import { useUIStore } from '../../stores/uiStore';
import { useCallStore } from '../../stores/callStore';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { ImageIcon, Video, File, Info, Phone } from 'lucide-react';

import api from '../../lib/axios';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  showAvatar: boolean;
  isGroup: boolean;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function FileIcon({ file }: { file: { mimeType?: string; type?: string } }) {
  const isImage = file.type === 'image' || file.mimeType?.startsWith('image/');
  const isVideo = file.type === 'video' || file.mimeType?.startsWith('video/');
  if (isImage) return <ImageIcon size={20} />;
  if (isVideo) return <Video size={20} />;
  return <File size={20} />;
}

function SeenIcon({ status }: { status: Message['status'] }) {
  if (status === 'seen') {
    return (
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <polyline points="1,5 4,8 9,1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="6,5 9,8 15,1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'delivered') {
    return (
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <polyline points="1,5 4,8 9,1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="6,5 9,8 15,1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polyline points="1,5 4,8 9,1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Quick reaction bar shown on hover ─────────────────────────────────────────
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

function QuickReactBar({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <div
      className="absolute z-20 flex items-center gap-0.5 bg-white border border-[#E5E7EB] rounded-full px-1.5 py-1 shadow-lg"
      style={{ boxShadow: '0 4px 16px rgba(0,104,255,0.12)' }}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => { e.stopPropagation(); onReact(emoji); }}
          className="w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-[#EEF5FF] transition-all hover:scale-125 active:scale-90"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}



// ── Main Component ─────────────────────────────────────────────────────────────
export function MessageBubble({ message, isSent, showAvatar, isGroup }: MessageBubbleProps) {
  const hasContent = message.content?.trim().length > 0;
  const [isHovered, setIsHovered] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<number | null>(null);
  const [showQuickReact, setShowQuickReact] = useState(false);

  const { openLightbox } = useUIStore();
  const { startOutgoingCall, startCallFn } = useCallStore();
  const currentUser = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  const handleCallBack = useCallback(async (callType: 'audio' | 'video') => {
    if (!startCallFn) return;

    // Find the other participant from the active conversation
    const conv = conversations.find((c) => c._id === activeConversationId);
    if (!conv) return;

    const other = conv.participants.find((p) => p._id !== currentUser?._id);
    if (!other) return;

    startOutgoingCall(callType, {
      _id: other._id,
      displayName: other.displayName,
      avatar: other.avatar,
    });
    await startCallFn(other._id, callType);
  }, [startCallFn, startOutgoingCall, conversations, activeConversationId, currentUser]);

  const handleReact = useCallback(async (emoji: string) => {
    setShowQuickReact(false);
    try {
      await api.patch(`/messages/${message._id}/react`, { emoji });
      // Socket event will update the store — no need to mutate locally
    } catch (err) {
      console.error('[Reaction] Failed to react', err);
    }
  }, [message._id]);

  const handleFileDownload = useCallback(async (url: string, name: string, idx: number) => {
    setDownloadingFile(idx);
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback — mở tab mới nếu CORS chặn
      window.open(url, '_blank', 'noopener');
    } finally {
      setDownloadingFile(null);
    }
  }, []);

  // ── System message ───────────────────────────────────────────────────────────
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
          <Info size={12} strokeWidth={2.5} />
          {message.content}
        </span>
      </div>
    );
  }

  // ── Call message ─────────────────────────────────────────────────────────────
  if (message.type === 'call') {
    const meta = message.callMeta;
    const isVideo = meta?.callType === 'video';
    const status = meta?.callStatus ?? 'ended';
    const duration = meta?.callDuration ?? 0;

    const formatDuration = (s: number) => {
      if (s < 60) return `${s} giây`;
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return sec > 0 ? `${m} phút ${sec} giây` : `${m} phút`;
    };

    // Header: trạng thái cuộc gọi
    const headerLabel =
      status === 'missed'
        ? 'Bạn bị nhỡ'
        : status === 'rejected'
          ? 'Cuộc gọi bị từ chối'
          : isSent
            ? (isVideo ? 'Cuộc gọi video đi' : 'Cuộc gọi thoại đi')
            : (isVideo ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến');


    // Icon row label
    const iconRowLabel = isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại';

    // Phone icon with directional arrow — SVG inline to match Zalo style
    const isMissedOrRejected = status === 'missed' || status === 'rejected';

    return (
      <div className={`flex items-end gap-2 mb-1.5 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isSent && (
          <div className="flex-shrink-0 mb-1">
            {showAvatar ? (
              message.senderId.avatar ? (
                <img src={message.senderId.avatar} alt={message.senderId.displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-xs font-bold">
                  {getInitials(message.senderId.displayName)}
                </div>
              )
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
          {/* Card bubble */}
          <div className="bg-white border border-gray-200 rounded-[0.25rem] shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-4 py-2">
              <p className={`text-sm font-semibold text-gray-700`}>{headerLabel}</p>
            </div>

            {/* Icon row */}
            <div className="px-4 pb-2 flex items-center gap-2.5">
              {/* Phone icon with arrow */}
              <div className="relative flex-shrink-0">
                {isVideo ? (
                  <Video size={20} color={isMissedOrRejected ? '#EF4444' : '#1bb152ff'} strokeWidth={2} />
                ) : (
                  <Phone size={20} color={isMissedOrRejected ? '#EF4444' : '#1bb152ff'} strokeWidth={2} />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-gray-700 truncate">{iconRowLabel}</span>
                {status === 'ended' && duration > 0 && (
                  <span className="text-[11px] text-gray-400">{formatDuration(duration)}</span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-0" />

            {/* Gọi lại button */}
            <button
              className="w-full py-2.5 text-[13px] font-semibold text-[#0068FF] hover:bg-blue-50 transition-colors"
              onClick={() => handleCallBack(meta?.callType ?? 'audio')}
            >
              Gọi lại
            </button>
          </div>

          {/* Timestamp & seen */}
          <div className={`flex items-center gap-1 mt-1 px-1 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-gray-400">{formatTime(message.createdAt)}</span>
            {isSent && <SeenIcon status={message.status} />}
          </div>
        </div>
      </div>
    );
  }

  const imageFiles = (message.files ?? []).filter(
    (f) => f.type === 'image' || f.mimeType?.startsWith('image/')
  );
  const otherFiles = (message.files ?? []).filter(
    (f) => f.type !== 'image' && !f.mimeType?.startsWith('image/')
  );

  return (
    <div
      className={`flex items-start gap-2 mb-1.5 group ${isSent ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowQuickReact(false); }}
    >
      {/* Avatar */}
      {!isSent && (
        <div className="flex-shrink-0 mb-1">
          {showAvatar ? (
            message.senderId.avatar ? (
              <img src={message.senderId.avatar} alt={message.senderId.displayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-xs font-bold">
                {getInitials(message.senderId.displayName)}
              </div>
            )
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Bubble + reactions */}
      <div className={`relative max-w-[60%] flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>


        {/* Content wrapper — relative anchor for the reaction badge */}
        <div className="relative block max-w-full min-w-0">

          {/* Images */}
          {imageFiles.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1 max-w-full">
              {imageFiles.map((file, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openLightbox(imageFiles.map((f) => ({ url: f.url, name: f.originalName ?? 'image' })), i)}
                  className="rounded-[0.25rem] overflow-hidden border border-black/5 hover:scale-[1.02] transition-transform focus:outline-none focus:ring-2 focus:ring-[#0068FF]"
                >
                  <img
                    src={file.url}
                    alt={file.originalName ?? 'image'}
                    className="block max-w-[240px] max-h-[200px] object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Non-image files */}
          {otherFiles.map((file, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleFileDownload(file.url, file.originalName ?? 'file', i)}
              disabled={downloadingFile === i}
              className={`flex items-center gap-3 p-3 rounded-[0.25rem] mb-1 w-full text-left transition-opacity hover:opacity-80 disabled:opacity-60 ${
                isSent ? 'bg-[#0068FF] text-white' : 'bg-gray-100 text-gray-700 border border-[#E5E7EB]'
              }`}
            >
              <div className={`w-9 h-9 rounded-[0.25rem] flex items-center justify-center flex-shrink-0 ${
                isSent ? 'bg-white/20' : 'bg-[#0068FF]/10 text-[#0068FF]'
              }`}>
                {downloadingFile === i ? (
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <FileIcon file={file} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate max-w-[160px]">{file.originalName ?? 'file'}</p>
                <p className={`text-xs ${isSent ? 'text-white/70' : 'text-gray-400'}`}>
                  {downloadingFile === i ? 'Đang tải...' : (file.size ? formatFileSize(file.size) : '')}
                </p>
              </div>
              {/* Download icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${isSent ? 'text-white/70' : 'text-gray-400'}`}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          ))}

          {/* Text content (with embedded sender name for group messages) */}
          {(hasContent || (isGroup && !isSent && showAvatar)) && (
            <div className={`px-4 py-2.5 rounded-[0.25rem] text-sm leading-relaxed break-words overflow-hidden ${isSent
              ? 'bg-[#E5F1FE]/70 text-black shadow-sm'
              : 'bg-white text-[#1F2937] shadow-sm'
              }`}>
              {isGroup && !isSent && showAvatar && (
                <p className="text-xs font-semibold text-gray-400 mb-1 leading-none">
                  {message.senderId.displayName}
                </p>
              )}
              {hasContent && <span>{message.content}</span>}
            </div>
          )}

          {/* Reaction badge — always anchored to bottom corner of this content wrapper */}
          {(() => {
            const nonEmpty = (message.reactions ?? []).filter((r) => r.userIds.length > 0);
            const totalCount = nonEmpty.reduce((s, r) => s + r.userIds.length, 0);
            const topEmoji = nonEmpty[0]?.emoji ?? null;
            const hasReaction = nonEmpty.length > 0;

            return (
              <div
                className={`absolute -bottom-3 ${isSent ? '-left-2' : '-right-2'} transition-opacity duration-150 z-10 ${hasReaction || isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <button
                  onClick={() => setShowQuickReact((v) => !v)}
                  title="React"
                  className={`flex items-center gap-1 px-1.5 h-5 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-90 ${hasReaction
                    ? 'bg-white border-gray-200 text-gray-700'
                    : 'bg-white border-gray-200'
                    }`}
                >
                  {hasReaction ? (
                    <>
                      <span className="text-xs leading-none">{topEmoji}</span>
                      {totalCount > 1 && (
                        <span className="text-[11px] font-semibold text-gray-500 leading-none">{totalCount}</span>
                      )}
                    </>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 10v12" />
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                  )}
                </button>
                {showQuickReact && (
                  <div className={`absolute bottom-full mb-1 ${isSent ? 'right-62' : 'right-0'}`}>
                    <QuickReactBar onReact={handleReact} />
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Timestamp & seen */}
        <div className={`flex items-center gap-1 mt-4 px-1 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-gray-400">{formatTime(message.createdAt)}</span>
          {isSent && <SeenIcon status={message.status} />}
        </div>
      </div>


    </div>
  );
}
