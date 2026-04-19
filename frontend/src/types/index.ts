// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatar?: string | null;
  bio?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  statusPreference?: 'online' | 'hidden';
  lastSeen?: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

// ─── Message ─────────────────────────────────────────────────────────────────
export interface MessageFile {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  publicId?: string;
  type?: 'image' | 'video' | 'raw';
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: Pick<User, '_id' | 'displayName' | 'avatar' | 'email'>;
  content: string;
  type?: 'text' | 'system' | 'call';
  files?: MessageFile[];
  status: 'sent' | 'delivered' | 'seen';
  seenBy: Array<{ userId: string; seenAt: string }>;
  reactions?: MessageReaction[];
  callMeta?: {
    callType: 'audio' | 'video';
    callDuration: number; // seconds
    callStatus: 'ended' | 'missed' | 'rejected';
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Conversation ─────────────────────────────────────────────────────────────
export interface Conversation {
  _id: string;
  type: 'private' | 'group';
  participants: Pick<User, '_id' | 'displayName' | 'email' | 'avatar' | 'status'>[];
  name?: string;
  avatar?: string;
  adminId?: Pick<User, '_id' | 'displayName'>;
  lastMessageId?: Message;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  isMuted?: boolean;
  isPinned?: boolean;
}

// ─── Friend ───────────────────────────────────────────────────────────────────
export interface FriendRequest {
  _id: string;
  senderId: Pick<User, '_id' | 'displayName' | 'email' | 'avatar'>;
  receiverId: Pick<User, '_id' | 'displayName' | 'email' | 'avatar'>;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user?: User;
}
