import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput, type MessageInputHandle } from './MessageInput';
import { TypingIndicatorBar } from './TypingIndicatorBar';
import { joinConversation, leaveConversation } from '../../lib/socket';

export function ChatWindow() {
  const activeId = useChatStore((s) => s.activeConversationId);
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c._id === s.activeConversationId)
  );

  const messageInputRef = useRef<MessageInputHandle>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0); // track nested drag-enter/leave events

  // Join/leave socket conversation room when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    joinConversation(activeId);
    return () => {
      leaveConversation(activeId);
    };
  }, [activeId]);

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      messageInputRef.current?.addFiles(droppedFiles);
    }
  }, []);

  if (!activeId || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#E9EBEE] p-8 text-center">
        <div className="max-w-md">
            <img src="/logo.svg" alt="Kapta" className="w-full h-full" />
          <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Chào mừng đến với Kapta</h2>
          <p className="text-[#6B7280]">
            Chọn cuộc trò chuyện để bắt đầu..
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ChatHeader conversation={conversation} />
      <MessageList
        conversationId={activeId}
        isGroup={conversation.type === 'group'}
      />
      <TypingIndicatorBar conversationId={activeId} participants={conversation.participants} />
      <MessageInput ref={messageInputRef} conversationId={activeId} />

      {/* Drag-and-drop overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(0, 104, 255, 0.08)',
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* Dashed border frame */}
          <div
            className="absolute inset-4 rounded-2xl border-2 border-dashed border-[#0068FF]/60"
            style={{ animation: 'dragPulse 1.5s ease-in-out infinite' }}
          />

          {/* Center content */}
          <div className="flex flex-col items-center gap-4 text-[#0068FF]">
            {/* Upload icon with animated bounce */}
            <div
              className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center"
              style={{ animation: 'dragBounce 1s ease-in-out infinite' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0068FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-center bg-white/90 px-6 py-3 rounded-2xl shadow-lg">
              <p className="text-base font-bold text-[#0068FF]">Thả file vào đây</p>
              <p className="text-xs text-[#6B7280] mt-0.5">Ảnh, video, tài liệu (tối đa 5 file)</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dragPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes dragBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
