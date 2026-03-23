import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';
import { emitSetStatus } from '../../lib/socket';

const STATUS_OPTIONS = [
  { value: 'online',  label: 'Trực tuyến',    color: '#22C55E' },
  { value: 'offline', label: 'Ẩn trạng thái', color: '#9CA3AF' },
] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [status, setStatus] = useState<'online' | 'offline'>(
    user?.status === 'offline' ? 'offline' : 'online'
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      setError('Tên hiển thị không được để trống');
      return;
    }
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      let newAvatarUrl: string | undefined;

      // Upload new avatar if selected
      if (avatarFile) {
        const res = await userService.uploadAvatar(avatarFile);
        newAvatarUrl = res.avatar;
      }

      // Update profile fields
      const updated = await userService.updateCurrentProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        ...(newAvatarUrl ? { avatar: newAvatarUrl } : {}),
      });

      // Update status via socket (backend presenceHandler handles DB + broadcast to friends)
      if (status !== user?.status) {
        emitSetStatus(status);
      }

      // Update local store
      setUser({ ...user!, ...updated.user ?? updated, status, ...(newAvatarUrl ? { avatar: newAvatarUrl } : {}) });
      setSuccess('Cập nhật hồ sơ thành công!');
      setAvatarFile(null);
      setAvatarPreview(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu hồ sơ thất bại');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, bio, status, avatarFile, user, setUser]);

  if (!isOpen) return null;

  const currentAvatar = avatarPreview ?? user?.avatar;
  const initials = (user?.displayName?.[0] ?? '?').toUpperCase();
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ animation: 'modalSlideIn 0.22s cubic-bezier(.34,1.48,.64,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <h2 className="text-base font-bold text-[#1F2937]">Chỉnh sửa hồ sơ</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh]">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-[#0068FF]/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center text-3xl font-bold ring-4 ring-[#0068FF]/20">
                  {initials}
                </div>
              )}
              {/* Status badge */}
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: currentStatus?.color ?? '#22C55E' }}
              />
              {/* Hover overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#0068FF] font-medium hover:underline"
            >
              Đổi ảnh đại diện
            </button>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">Trạng thái</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    status === opt.value
                      ? 'border-[#0068FF] bg-[#E6F0FF] text-[#0068FF]'
                      : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#0068FF]/40 hover:bg-[#F5F7FA]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Tên hiển thị</label>
            <input
              type="text"
              value={displayName}
              maxLength={50}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#1F2937] bg-white outline-none focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 transition-all placeholder:text-[#9CA3AF]"
              placeholder="Tên hiển thị của bạn"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-1 text-right">{displayName.length}/50</p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Email</label>
            <div className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#9CA3AF] bg-[#F5F7FA] select-all cursor-text">
              {user?.email}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">Giới thiệu</label>
            <textarea
              value={bio}
              maxLength={200}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Giới thiệu về bạn…"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#1F2937] bg-white outline-none focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15 transition-all resize-none placeholder:text-[#9CA3AF]"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-1 text-right">{bio.length}/200</p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0F2F5] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#6B7280] hover:bg-[#F5F7FA] transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !displayName.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#0068FF] text-white text-sm font-semibold hover:bg-[#0052CC] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Đang lưu…
              </>
            ) : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.93) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}
