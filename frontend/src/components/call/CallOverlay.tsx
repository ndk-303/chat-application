import { useEffect, useRef, useState, useCallback } from 'react';
import { useCallStore } from '../../stores/callStore';

interface Props {
  remoteUserId: string;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  remoteStreamRef: React.MutableRefObject<MediaStream | null>;
  endCall: (targetUserId: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallOverlay({
  remoteUserId,
  localVideoRef,
  remoteVideoRef,
  localStreamRef,
  remoteStreamRef,
  endCall,
  toggleMic,
  toggleCamera,
}: Props) {
  const { status, callType, remoteUser, isCaller } = useCallStore();

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = status === 'connected';
  const isVideo = callType === 'video';

  // Re-attach streams when the overlay mounts (fixes race condition for callee:
  // getUserMedia and ontrack may fire before the <video> elements are in the DOM)
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      // Re-attach remote stream in case ontrack fired while status was still 'calling'
      // (the remote video is conditionally rendered, so might have just mounted)
      if (remoteVideoRef.current && remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isConnected, remoteStreamRef, remoteVideoRef]);

  const handleToggleMic = useCallback(() => {
    toggleMic();
    setMicEnabled((v) => !v);
  }, [toggleMic]);

  const handleToggleCamera = useCallback(() => {
    toggleCamera();
    setCameraEnabled((v) => !v);
  }, [toggleCamera]);

  const handleEnd = useCallback(() => {
    endCall(remoteUserId);
  }, [endCall, remoteUserId]);

  if (!remoteUser) return null;

  const initials = (remoteUser.displayName?.[0] ?? '?').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col"
      style={{
        background: isVideo ? '#000' : 'linear-gradient(135deg, #0068FF 0%, #0040CC 100%)',
        animation: 'callOverlayIn 0.3s ease-out',
      }}
    >
      {/* Remote video (full screen) — always rendered, hidden for audio so ref stays bound */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${!isVideo ? 'hidden' : ''}`}
      />

      {/* Audio call or video pre-connect: avatar + info */}
      {(!isVideo || !isConnected) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
          {remoteUser.avatar ? (
            <img src={remoteUser.avatar} alt={remoteUser.displayName}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/40 shadow-2xl"/>
          ) : (
            <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-5xl font-bold">
              {initials}
            </div>
          )}
          <h2 className="text-2xl font-bold">{remoteUser.displayName}</h2>
          <p className="text-sm text-white/70">
            {isConnected ? formatDuration(duration) : (isCaller ? 'Đang gọi...' : 'Đang kết nối...')}
          </p>
        </div>
      )}

      {/* Connected duration overlay (video mode) */}
      {isVideo && isConnected && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur-sm">
          {formatDuration(duration)}
        </div>
      )}

      {/* Local video PiP — always rendered in video mode so ref gets bound */}
      {isVideo && (
        <div className="absolute bottom-28 right-5 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-gray-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {!cameraEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Control bar */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-6">
        {/* Mic */}
        <button
          onClick={handleToggleMic}
          title={micEnabled ? 'Tắt micro' : 'Bật micro'}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
            micEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-[#0068FF]'
          }`}
        >
          {micEnabled ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>

        {/* End call */}
        <button
          onClick={handleEnd}
          title="Kết thúc cuộc gọi"
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.38 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72A12 12 0 0 0 9.25 5.5a2 2 0 0 1-.45 2.11L7.51 8.9"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>

        {/* Camera (video calls only) */}
        {isVideo && (
          <button
            onClick={handleToggleCamera}
            title={cameraEnabled ? 'Tắt camera' : 'Bật camera'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              cameraEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-[#0068FF]'
            }`}
          >
            {cameraEnabled ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><circle cx="12" cy="13" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>

      <style>{`
        @keyframes callOverlayIn {
          from { opacity:0; transform: scale(0.97); }
          to   { opacity:1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
