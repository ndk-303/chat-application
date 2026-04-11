import { useEffect, useRef, useState, useCallback } from 'react';
import { useCallStore } from '../../stores/callStore';
import { VideoOff, MicOff, Mic, Phone, Video } from 'lucide-react';

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
              className="w-28 h-28 rounded-full object-cover border-4 border-white/40 shadow-2xl" />
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
              <VideoOff size={28} color="white" strokeWidth={1.5} />
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
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${micEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-[#0068FF]'
            }`}
        >
          {micEnabled ? (
            <Mic size={22} />
          ) : (
            <MicOff size={22} />
          )}
        </button>

        {/* End call */}
        <button
          onClick={handleEnd}
          title="Kết thúc cuộc gọi"
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
        >
          <Phone size={26} color="white" strokeWidth={2.5} />
        </button>

        {/* Camera (video calls only) */}
        {isVideo && (
          <button
            onClick={handleToggleCamera}
            title={cameraEnabled ? 'Tắt camera' : 'Bật camera'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${cameraEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-[#0068FF]'
              }`}
          >
            {cameraEnabled ? (
              <Video size={22} />
            ) : (
              <VideoOff size={22} />
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
