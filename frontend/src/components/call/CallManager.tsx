/**
 * CallManager is mounted once at the ChatPage root.
 * It holds the SINGLE useWebRTC() instance (which owns the RTCPeerConnection,
 * localStream, video refs). All child components receive props — never call
 * useWebRTC() again elsewhere.
 */
import { useEffect } from 'react';
import { useCallStore } from '../../stores/callStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import { IncomingCallModal } from './IncomingCallModal';
import { CallOverlay } from './CallOverlay';

export function CallManager() {
  const { status, remoteUser, pendingCallerId } = useCallStore();

  // ← THE ONLY place useWebRTC is called in the entire tree
  const {
    localVideoRef,
    remoteVideoRef,
    localStreamRef,
    remoteStreamRef,
    startCall,
    answerCall,
    endCall,
    toggleMic,
    toggleCamera,
  } = useWebRTC();

  // Register startCall into store so ChatHeader can call it without creating another useWebRTC instance
  useEffect(() => {
    useCallStore.getState().registerStartCall(startCall);
  }, [startCall]);

  const handleAccept = async () => {
    if (!pendingCallerId) return;
    await answerCall(pendingCallerId);
  };

  const handleDecline = () => {
    useCallStore.getState().reset();
  };

  return (
    <>
      {/* Incoming call popup (ringing state) */}
      <IncomingCallModal onAccept={handleAccept} onDecline={handleDecline} />

      {/* Active call overlay (calling / connected state) — receives refs from this single instance */}
      {remoteUser && (status === 'calling' || status === 'connected') && (
        <CallOverlay
          remoteUserId={remoteUser._id}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          localStreamRef={localStreamRef}
          remoteStreamRef={remoteStreamRef}
          endCall={endCall}
          toggleMic={toggleMic}
          toggleCamera={toggleCamera}
        />
      )}

      {/* "Call ended" brief notice */}
      {status === 'ended' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-[#1F2937] text-white text-sm px-5 py-3 rounded-full shadow-xl">
          Cuộc gọi đã kết thúc
        </div>
      )}
    </>
  );
}
