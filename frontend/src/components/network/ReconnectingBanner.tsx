'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

export const ReconnectingBanner: React.FC = () => {
  const { isConnected, socket } = useSocket();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isConnected) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          socket?.connect();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected, socket]);

  if (isConnected) return null;

  return (
    <aside
      aria-label="Network alert"
      className="w-full bg-[#1F170C] border-b border-[#593A17] px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-sm z-50 shrink-0"
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-[#34200B] border border-[#7A4B1B] flex items-center justify-center text-amber-400 shrink-0">
          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
          <span className="text-amber-200 font-medium">
            Kết nối máy chủ bị gián đoạn — Đang thử kết nối lại...
          </span>
          <span className="text-amber-400/70 text-[11px]">
            Đang đàm phán lại phiên WebRTC & Socket.IO
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
        <div className="flex items-center gap-1.5 text-amber-300/80 font-mono text-[11px]">
          <span>Thử lại sau:</span>
          <span className="font-mono text-amber-400 font-bold bg-[#331B05] px-1.5 py-0.5 rounded border border-[#7D4813]">
            00:0{countdown}
          </span>
        </div>
        <button
          onClick={() => {
            setCountdown(5);
            socket?.connect();
          }}
          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-[#140F08] font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-sm"
        >
          <span className="material-symbols-outlined text-xs">refresh</span>
          Kết nối ngay
        </button>
      </div>
    </aside>
  );
};
export default ReconnectingBanner;
