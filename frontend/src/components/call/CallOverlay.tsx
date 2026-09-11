'use client';

import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import Avatar from '../ui/Avatar';

export const CallOverlay: React.FC = () => {
  const {
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
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    closeSummary,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // 1. Incoming Call Notification Modal
  if (callState === 'incoming' && partner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0F12]/80 backdrop-blur-md">
        <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 shadow-2xl text-center animate-in zoom-in-95">
          <div className="relative inline-block mb-4">
            <Avatar name={partner.displayName} src={partner.avatar} size="xl" />
            <span className="w-4 h-4 rounded-full bg-success absolute bottom-0 right-0 ring-2 ring-surface animate-ping" />
          </div>

          <h3 className="text-base font-bold text-text-primary">{partner.displayName}</h3>
          <p className="text-xs text-text-secondary mt-1 font-mono">
            Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={rejectCall}
              className="w-12 h-12 rounded-full bg-error hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              title="Decline"
            >
              <span className="material-symbols-outlined text-2xl">call_end</span>
            </button>

            <button
              type="button"
              onClick={answerCall}
              className="w-12 h-12 rounded-full bg-success hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-bounce"
              title="Accept"
            >
              <span className="material-symbols-outlined text-2xl">
                {callType === 'video' ? 'videocam' : 'call'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Call Modal (Calling or Connected)
  if (callState === 'calling' || callState === 'connected') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0D0F12] flex flex-col justify-between">
        {/* Call Header */}
        <header className="p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary">
                {partner?.displayName || 'Peer Call'}
              </h4>
              <p className="text-[11px] font-mono text-text-secondary">
                {callState === 'calling'
                  ? 'Calling peer...'
                  : `Connected • ${formatDuration(duration)}`}
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] font-mono text-success flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>WebRTC DTLS-SRTP</span>
          </div>
        </header>

        {/* Video Canvas Stage */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
          {callType === 'video' && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain rounded-xl max-h-[80vh]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Avatar
                name={partner?.displayName || 'Peer'}
                src={partner?.avatar}
                size="xl"
                className="w-28 h-28 text-3xl mb-4 shadow-2xl"
              />
              <h3 className="text-xl font-bold text-text-primary">{partner?.displayName}</h3>
              <p className="text-xs font-mono text-text-secondary mt-1">
                {callState === 'calling' ? 'Ringing...' : formatDuration(duration)}
              </p>
            </div>
          )}

          {/* Self Video PIP Preview */}
          {callType === 'video' && localStream && (
            <div className="absolute bottom-6 right-6 w-48 h-32 rounded-lg overflow-hidden border border-border bg-surface shadow-2xl z-10">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Floating Call Action Controls */}
        <div className="p-6 flex justify-center items-center gap-4 z-10">
          <button
            type="button"
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isAudioMuted
                ? 'bg-error text-white'
                : 'bg-surface hover:bg-surface-hover border border-border text-text-primary'
            }`}
            title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            <span className="material-symbols-outlined text-xl">
              {isAudioMuted ? 'mic_off' : 'mic'}
            </span>
          </button>

          {callType === 'video' && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isVideoMuted
                  ? 'bg-error text-white'
                  : 'bg-surface hover:bg-surface-hover border border-border text-text-primary'
              }`}
              title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
            >
              <span className="material-symbols-outlined text-xl">
                {isVideoMuted ? 'videocam_off' : 'videocam'}
              </span>
            </button>
          )}

          {callType === 'video' && (
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isScreenSharing
                  ? 'bg-primary text-white'
                  : 'bg-surface hover:bg-surface-hover border border-border text-text-primary'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <span className="material-symbols-outlined text-xl">screen_share</span>
            </button>
          )}

          <button
            type="button"
            onClick={endCall}
            className="w-12 h-12 rounded-full bg-error hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title="End Call"
          >
            <span className="material-symbols-outlined text-xl">call_end</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Call Summary Modal
  if (callSummary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0F12]/80 backdrop-blur-md">
        <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 shadow-2xl text-center animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">call_made</span>
          </div>

          <h3 className="text-base font-bold text-text-primary">Call Ended</h3>
          <p className="text-xs text-text-secondary mt-1">
            Session with <span className="text-text-primary font-medium">{callSummary.partnerName}</span>
          </p>

          <div className="mt-4 p-3 bg-background border border-border rounded-sm flex items-center justify-between text-xs font-mono">
            <span className="text-text-secondary">Duration</span>
            <span className="text-text-primary font-semibold">
              {formatDuration(callSummary.duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={closeSummary}
            className="w-full mt-5 py-2.5 bg-surface-hover hover:bg-[#252a33] border border-border text-text-primary rounded-sm text-xs font-semibold transition-colors"
          >
            Close Summary
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CallOverlay;
