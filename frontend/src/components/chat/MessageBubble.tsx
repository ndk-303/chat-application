import type { Message } from '../../types';
import { useUIStore } from '../../stores/uiStore';

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
  if (isImage) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    );
  }
  if (isVideo) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
    </svg>
  );
}

function SeenIcon({ status }: { status: Message['status'] }) {
  if (status === 'seen') {
    // Double blue ticks — seen by recipient
    return (
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <polyline points="1,5 4,8 9,1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="6,5 9,8 15,1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (status === 'delivered') {
    // Double grey ticks — delivered to device
    return (
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <polyline points="1,5 4,8 9,1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="6,5 9,8 15,1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // Single grey tick — sent (not yet delivered)
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polyline points="1,5 4,8 9,1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


export function MessageBubble({ message, isSent, showAvatar, isGroup }: MessageBubbleProps) {
  const hasContent = message.content?.trim().length > 0;

  // ── System message (e.g. member left, kicked) ──────────────────────────────
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {message.content}
        </span>
      </div>
    );
  }

  const imageFiles = (message.files ?? []).filter(
    (f) => f.type === 'image' || f.mimeType?.startsWith('image/')
  );
  const otherFiles = (message.files ?? []).filter(
    (f) => f.type !== 'image' && !f.mimeType?.startsWith('image/')
  );

  const { openLightbox } = useUIStore();

  return (
    <div className={`flex items-end gap-2 mb-1.5 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (for received messages or group) */}
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

      <div className={`max-w-[60%] flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
        {/* Sender name (group only, received) */}
        {isGroup && !isSent && showAvatar && (
          <span className="text-xs font-semibold text-[#0068FF] mb-1 px-1">
            {message.senderId.displayName}
          </span>
        )}

        {/* Image files — click opens lightbox */}
        {imageFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1 max-w-full">
            {imageFiles.map((file, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openLightbox(imageFiles.map((f) => ({ url: f.url, name: f.originalName ?? 'image' })), i)}
                className="rounded-xl overflow-hidden border border-black/5 hover:scale-[1.02] transition-transform focus:outline-none focus:ring-2 focus:ring-[#0068FF]"
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


        {otherFiles.map((file, i) => (
          <a
            key={i}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-3 rounded-xl mb-1 no-underline transition-opacity hover:opacity-80 ${
              isSent ? 'bg-[#0068FF] text-white' : 'bg-gray-100 text-gray-700 border border-[#E5E7EB]'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isSent ? 'bg-white/20' : 'bg-[#0068FF]/10 text-[#0068FF]'
            }`}>
              <FileIcon file={file} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[160px]">{file.originalName ?? 'file'}</p>
              <p className={`text-xs ${isSent ? 'text-white/70' : 'text-gray-400'}`}>{file.size ? formatFileSize(file.size) : ''}</p>
            </div>
          </a>
        ))}

        {/* Text content */}
        {hasContent && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isSent
              ? 'bg-[#0068FF] text-white rounded-br-sm shadow-sm shadow-[#0068FF]/20'
              : 'bg-white text-[#1F2937] border border-[#E5E7EB] rounded-bl-sm shadow-sm'
          }`}>
            {message.content}
          </div>
        )}

        {/* Timestamp & seen status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-gray-400">{formatTime(message.createdAt)}</span>
          {isSent && <SeenIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
