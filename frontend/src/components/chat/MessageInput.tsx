import { useState, useRef, useCallback, useImperativeHandle, forwardRef, type KeyboardEvent } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { emitTypingStart, emitTypingStop } from '../../lib/socket';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  conversationId: string;
}

export interface MessageInputHandle {
  addFiles: (incoming: File[]) => void;
}

interface FilePreview {
  file: File;
  preview?: string;
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(
  function MessageInput({ conversationId }, ref) {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<FilePreview[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sendMessage = useChatStore((s) => s.sendMessage);

    const handleEmojiSelect = useCallback((emoji: string) => {
      const ta = textareaRef.current;
      if (!ta) {
        setText((prev) => prev + emoji);
        return;
      }
      const start = ta.selectionStart ?? text.length;
      const end = ta.selectionEnd ?? text.length;
      const next = text.slice(0, start) + emoji + text.slice(end);
      setText(next);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    }, [text]);

    // Exposed to parent (ChatWindow) so drag-drop can inject files
    useImperativeHandle(ref, () => ({
      addFiles(incoming: File[]) {
        const newPreviews: FilePreview[] = incoming.map((file) => ({
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));
        setFiles((prev) => [...prev, ...newPreviews].slice(0, 5));
        // Focus textarea so user can type a caption
        textareaRef.current?.focus();
      },
    }));

    const handleTyping = useCallback(() => {
      emitTypingStart(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStop(conversationId);
      }, 1500);
    }, [conversationId]);

    const handleSend = async () => {
      if ((!text.trim() && files.length === 0) || isSending) return;

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingStop(conversationId);

      setIsSending(true);
      const content = text.trim();
      const rawFiles = files.map((f) => f.file);

      setText('');
      setFiles([]);

      try {
        await sendMessage(conversationId, content, rawFiles.length > 0 ? rawFiles : undefined);
      } catch (err) {
        console.error('Failed to send message', err);
      } finally {
        setIsSending(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      const newFiles: FilePreview[] = selected.map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
      e.target.value = '';
    };

    const removeFile = (index: number) => {
      setFiles((prev) => {
        const f = prev[index];
        if (f.preview) URL.revokeObjectURL(f.preview);
        return prev.filter((_, i) => i !== index);
      });
    };

    const canSend = (text.trim().length > 0 || files.length > 0) && !isSending;

    return (
      <div className="bg-white border-t border-gray-100 p-4 relative">
        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((fp, i) => (
              <div key={i} className="relative group">
                {fp.preview ? (
                  <img
                    src={fp.preview}
                    alt={fp.file.name}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-14 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center px-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0068FF" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                    </svg>
                    <span className="text-[10px] text-gray-500 truncate w-full text-center mt-1">{fp.file.name.slice(0, 8)}...</span>
                  </div>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-end gap-2">
          {/* Attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10 transition-all mb-0.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden"
          />

          {/* Text input */}
          <div className="flex-1 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden focus-within:border-[#0068FF] focus-within:ring-2 focus-within:ring-[#0068FF]/15 transition-all">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn… (Enter để gửi)"
              rows={1}
              className="w-full px-4 py-3 text-sm text-gray-800 bg-transparent outline-none resize-none max-h-32 placeholder:text-gray-400 leading-relaxed"
              style={{ minHeight: '44px' }}
            />
          </div>

          {/* Emoji button + picker */}
          <div className="relative">
            <button
              ref={emojiButtonRef}
              title="Emoji"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-0.5 ${
                showEmojiPicker
                  ? 'text-[#0068FF] bg-[#0068FF]/10'
                  : 'text-gray-400 hover:text-[#0068FF] hover:bg-[#0068FF]/10'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
                triggerRef={emojiButtonRef}
              />
            )}
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-0.5 ${canSend
                ? 'bg-[#0068FF] text-white hover:bg-[#0052CC] hover:shadow-md hover:shadow-[#0068FF]/30 active:scale-90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isSending ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }
);
