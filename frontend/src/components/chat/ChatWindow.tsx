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
          <div className="size-20 bg-[#0068FF]/10 rounded-full flex items-center justify-center text-[#0068FF] mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="100%" zoomAndPan="magnify" viewBox="0 0 375 374.999991" height="100%" style={{ display: 'block' }} preserveAspectRatio="xMidYMid meet" version="1.0"><defs><clipPath id="0ebf1e1b56"><path d="M 93 79.542969 L 297 79.542969 L 297 253.542969 L 93 253.542969 Z M 93 79.542969 " clip-rule="nonzero" /></clipPath><clipPath id="c4699c050a"><path d="M 286.234375 166.707031 L 290.796875 161.878906 C 298.964844 153.242188 298.964844 139.183594 290.796875 130.542969 L 248.972656 86.316406 C 244.921875 82.03125 239.507812 79.671875 233.734375 79.671875 C 227.957031 79.675781 222.546875 82.035156 218.492188 86.320312 L 214.355469 90.695312 L 210.21875 86.320312 C 206.167969 82.035156 200.753906 79.671875 194.980469 79.671875 C 189.203125 79.671875 183.792969 82.03125 179.738281 86.316406 L 175.597656 90.699219 L 171.449219 86.316406 C 167.394531 82.03125 161.984375 79.671875 156.210938 79.671875 C 156.210938 79.671875 156.207031 79.671875 156.207031 79.671875 C 150.433594 79.671875 145.019531 82.035156 140.96875 86.320312 L 99.15625 130.542969 C 90.988281 139.183594 90.988281 153.242188 99.160156 161.878906 L 103.722656 166.703125 L 99.160156 171.53125 C 90.988281 180.171875 90.988281 194.226562 99.15625 202.871094 L 140.96875 247.089844 C 145.023438 251.378906 150.433594 253.742188 156.207031 253.742188 C 156.210938 253.742188 156.210938 253.742188 156.210938 253.742188 C 161.984375 253.742188 167.394531 251.382812 171.449219 247.097656 L 175.59375 242.710938 L 179.738281 247.09375 C 183.792969 251.378906 189.203125 253.742188 194.976562 253.742188 C 200.753906 253.742188 206.164062 251.378906 210.21875 247.09375 L 214.355469 242.71875 L 218.492188 247.09375 C 222.546875 251.378906 227.957031 253.738281 233.734375 253.738281 C 239.507812 253.738281 244.921875 251.378906 248.972656 247.09375 L 290.796875 202.871094 C 298.964844 194.230469 298.964844 180.171875 290.796875 171.53125 Z M 179.738281 222.144531 L 175.597656 226.523438 L 119.035156 166.707031 L 147.3125 136.796875 L 175.59375 106.890625 L 179.738281 111.269531 C 180.3125 111.878906 180.921875 112.4375 181.554688 112.96875 C 182.582031 113.835938 183.671875 114.605469 184.816406 115.253906 C 184.820312 115.257812 184.824219 115.257812 184.828125 115.257812 C 186.058594 115.953125 187.347656 116.515625 188.6875 116.941406 C 188.703125 116.945312 188.71875 116.949219 188.738281 116.953125 C 190.0625 117.371094 191.429688 117.660156 192.828125 117.800781 C 193.1875 117.839844 193.550781 117.839844 193.914062 117.859375 C 194.265625 117.875 194.617188 117.914062 194.972656 117.914062 C 194.972656 117.914062 194.976562 117.914062 194.976562 117.914062 C 196.417969 117.914062 197.839844 117.765625 199.222656 117.476562 C 203.371094 116.609375 207.175781 114.480469 210.214844 111.265625 L 214.039062 107.222656 L 214.355469 106.886719 L 270.921875 166.707031 L 214.355469 226.527344 L 210.214844 222.148438 C 206.164062 217.863281 200.75 215.5 194.976562 215.5 C 194.976562 215.5 194.976562 215.5 194.972656 215.5 C 189.203125 215.5 183.789062 217.859375 179.738281 222.144531 Z M 226.574219 93.960938 C 228.503906 91.921875 231.046875 90.796875 233.734375 90.796875 C 236.417969 90.796875 238.960938 91.921875 240.890625 93.960938 L 282.714844 138.1875 C 286.898438 142.613281 286.898438 149.8125 282.714844 154.238281 L 278.578125 158.609375 L 222.011719 98.789062 Z M 187.820312 93.960938 C 189.75 91.921875 192.292969 90.796875 194.980469 90.796875 C 197.664062 90.796875 200.207031 91.921875 202.136719 93.960938 L 206.703125 98.789062 L 202.132812 103.621094 C 200.929688 104.898438 199.484375 105.816406 197.914062 106.324219 C 196.972656 106.628906 195.984375 106.789062 194.976562 106.789062 C 192.292969 106.789062 189.75 105.664062 187.820312 103.625 L 183.253906 98.792969 Z M 107.242188 154.234375 C 103.054688 149.808594 103.054688 142.609375 107.238281 138.183594 L 149.050781 93.960938 C 150.980469 91.921875 153.523438 90.796875 156.210938 90.796875 C 158.894531 90.796875 161.4375 91.917969 163.367188 93.960938 L 167.941406 98.796875 L 111.378906 158.609375 Z M 156.210938 242.617188 C 153.523438 242.617188 150.980469 241.492188 149.050781 239.449219 L 107.238281 195.226562 C 103.054688 190.800781 103.054688 183.601562 107.238281 179.175781 L 111.378906 174.800781 L 167.941406 234.617188 L 163.367188 239.453125 C 161.4375 241.492188 158.894531 242.617188 156.210938 242.617188 Z M 194.980469 242.617188 C 192.292969 242.617188 189.75 241.492188 187.820312 239.449219 L 183.25 234.617188 L 187.820312 229.789062 C 189.75 227.746094 192.292969 226.625 194.976562 226.625 C 197.660156 226.625 200.203125 227.75 202.136719 229.789062 L 206.703125 234.621094 L 202.136719 239.449219 C 200.207031 241.492188 197.664062 242.617188 194.980469 242.617188 Z M 282.714844 195.226562 L 240.890625 239.449219 C 238.960938 241.492188 236.417969 242.617188 233.734375 242.617188 C 231.046875 242.617188 228.503906 241.492188 226.574219 239.449219 L 222.011719 234.621094 L 278.578125 174.800781 L 282.714844 179.175781 C 286.898438 183.601562 286.898438 190.800781 282.714844 195.226562 Z M 282.714844 195.226562 " clip-rule="nonzero" /></clipPath></defs><g clip-path="url(#0ebf1e1b56)"><g clip-path="url(#c4699c050a)"><path fill="#0068FF" d="M 91.027344 79.671875 L 91.027344 253.542969 L 298.777344 253.542969 L 298.777344 79.671875 Z M 91.027344 79.671875 " fill-opacity="1" fill-rule="nonzero" /></g></g></svg>
          </div>
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
