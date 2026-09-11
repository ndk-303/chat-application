'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { Conversation, Message } from '../../../../types';
import { useCall } from '../../../../context/CallContext';
import Avatar from '../../../../components/ui/Avatar';
import Button from '../../../../components/ui/Button';

interface CallRecord {
  id: string;
  partner: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
  callType: 'audio' | 'video';
  status: 'ended' | 'missed' | 'rejected';
  duration: number;
  createdAt: string;
}

export default function CallHistoryPage() {
  const { startCall } = useCall();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Collect call records from user conversations
    const loadCalls = async () => {
      try {
        const res = await api.getConversations();
        const convList: Conversation[] = res.conversations || [];
        const records: CallRecord[] = [];

        // Check lastMessage of each conversation for call types
        for (const conv of convList) {
          if (conv.lastMessageId?.type === 'call' && conv.lastMessageId.callMeta) {
            const partnerUser = conv.participants?.find(
              (p) => p._id !== conv.lastMessageId?.senderId?._id
            ) || conv.lastMessageId.senderId;

            if (partnerUser) {
              records.push({
                id: conv.lastMessageId._id,
                partner: {
                  _id: partnerUser._id,
                  displayName: partnerUser.displayName,
                  avatar: partnerUser.avatar,
                },
                callType: conv.lastMessageId.callMeta.callType,
                status: conv.lastMessageId.callMeta.callStatus,
                duration: conv.lastMessageId.callMeta.callDuration,
                createdAt: conv.lastMessageId.createdAt,
              });
            }
          }
        }

        setCalls(records);
      } catch (err) {
        console.error('[CallHistory] Failed to load call logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCalls();
  }, []);

  const formatDuration = (secs: number) => {
    if (!secs) return '0s';
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    if (mins === 0) return `${remainder}s`;
    return `${mins}m ${remainder}s`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-surface flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Call History</h1>
          <p className="text-xs text-text-secondary mt-1">
            Recent direct WebRTC peer calls and logs
          </p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="py-20 text-center text-xs text-text-secondary">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading call records...
          </div>
        ) : calls.length === 0 ? (
          <div className="py-20 text-center text-xs text-text-secondary">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-3 text-text-secondary">
              <span className="material-symbols-outlined text-2xl">phone_missed</span>
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">No call records yet</h3>
            <p className="max-w-xs mx-auto leading-relaxed">
              When you make or receive audio and video calls, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <div
                key={call.id}
                className="p-3.5 bg-surface border border-border rounded-sm flex items-center justify-between hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={call.partner.displayName}
                    src={call.partner.avatar}
                    size="md"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">
                      {call.partner.displayName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary font-mono">
                      <span className="material-symbols-outlined text-sm">
                        {call.callType === 'video' ? 'videocam' : 'call'}
                      </span>
                      <span className="capitalize">{call.status}</span>
                      <span>•</span>
                      <span>{formatDuration(call.duration)}</span>
                      <span>•</span>
                      <span>{new Date(call.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startCall(call.partner._id, call.partner, call.callType)}
                    className="flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {call.callType === 'video' ? 'videocam' : 'call'}
                    </span>
                    <span>Call Back</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
