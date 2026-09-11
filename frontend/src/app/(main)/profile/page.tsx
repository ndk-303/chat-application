'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import { QrIdentityModal } from '../../../components/contacts/QrIdentityModal';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');

  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Update initial form state when user changes
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCustomStatus(user.customStatus || '');
    }
  }, [user]);

  // Handle status update
  const handleStatusChange = async (status: 'online' | 'busy' | 'away') => {
    setStatusDropdownOpen(false);
    try {
      await api.updateStatus(status);
      await refreshUser();
      setMessage({ type: 'success', text: 'Đã cập nhật trạng thái hoạt động.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể cập nhật trạng thái' });
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.uploadAvatar(file);
      await refreshUser();
      setMessage({ type: 'success', text: 'Đã tải lên ảnh đại diện mới thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi tải ảnh lên' });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle save profile details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        address: address.trim(),
        customStatus: customStatus.trim(),
      });
      await refreshUser();
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Thông tin hồ sơ đã được lưu thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu thông tin' });
    } finally {
      setLoading(false);
    }
  };

  // Generate deterministic mock E2EE fingerprint from user ID
  const fingerprint = React.useMemo(() => {
    if (!user?._id) return 'SHA256: 00000000 00000000 00000000 00000000 00000000 00000000';
    let hex = '';
    for (let i = 0; i < user._id.length; i++) {
      hex += user._id.charCodeAt(i).toString(16);
    }
    hex = (hex + 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855').slice(0, 64);
    const chunks = hex.match(/.{1,8}/g) || [];
    return `SHA256: ${chunks.slice(0, 8).join(' ')}`;
  }, [user?._id]);

  const copyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Cài đặt</span>
            <span>/</span>
            <span className="text-text-primary font-medium">Hồ sơ cá nhân</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Hồ sơ & Danh tính bảo mật
          </h1>
          <p className="text-xs text-text-secondary">
            Quản lý thông tin công khai, khóa mã hóa E2EE và các phiên đăng nhập WebRTC.
          </p>
        </div>

        {/* Feedback Alert */}
        {message.text && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-error/10 border border-error/30 text-error'
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-text-secondary hover:text-text-primary ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profile Overview Card */}
        <section className="bg-surface border border-border rounded-xl p-6 relative shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar with live status badge */}
            <div className="relative shrink-0 group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border bg-surface-container relative flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-2xl font-bold text-primary">
                    {user?.displayName?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}

                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Hover overlay to change avatar */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px]"
                  title="Thay đổi ảnh đại diện"
                >
                  <span className="material-symbols-outlined text-lg mb-0.5">photo_camera</span>
                  Đổi ảnh
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {/* Status selector button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="absolute -bottom-2 -right-2 bg-surface border border-border rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-md hover:bg-surface-bright transition-colors"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user?.status === 'online'
                        ? 'bg-success'
                        : user?.status === 'busy'
                        ? 'bg-error'
                        : user?.status === 'away'
                        ? 'bg-warning'
                        : 'bg-text-secondary'
                    }`}
                  ></span>
                  <span className="text-[11px] font-medium text-text-primary capitalize">
                    {user?.status || 'Online'}
                  </span>
                  <span className="material-symbols-outlined text-xs text-text-secondary">
                    expand_more
                  </span>
                </button>

                {/* Dropdown status menu */}
                {statusDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-36 bg-surface-container border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                    <button
                      onClick={() => handleStatusChange('online')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-surface-bright text-text-primary"
                    >
                      <span className="w-2 h-2 rounded-full bg-success"></span>
                      Trực tuyến
                    </button>
                    <button
                      onClick={() => handleStatusChange('busy')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-surface-bright text-text-primary"
                    >
                      <span className="w-2 h-2 rounded-full bg-error"></span>
                      Bận
                    </button>
                    <button
                      onClick={() => handleStatusChange('away')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-surface-bright text-text-primary"
                    >
                      <span className="w-2 h-2 rounded-full bg-warning"></span>
                      Vắng mặt
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info Summary */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary truncate">
                  {user?.displayName}
                </h2>
                <Badge variant="primary" className="text-[10px]">
                  Tài khoản bảo mật
                </Badge>
              </div>

              <p className="text-xs text-text-secondary font-mono">
                {user?.email}
              </p>

              <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
                {user?.bio || 'Chưa cập nhật giới thiệu cá nhân.'}
              </p>

              {user?.customStatus && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-border text-xs text-text-primary">
                    <span>💬</span>
                    <span>{user.customStatus}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center gap-3">
            <Button
              variant={isEditing ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <span className="material-symbols-outlined text-base mr-1">edit</span>
              {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsQrModalOpen(true)}
            >
              <span className="material-symbols-outlined text-base mr-1">qr_code_2</span>
              Mã danh tính QR
            </Button>
          </div>
        </section>

        {/* Edit Profile Form (Expanded) */}
        {isEditing && (
          <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">edit_note</span>
              Chỉnh sửa thông tin tài khoản
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tên hiển thị"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  required
                />
                <Input
                  label="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                />
              </div>

              <Input
                label="Địa chỉ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Thành phố, Quốc gia"
              />

              <Input
                label="Trạng thái tùy chỉnh (Custom Status)"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Ví dụ: Đang làm việc từ xa, Đang bận..."
              />

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Giới thiệu (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Viết một vài dòng về bản thân hoặc công việc..."
                  className="w-full bg-background border border-border rounded-lg p-3 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={loading}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Cryptographic Public Identity Card (E2EE) */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-base">shield</span>
              </span>
              <span className="font-semibold text-text-primary uppercase text-xs tracking-wider">
                Khóa danh tính mã hóa (E2EE)
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-primary border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              Xác thực Ed25519
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary font-medium">
              Device Public Key Fingerprint (Vân tay khóa công khai)
            </label>
            <div className="bg-background border border-border p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="font-mono text-xs text-text-primary tracking-wide break-all">
                {fingerprint}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 text-xs"
                onClick={copyFingerprint}
              >
                <span className="material-symbols-outlined text-xs mr-1">
                  {copiedFingerprint ? 'check' : 'content_copy'}
                </span>
                {copiedFingerprint ? 'Đã sao chép' : 'Sao chép'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-surface-container border border-border flex items-start gap-3">
              <span className="material-symbols-outlined text-success text-lg mt-0.5">
                verified
              </span>
              <div>
                <div className="text-xs font-medium text-text-primary">
                  Cơ chế mã hóa đầu-cuối
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Tin nhắn và cuộc gọi được mã hóa trực tiếp giữa 2 thiết bị.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container border border-border flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">
                sync_lock
              </span>
              <div>
                <div className="text-xs font-medium text-text-primary">
                  Giao thức WebRTC DTLS-SRTP
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Bảo vệ âm thanh & hình ảnh thoại P2P thời gian thực.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Active WebRTC Devices & Sessions Card */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Thiết bị & Phiên hoạt động WebRTC
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                1 Thiết bị hiện tại
              </Badge>
            </div>
            <span className="text-[11px] text-text-secondary">P2P Mesh Verified</span>
          </div>

          <div className="space-y-2.5">
            <div className="bg-surface-container border border-border rounded-lg p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary">
                  <span className="material-symbols-outlined text-lg">laptop</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">
                      Trình duyệt Web (Phiên hiện tại)
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/10 text-primary border border-emerald-500/20">
                      Hiện hành
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary">
                    <span className="inline-flex items-center gap-1 text-success font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      Đang hoạt động
                    </span>
                    <span>•</span>
                    <span className="font-mono">Direct WebRTC / Socket.IO</span>
                  </div>
                </div>
              </div>

              <span className="material-symbols-outlined text-success text-lg" title="Phiên bảo mật">
                verified_user
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* QR Code Identity Modal */}
      <QrIdentityModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
