import { useState, useRef, useCallback, useImperativeHandle, forwardRef, type KeyboardEvent } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { emitTypingStart, emitTypingStop } from '../../lib/socket';
import { EmojiPicker } from './EmojiPicker';
import {
  File, X, Paperclip, Smile, Loader2, SendHorizonal,
  Image, Pencil, AtSign, MoreHorizontal, SmilePlus, BookUser, LayoutTemplate,
} from 'lucide-react';

interface MessageInputProps {
  conversationId: string;
  conversationName?: string;
}

export interface MessageInputHandle {
  addFiles: (incoming: File[]) => void;
}

interface FilePreview {
  file: File;
  preview?: string;
}

/* ── Toolbar icon button ──────────────────────────────────────── */
function ToolbarBtn({
  title, onClick, children, active,
}: { title: string; onClick?: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0
        ${active
          ? 'text-[#0068FF] bg-[#0068FF]/10'
          : 'text-gray-500 hover:text-[#0068FF] hover:bg-gray-100'}`}
    >
      {children}
    </button>
  );
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  function MessageInput({ conversationId, conversationName }, ref) {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<FilePreview[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);   // all files
    const imageInputRef = useRef<HTMLInputElement>(null);  // images only
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sendMessage = useChatStore((s) => s.sendMessage);

    const handleEmojiSelect = useCallback((emoji: string) => {
      const ta = textareaRef.current;
      if (!ta) { setText((prev) => prev + emoji); return; }
      const start = ta.selectionStart ?? text.length;
      const end = ta.selectionEnd ?? text.length;
      const next = text.slice(0, start) + emoji + text.slice(end);
      setText(next);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    }, [text]);

    useImperativeHandle(ref, () => ({
      addFiles(incoming: File[]) {
        const newPreviews: FilePreview[] = incoming.map((file) => ({
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));
        setFiles((prev) => [...prev, ...newPreviews].slice(0, 5));
        textareaRef.current?.focus();
      },
    }));

    const handleTyping = useCallback(() => {
      emitTypingStart(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitTypingStop(conversationId), 1500);
    }, [conversationId]);

    const handleSend = async (content?: string, rawFiles?: globalThis.File[]) => {
      const msgContent = content ?? text.trim();
      const msgFiles = rawFiles ?? files.map((f) => f.file);
      if ((!msgContent && msgFiles.length === 0) || isSending) return;

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingStop(conversationId);

      setIsSending(true);
      setText('');
      setFiles([]);

      try {
        await sendMessage(conversationId, msgContent, msgFiles.length > 0 ? msgFiles : undefined);
      } catch (err) {
        console.error('Failed to send message', err);
      } finally {
        setIsSending(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const addFilesToState = (selected: globalThis.File[]) => {
      const newFiles: FilePreview[] = selected.map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    };

    const removeFile = (index: number) => {
      setFiles((prev) => {
        const f = prev[index];
        if (f.preview) URL.revokeObjectURL(f.preview);
        return prev.filter((_, i) => i !== index);
      });
    };

    const canSend = (text.trim().length > 0 || files.length > 0) && !isSending;
    const placeholder = conversationName
      ? `Nhập @, tin nhắn tới ${conversationName}`
      : 'Nhập tin nhắn… (Enter để gửi)';

    return (
      <div className="bg-white border-t border-gray-200 relative">

        {/* ── File Previews ─────────────────────────────────────────── */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2">
            {files.map((fp, i) => (
              <div key={i} className="relative group">
                {fp.preview ? (
                  <img
                    src={fp.preview}
                    alt={fp.file.name}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center px-2">
                    <File size={15} color="#0068FF" />
                    <span className="text-[9px] text-gray-500 truncate w-full text-center mt-0.5">
                      {fp.file.name.slice(0, 8)}…
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={8} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar row ───────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1 border-b border-gray-100">

          <ToolbarBtn title="Gửi hình ảnh" onClick={() => imageInputRef.current?.click()}>
            <Image size={17} />
          </ToolbarBtn>

          <ToolbarBtn title="Đính kèm tệp" onClick={() => fileInputRef.current?.click()}>
            <Paperclip size={17} />
          </ToolbarBtn>
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={(e) => { addFilesToState(Array.from(e.target.files || [])); e.target.value = ''; }}
          multiple
          accept="image/*,video/*"
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => { addFilesToState(Array.from(e.target.files || [])); e.target.value = ''; }}
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          className="hidden"
        />

        {/* ── Input row ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-3 py-1.5">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 text-[13px] text-gray-800 bg-transparent outline-none resize-none max-h-28 placeholder:text-gray-400 leading-relaxed py-1 min-h-[32px]"
          />

          {/* Emoji picker */}
          <div className="relative flex-shrink-0">
            <button
              ref={emojiButtonRef}
              title="Emoji"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                ${showEmojiPicker ? 'text-[#0068FF] bg-[#0068FF]/10' : 'text-gray-400 hover:text-[#0068FF] hover:bg-gray-100'}`}
            >
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
                triggerRef={emojiButtonRef}
              />
            )}
          </div>

          {/* Send button (when has content) OR Thumbs-up quick send */}
          {canSend ? (
            <button
              onClick={() => handleSend()}
              disabled={isSending}
              title="Gửi"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[#0068FF] text-white hover:bg-[#0052CC] active:scale-90 transition-all shadow-sm shadow-[#0068FF]/30"
            >
              {isSending
                ? <Loader2 size={15} className="animate-spin" />
                : <SendHorizonal size={15} />}
            </button>
          ) : (
            <button
              onClick={() => handleSend('👍')}
              title="Gửi 👍"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#F5A623] hover:bg-amber-50 hover:scale-110 active:scale-90 transition-all text-lg leading-none"
            >
              👍
            </button>
          )}
        </div>
      </div>
    );
  }
);


