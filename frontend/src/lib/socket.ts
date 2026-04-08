import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const initSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket;

  // If a stale socket exists, clean it up first
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ['websocket'],   // Skip polling — prevents 400 errors when scaled (polling sid is backend-specific)
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and cleaned up.');
  }
};

export const joinConversation = (conversationId: string): void => {
  socket?.emit('join_conversation', { conversationId });
};

export const leaveConversation = (conversationId: string): void => {
  socket?.emit('leave_conversation', { conversationId });
};

export const emitTypingStart = (conversationId: string): void => {
  socket?.emit('typing_start', { conversationId });
};

export const emitTypingStop = (conversationId: string): void => {
  socket?.emit('typing_stop', { conversationId });
};

export const emitMarkSeen = (conversationId: string, messageId: string): void => {
  socket?.emit('mark_seen', { conversationId, messageId });
};

export const emitSetStatus = (status: 'online' | 'offline'): void => {
  socket?.emit('set_status', { status });
};
