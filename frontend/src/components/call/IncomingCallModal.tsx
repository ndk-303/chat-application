import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../stores/callStore';
import { getSocket } from '../../lib/socket';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

const RING_TIMEOUT_MS = 30_000;

export function IncomingCallModal({ onAccept, onDecline }: Props) {
  const { status, callType, remoteUser, pendingCallerId } = useCallStore();
  const [remaining, setRemaining] = useState(30);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRinging = status === 'ringing';

  useEffect(() => {
    if (!isRinging) return;
    setRemaining(30);

    // Auto-dismiss after 30 s
    timerRef.current = setTimeout(() => {
      if (pendingCallerId) {
        getSocket()?.emit('call:reject', { targetUserId: pendingCallerId });
      }
      onDecline();
    }, RING_TIMEOUT_MS);

    tickRef.current = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isRinging]);

  if (!isRinging || !remoteUser) return null;

  const isVideo = callType === 'video';
  const initials = (remoteUser.displayName?.[0] ?? '?').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-80 overflow-hidden text-center"
        style={{ animation: 'callSlideIn 0.3s cubic-bezier(.34,1.48,.64,1)' }}
      >
        {/* Top area */}
        <div className="bg-gradient-to-b from-[#0068FF] to-[#0052CC] px-6 pt-8 pb-10 text-white">
          <p className="text-sm font-medium opacity-80 mb-3">
            {isVideo ? '📹 Cuộc gọi video' : '📞 Cuộc gọi thoại'}
          </p>

          {/* Avatar with pulsing ring */}
          <div className="relative flex items-center justify-center mb-4">
            <span className="absolute w-28 h-28 rounded-full bg-white/20 animate-ping" />
            <span className="absolute w-24 h-24 rounded-full bg-white/25 animate-ping" style={{ animationDelay: '0.3s' }} />
            {remoteUser.avatar ? (
              <img src={remoteUser.avatar} alt={remoteUser.displayName}
                className="relative w-20 h-20 rounded-full object-cover border-4 border-white/60 z-10" />
            ) : (
              <div className="relative w-20 h-20 rounded-full bg-white/30 border-4 border-white/60 flex items-center justify-center text-3xl font-bold z-10">
                {initials}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold">{remoteUser.displayName}</h2>
          <p className="text-sm opacity-70 mt-1">Đang đổ chuông... ({remaining}s)</p>
        </div>

        {/* Buttons */}
        <div className="flex divide-x divide-gray-100">
          {/* Decline */}
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              if (tickRef.current) clearInterval(tickRef.current);
              if (pendingCallerId) {
                getSocket()?.emit('call:reject', { targetUserId: pendingCallerId });
              }
              onDecline();
            }}
            className="flex-1 py-5 flex flex-col items-center gap-1.5 hover:bg-red-50 transition-colors group"
          >
            <span className="w-12 h-12 rounded-full bg-red-500 group-hover:bg-red-600 flex items-center justify-center transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.38 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72A12 12 0 0 0 9.25 5.5a2 2 0 0 1-.45 2.11L7.51 8.9"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </span>
            <span className="text-xs font-semibold text-red-500">Từ chối</span>
          </button>

          {/* Accept */}
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              if (tickRef.current) clearInterval(tickRef.current);
              onAccept();
            }}
            className="flex-1 py-5 flex flex-col items-center gap-1.5 hover:bg-green-50 transition-colors group"
          >
            <span className="w-12 h-12 rounded-full bg-[#22C55E] group-hover:bg-green-600 flex items-center justify-center transition-colors">
              {isVideo ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.41 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              )}
            </span>
            <span className="text-xs font-semibold text-green-600">Chấp nhận</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes callSlideIn {
          from { opacity:0; transform: scale(0.9) translateY(16px); }
          to   { opacity:1; transform: scale(1)  translateY(0); }
        }
      `}</style>
    </div>
  );
}
