'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Conversation, Message, User } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import { useSocket } from '../../../../context/SocketContext';
import Avatar from '../../../../components/ui/Avatar';
import Button from '../../../../components/ui/Button';
import GroupInfoDrawer from '../../../../components/chat/GroupInfoDrawer';

export default function ChatRoomPage() {
  const { chatId } = useParams() as { chatId: string };
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTypingPartner, setIsTypingPartner] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const fetchChatData = useCallback(async () => {
    if (!chatId) return;
    try {
      const [convRes, msgRes] = await Promise.all([
        api.getConversationById(chatId),
        api.getMessages(chatId, 50),
      ]);
      setConversation(convRes);
      setMessages(msgRes.messages || []);
      setTimeout(() => scrollToBottom(false), 50);
    } catch (err) {
      console.error('[ChatRoom] Failed to fetch conversation or messages:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    setLoading(true);
    fetchChatData();
  }, [fetchChatData]);

  // Join Socket Room and listen to events
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit('join_conversation', { conversationId: chatId });

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === chatId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();

        // If message is from someone else, mark seen
        if (msg.senderId?._id !== user?._id) {
          socket.emit('mark_seen', { conversationId: chatId, messageId: msg._id });
        }
      }
    };

    const handleMessageSeen = (data: { messageId: string; status: 'seen' | 'delivered' | 'sent' }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === data.messageId ? { ...m, status: data.status } : m))
      );
    };

    const handleMessageDeleted = (data: { messageId: string; conversationId: string }) => {
      if (data.conversationId === chatId) {
        setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
      }
    };

    const handleReactionUpdated = (data: {
      messageId: string;
      conversationId: string;
      reactions: any[];
    }) => {
      if (data.conversationId === chatId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === data.messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    };

    const handleTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === chatId && data.userId !== user?._id) {
        if (data.isTyping) {
          const partner = conversation?.participants?.find((p) => p._id === data.userId);
          setIsTypingPartner(partner?.displayName || 'Someone');
        } else {
          setIsTypingPartner(null);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_seen', handleMessageSeen);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction_updated', handleReactionUpdated);
    socket.on('typing', handleTyping);

    return () => {
      socket.emit('leave_conversation', { conversationId: chatId });
      socket.off('new_message', handleNewMessage);
      socket.off('message_seen', handleMessageSeen);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('typing', handleTyping);
    };
  }, [socket, chatId, user, conversation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !chatId) return;

    // Emit typing start
    socket.emit('typing_start', { conversationId: chatId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: chatId });
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && selectedFiles.length === 0) return;
    if (sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    const filesToSend = [...selectedFiles];

    setInputText('');
    setSelectedFiles([]);

    if (socket && chatId) {
      socket.emit('typing_stop', { conversationId: chatId });
    }

    try {
      await api.sendMessage(chatId, textToSend, filesToSend);
    } catch (err: any) {
      console.error('[ChatRoom] Failed to send message:', err);
      // Restore input on error
      setInputText(textToSend);
      setSelectedFiles(filesToSend);
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await api.toggleReaction(messageId, emoji);
      setActiveReactionMessageId(null);
    } catch (err) {
      console.error('[ChatRoom] Toggle reaction failed:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Bạn có muốn xóa tin nhắn này?')) return;
    try {
      await api.deleteMessage(messageId);
    } catch (err) {
      console.error('[ChatRoom] Delete message failed:', err);
    }
  };

  const getPartner = () => {
    if (!conversation) return null;
    if (conversation.type === 'group') {
      return {
        name: conversation.name || 'Group Chat',
        avatar: conversation.avatar,
        status: undefined,
        isGroup: true,
      };
    }
    const p = conversation.participants?.find((part) => part._id !== user?._id);
    return {
      name: p?.displayName || 'Direct Chat',
      avatar: p?.avatar,
      status: p?.status || 'offline',
      isGroup: false,
    };
  };

  const partner = getPartner();

  const handleStartCall = (callType: 'audio' | 'video') => {
    const target = conversation?.participants?.find((p) => p._id !== user?._id);
    if (!target) {
      alert('Chức năng gọi hiện hỗ trợ cuộc gọi 1-1');
      return;
    }
    router.push(`/calls/active?targetUserId=${target._id}&callType=${callType}&conversationId=${chatId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 h-full bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-text-secondary font-mono">Opening Encrypted DataChannel...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-background overflow-hidden relative">
      {/* Panel Header */}
      <header className="h-16 px-6 bg-surface border-b border-border flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar
            name={partner?.name || 'Chat'}
            src={partner?.avatar}
            size="md"
            status={partner?.status}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">{partner?.name}</h2>
              {partner?.isGroup && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-hover text-text-secondary border border-border font-medium">
                  {conversation?.participants?.length || 0} members
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary flex items-center gap-1.5 font-normal mt-0.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
              <span>{partner?.isGroup ? 'Mesh Multi-Peer' : 'WebRTC Direct E2EE'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!partner?.isGroup && (
            <>
              <button
                type="button"
                onClick={() => handleStartCall('audio')}
                className="h-8 px-3 rounded-sm border border-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
                title="Start Audio Call"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span className="hidden sm:inline">Audio Call</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartCall('video')}
                className="h-8 px-3 rounded-sm border border-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
                title="Start Video Call"
              >
                <span className="material-symbols-outlined text-base">videocam</span>
                <span className="hidden sm:inline">Video Call</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="h-8 w-8 rounded-sm border border-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center shadow-xs"
            title="Conversation Details"
          >
            <span className="material-symbols-outlined text-base">info</span>
          </button>
        </div>
      </header>

      {/* Message History Canvas */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto flex flex-col justify-start">
        {/* Date Divider */}
        <div className="flex items-center justify-center my-2">
          <span className="bg-surface border border-border text-xs text-text-secondary px-3 py-1 rounded-full font-medium shadow-xs">
            End-to-End Encrypted Session
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-secondary">
            No messages yet. Send a message to start communicating!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId?._id === user?._id;
            const msgTime = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg._id}
                className={`flex gap-3 group relative ${
                  isMe ? 'flex-col items-end ml-auto max-w-lg' : 'items-start max-w-lg'
                }`}
              >
                {!isMe && (
                  <Avatar
                    name={msg.senderId?.displayName || 'A'}
                    src={msg.senderId?.avatar}
                    size="sm"
                    className="mt-1"
                  />
                )}

                <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name in Group Chat */}
                  {!isMe && conversation?.type === 'group' && (
                    <span className="text-[11px] font-medium text-text-secondary pl-1">
                      {msg.senderId?.displayName}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative p-3.5 text-sm leading-relaxed shadow-sm break-words ${
                      isMe
                        ? 'bg-primary text-white rounded-2xl rounded-tr-sm'
                        : 'bg-surface border border-border text-text-primary rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    {msg.type === 'call' ? (
                      <div className="flex items-center gap-2 font-medium">
                        <span className="material-symbols-outlined text-base">
                          {msg.callMeta?.callType === 'video' ? 'videocam' : 'call'}
                        </span>
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <>
                        <p>{msg.content}</p>

                        {/* Files and Attachments */}
                        {msg.files && msg.files.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {msg.files.map((file, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-background/50 border border-border/40 p-2 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="material-symbols-outlined text-base text-primary shrink-0">
                                    {file.type === 'image'
                                      ? 'image'
                                      : file.type === 'video'
                                      ? 'movie'
                                      : 'attachment'}
                                  </span>
                                  <div className="truncate">
                                    <p className="truncate font-medium">{file.originalName}</p>
                                    <span className="text-[10px] font-mono text-text-secondary">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    download
                                  </span>
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer (Timestamp, Read receipt, Reactions, Actions) */}
                  <div className="flex items-center gap-2 px-1 text-[11px]">
                    <span className="text-text-secondary font-mono">{msgTime}</span>

                    {/* Delivery Status for My Messages */}
                    {isMe && (
                      <span className="material-symbols-outlined text-[14px] text-text-secondary">
                        {msg.status === 'seen'
                          ? 'done_all'
                          : msg.status === 'delivered'
                          ? 'done_all'
                          : 'done'}
                      </span>
                    )}

                    {/* Reactions Pill Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex items-center gap-1">
                        {msg.reactions.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleToggleReaction(msg._id, r.emoji)}
                            className="bg-surface border border-border px-1.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1 shadow-xs hover:border-primary transition-colors"
                          >
                            <span>{r.emoji}</span>
                            <span className="font-mono text-[10px] text-text-secondary">
                              {r.userIds?.length || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hover Reaction Trigger */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReactionMessageId(
                            activeReactionMessageId === msg._id ? null : msg._id
                          )
                        }
                        className="text-text-secondary hover:text-text-primary p-0.5"
                        title="React"
                      >
                        <span className="material-symbols-outlined text-sm">add_reaction</span>
                      </button>

                      {isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="text-text-secondary hover:text-error p-0.5"
                          title="Delete message"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reaction Picker Popover */}
                  {activeReactionMessageId === msg._id && (
                    <div className="bg-surface border border-border rounded-full px-2 py-1 flex items-center gap-2 shadow-xl z-20 mt-1 animate-in fade-in">
                      {['👍', '❤️', '🔥', '👏', '😂', '🎉'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg._id, emoji)}
                          className="hover:scale-125 transition-transform text-sm p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Realtime Typing Indicator */}
        {isTypingPartner && (
          <div className="flex items-center gap-2 text-xs text-text-secondary font-mono italic animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{isTypingPartner} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Attachments Preview Bar */}
      {selectedFiles.length > 0 && (
        <div className="px-6 py-2 bg-surface border-t border-border flex items-center gap-2 overflow-x-auto">
          {selectedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1 rounded-sm text-xs text-text-primary shrink-0"
            >
              <span className="material-symbols-outlined text-sm text-primary">attachment</span>
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                className="text-text-secondary hover:text-error ml-1"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Composer Bar */}
      <div className="p-4 bg-surface border-t border-border z-10 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files) {
                setSelectedFiles(Array.from(e.target.files).slice(0, 5));
              }
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-text-secondary hover:text-text-primary rounded-sm hover:bg-surface-hover transition-colors"
            title="Attach file"
          >
            <span className="material-symbols-outlined text-lg">attach_file</span>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-background border border-border rounded-sm px-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />

          <Button
            type="submit"
            disabled={!inputText.trim() && selectedFiles.length === 0}
            loading={sending}
            size="sm"
            className="px-4 py-2 rounded-sm"
          >
            <span className="material-symbols-outlined text-base">send</span>
          </Button>
        </form>
      </div>

      {/* Drawer */}
      {conversation && (
        <GroupInfoDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          conversation={conversation}
          currentUser={user}
          onConversationUpdated={fetchChatData}
        />
      )}
    </div>
  );
}
