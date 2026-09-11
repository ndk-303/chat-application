'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { user, updateProfile, uploadAvatar } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bio, setBio] = useState('');
  const [mediaReady, setMediaReady] = useState(false);
  const [testingMedia, setTestingMedia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      if (user.displayName) setDisplayName(user.displayName);
      if (user.avatar) setAvatarPreview(user.avatar);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleTestMedia = async () => {
    setTestingMedia(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMediaReady(true);
        // Stop stream immediately after successful test
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setMediaReady(false);
      setError('Could not access microphone/camera. Please check browser permissions.');
    } finally {
      setTestingMedia(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedFile) {
        await uploadAvatar(selectedFile);
      }
      if (displayName && displayName !== user?.displayName) {
        await updateProfile({ displayName });
      }
      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'Cập nhật hồ sơ không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] my-auto">
      <div className="bg-surface border border-border rounded-xl p-8 shadow-2xl relative">
        {/* Card Header */}
        <div className="text-left">
          <h1 className="text-2xl text-text-primary font-bold tracking-tight">Set up your profile</h1>
          <p className="text-text-secondary text-sm mt-1.5">Choose how you appear to contacts and colleagues.</p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-sm bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Avatar Upload Section */}
        <div className="mt-6 pt-2 pb-1 flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {/* Avatar Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-[72px] h-[72px] rounded-full bg-background border border-border flex items-center justify-center text-text-primary font-semibold text-xl tracking-tight group cursor-pointer shrink-0 overflow-hidden"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span className="select-none text-xl">
                {displayName ? displayName.slice(0, 2).toUpperCase() : 'AM'}
              </span>
            )}
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center absolute bottom-0 right-0 shadow ring-2 ring-surface hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            </div>
          </div>

          {/* Avatar Controls */}
          <div className="flex flex-col gap-1">
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-sm bg-surface-hover hover:bg-[#252a33] border border-border text-text-primary text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-text-secondary">upload</span>
                <span>Upload new image</span>
              </button>
            </div>
            <span className="text-text-secondary text-[12px] leading-tight mt-0.5">
              JPG, PNG or WebP. Max 5MB
            </span>
          </div>
        </div>

        {/* Form Inputs */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Display Name */}
          <div>
            <label className="block text-text-secondary text-[11px] font-medium tracking-wider mb-1.5 uppercase font-mono" htmlFor="displayName">
              FULL NAME / DISPLAY NAME
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full bg-background border border-border rounded-sm px-3.5 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-text-secondary text-[11px] font-medium tracking-wider mb-1.5 uppercase font-mono" htmlFor="bio">
              STATUS / BIO
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief status or role (e.g. Protocol Engineer)"
              className="w-full bg-background border border-border rounded-sm px-3.5 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Device Check Row (WebRTC Check) */}
          <div className="bg-background border border-border rounded-sm p-3 flex items-center justify-between mt-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-text-secondary">
                <span className="material-symbols-outlined text-[16px]">videocam</span>
                <span className="material-symbols-outlined text-[16px]">mic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block ${
                    mediaReady ? 'bg-success' : 'bg-warning'
                  }`}
                />
                <span className="text-text-primary text-xs font-medium">
                  {mediaReady ? 'Camera & microphone ready' : 'Hardware permissions ready to test'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestMedia}
              disabled={testingMedia}
              className="text-text-secondary hover:text-text-primary text-xs font-medium px-2.5 py-1 rounded-sm hover:bg-surface border border-transparent hover:border-border transition-colors"
            >
              {testingMedia ? 'Checking...' : mediaReady ? 'Verified' : 'Test'}
            </button>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full py-3 rounded-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Complete Setup & Open Chat</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Button>

            {/* Skip */}
            <Link
              href="/chat"
              className="text-text-secondary hover:text-primary text-xs text-center block mt-4 transition-colors font-medium"
            >
              Skip this step for now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
