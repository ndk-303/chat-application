import { create } from 'zustand';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';

export interface RemoteUser {
  _id: string;
  displayName: string;
  avatar?: string | null;
}

interface CallState {
  status: CallStatus;
  callType: CallType | null;
  remoteUser: RemoteUser | null;
  isCaller: boolean;
  pendingOffer: RTCSessionDescriptionInit | null;
  pendingCallerId: string | null;

  // Function registered by CallManager (the single useWebRTC owner)
  startCallFn: ((targetUserId: string, type: CallType) => Promise<void>) | null;

  // Actions
  startOutgoingCall: (type: CallType, remoteUser: RemoteUser) => void;
  setIncomingCall: (callerId: string, callerInfo: RemoteUser, offer: RTCSessionDescriptionInit, callType: CallType) => void;
  setConnected: () => void;
  endCall: () => void;
  reset: () => void;
  registerStartCall: (fn: (targetUserId: string, type: CallType) => Promise<void>) => void;
}

const initialState = {
  status: 'idle' as CallStatus,
  callType: null,
  remoteUser: null,
  isCaller: false,
  pendingOffer: null,
  pendingCallerId: null,
  startCallFn: null,
};

export const useCallStore = create<CallState>((set) => ({
  ...initialState,

  startOutgoingCall: (type, remoteUser) =>
    set({
      status: 'calling',
      callType: type,
      remoteUser,
      isCaller: true,
      pendingOffer: null,
      pendingCallerId: null,
    }),

  setIncomingCall: (callerId, callerInfo, offer, callType) =>
    set({
      status: 'ringing',
      callType,
      remoteUser: callerInfo,
      isCaller: false,
      pendingOffer: offer,
      pendingCallerId: callerId,
    }),

  setConnected: () => set({ status: 'connected' }),

  endCall: () => set({ status: 'ended' }),

  reset: () => set({ ...initialState, startCallFn: useCallStore.getState().startCallFn }),

  registerStartCall: (fn) => set({ startCallFn: fn }),
}));

