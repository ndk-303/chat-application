export interface User {
  _id: string;
  displayName: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  statusPreference?: 'online' | 'hidden';
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FriendRequest {
  _id: string;
  senderId: User | string;
  receiverId: User | string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FriendEntry {
  _id: string;
  displayName: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  friendshipId: string;
}

export interface ConversationMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Conversation {
  _id: string;
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  creatorId?: string;
  participants: User[];
  members?: ConversationMember[];
  lastMessageId?: Message;
  lastMessageAt?: string;
  pinnedMessageIds?: string[];
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  mutedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageFile {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  mimeType: string;
  type: 'image' | 'video' | 'raw';
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface SeenByUser {
  userId: string;
  seenAt: string;
}

export interface CallMeta {
  callType: 'audio' | 'video';
  callDuration: number;
  callStatus: 'ended' | 'missed' | 'rejected';
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  content: string;
  files?: MessageFile[];
  type?: 'text' | 'call';
  status?: 'sent' | 'delivered' | 'seen';
  seenBy?: SeenByUser[];
  reactions?: MessageReaction[];
  callMeta?: CallMeta;
  createdAt: string;
  updatedAt: string;
}

export interface IceServersResponse {
  iceServers: RTCIceServer[];
}
