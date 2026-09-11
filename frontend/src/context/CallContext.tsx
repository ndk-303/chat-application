'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { User } from '../types';

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface IncomingCallData {
  callerId: string;
  callerInfo: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
  offer: RTCSessionDescriptionInit;
  callType: CallType;
}

interface CallContextType {
  callState: CallState;
  callType: CallType;
  partner: {
    _id: string;
    displayName: string;
    avatar?: string;
  } | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  duration: number;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  callSummary: {
    duration: number;
    callType: CallType;
    partnerName: string;
  } | null;
  startCall: (targetUserId: string, targetUser: { _id: string; displayName: string; avatar?: string }, callType: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  closeSummary: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [partner, setPartner] = useState<{ _id: string; displayName: string; avatar?: string } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const [callSummary, setCallSummary] = useState<{ duration: number; callType: CallType; partnerName: string } | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Setup timer when call is connected
  useEffect(() => {
    if (callState === 'connected') {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Clean up WebRTC peer connection and streams
  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  }, []);

  // Initialize RTCPeerConnection with servers from /api/ice-servers
  const createPeerConnection = async (targetUserId: string): Promise<RTCPeerConnection> => {
    let iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    try {
      const res = await api.getIceServers();
      if (res.iceServers && res.iceServers.length > 0) {
        iceServers = res.iceServers;
      }
    } catch (err) {
      console.warn('[WebRTC] Using fallback STUN servers:', err);
    }

    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.streams);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Socket listener for incoming calls and signaling
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('[WebRTC] Incoming call:', data);
      if (callState !== 'idle') {
        // Busy
        socket.emit('call:reject', { targetUserId: data.callerId, callType: data.callType });
        return;
      }
      setIncomingCallData(data);
      setPartner(data.callerInfo);
      setCallType(data.callType);
      setCallState('incoming');
    };

    const handleCallAnswered = async (data: { answererId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Call answered:', data);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallState('connected');
      }
    };

    const handleIceCandidate = async (data: { senderId: string; candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    const handleCallRejected = () => {
      console.log('[WebRTC] Call was rejected');
      setCallState('ended');
      setTimeout(() => {
        cleanup();
        setCallState('idle');
      }, 1500);
    };

    const handleCallEnded = () => {
      console.log('[WebRTC] Call ended by peer');
      setCallSummary({
        duration,
        callType,
        partnerName: partner?.displayName || 'Contact',
      });
      setCallState('ended');
      setTimeout(() => {
        cleanup();
        setCallState('idle');
      }, 1000);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:answered', handleCallAnswered);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:answered', handleCallAnswered);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [socket, callState, duration, callType, partner, cleanup]);

  // Initiate an Outgoing Call
  const startCall = async (
    targetUserId: string,
    targetUser: { _id: string; displayName: string; avatar?: string },
    type: CallType
  ) => {
    if (!socket) return;
    setPartner(targetUser);
    setCallType(type);
    setCallState('calling');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = await createPeerConnection(targetUserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:offer', {
        targetUserId,
        offer,
        callType: type,
      });
    } catch (err: any) {
      console.error('[WebRTC] Error starting call:', err);
      alert('Không thể truy cập camera hoặc microphone');
      cleanup();
      setCallState('idle');
    }
  };

  // Answer an Incoming Call
  const answerCall = async () => {
    if (!incomingCallData || !socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCallData.callType === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = await createPeerConnection(incomingCallData.callerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        targetUserId: incomingCallData.callerId,
        answer,
      });

      setCallState('connected');
      setIncomingCallData(null);
    } catch (err: any) {
      console.error('[WebRTC] Error answering call:', err);
      rejectCall();
    }
  };

  // Reject Incoming Call
  const rejectCall = () => {
    if (incomingCallData && socket) {
      socket.emit('call:reject', {
        targetUserId: incomingCallData.callerId,
        callType: incomingCallData.callType,
      });
    }
    setIncomingCallData(null);
    cleanup();
    setCallState('idle');
  };

  // End Call
  const endCall = () => {
    if (partner && socket) {
      socket.emit('call:end', {
        targetUserId: partner._id,
        callType,
      });
    }
    setCallSummary({
      duration,
      callType,
      partnerName: partner?.displayName || 'Contact',
    });
    setCallState('ended');
    setTimeout(() => {
      cleanup();
      setCallState('idle');
    }, 1000);
  };

  // Toggle Microphone
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      // Revert to camera track
      if (originalVideoTrackRef.current && localStreamRef.current) {
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(originalVideoTrackRef.current);
        }
        originalVideoTrackRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender && sender.track) {
          originalVideoTrackRef.current = sender.track;
          await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('[WebRTC] Screen sharing failed:', err);
      }
    }
  };

  const closeSummary = () => {
    setCallSummary(null);
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        partner,
        localStream,
        remoteStream,
        duration,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        callSummary,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        closeSummary,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
