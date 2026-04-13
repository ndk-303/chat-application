import { useRef, useEffect, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { useCallStore } from '../stores/callStore';
import { toast } from 'sonner';
import api from '../lib/axios';

/** Fetches ICE server config from backend (includes TURN credentials if configured). */
async function fetchIceServers(): Promise<RTCConfiguration> {
  try {
    const res = await api.get<{ iceServers: RTCIceServer[] }>('/ice-servers');
    return { iceServers: res.data.iceServers };
  } catch {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }
}

interface UseWebRTCReturn {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  remoteStreamRef: React.MutableRefObject<MediaStream | null>;
  startCall: (targetUserId: string, callType: 'audio' | 'video') => Promise<void>;
  answerCall: (targetUserId: string) => Promise<void>;
  endCall: (targetUserId: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  isMicOn: React.MutableRefObject<boolean>;
  isCameraOn: React.MutableRefObject<boolean>;
}

export function useWebRTC(): UseWebRTCReturn {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const isMicOn = useRef(true);
  const isCameraOn = useRef(true);

  const createPeerConnection = useCallback(async (targetUserId: string): Promise<RTCPeerConnection> => {
    const iceConfig = await fetchIceServers();
    const pc = new RTCPeerConnection(iceConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        getSocket()?.emit('call:ice-candidate', {
          targetUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        useCallStore.getState().setConnected();
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanup();
        useCallStore.getState().reset();
      }
    };

    return pc;
  }, []);

  const getUserMedia = useCallback(async (type: 'audio' | 'video'): Promise<MediaStream> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Trình duyệt không thể truy cập camera/microphone. ' +
        'Vui lòng dùng HTTPS hoặc truy cập qua localhost.'
      );
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Bạn đã từ chối quyền truy cập camera/microphone.'
        : err?.name === 'NotFoundError'
        ? 'Không tìm thấy camera hoặc microphone.'
        : `Không thể mở media: ${err?.message ?? err}`;
      throw new Error(msg);
    }
  }, []);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    isMicOn.current = true;
    isCameraOn.current = true;
  }, []);

  const startCall = useCallback(async (targetUserId: string, type: 'audio' | 'video') => {
    try {
      const stream = await getUserMedia(type);
      const pc = await createPeerConnection(targetUserId);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const { user } = (await import('../stores/authStore')).useAuthStore.getState();

      getSocket()?.emit('call:offer', {
        targetUserId,
        offer,
        callType: type,
        callerInfo: {
          _id: user!._id,
          displayName: user!.displayName,
          avatar: user?.avatar,
        },
      });
    } catch (err: any) {
      cleanup();
      useCallStore.getState().reset();
      toast.error(err?.message || 'Không thể khởi tạo cuộc gọi.');
    }
  }, [getUserMedia, createPeerConnection, cleanup]);

  const answerCall = useCallback(async (callerId: string) => {
    const { pendingOffer, callType: type } = useCallStore.getState();
    if (!pendingOffer || !type) return;

    try {
      const stream = await getUserMedia(type);
      const pc = await createPeerConnection(callerId);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getSocket()?.emit('call:answer', { targetUserId: callerId, answer });
    } catch (err: any) {
      getSocket()?.emit('call:reject', { targetUserId: callerId, callType: type });
      cleanup();
      useCallStore.getState().reset();
      toast.error(err?.message || 'Không thể kết nối cuộc gọi.');
    }
  }, [getUserMedia, createPeerConnection, cleanup]);

  const endCall = useCallback((targetUserId: string) => {
    const { callType } = useCallStore.getState();
    getSocket()?.emit('call:end', { targetUserId, callType: callType ?? 'audio' });
    cleanup();
    useCallStore.getState().endCall();
    setTimeout(() => useCallStore.getState().reset(), 2000);
  }, [cleanup]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    isMicOn.current = !isMicOn.current;
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    isCameraOn.current = !isCameraOn.current;
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Failed to add ICE candidate', e);
      }
    };

    socket.on('call:answered', onAnswer);
    socket.on('call:ice-candidate', onIceCandidate);

    return () => {
      socket.off('call:answered', onAnswer);
      socket.off('call:ice-candidate', onIceCandidate);
    };
  }, []);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const stopOnUnload = () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
    window.addEventListener('beforeunload', stopOnUnload);
    return () => window.removeEventListener('beforeunload', stopOnUnload);
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    localStreamRef,
    remoteStreamRef,
    startCall,
    answerCall,
    endCall,
    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  };
}
