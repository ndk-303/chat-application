import { useState, useEffect } from 'react';
import { conversationService } from '../../services/conversationService';
import { QRCodeSVG } from 'qrcode.react';
import { X, Loader2 } from 'lucide-react';

interface InviteLinkModalProps {
  conversationId: string;
  groupName: string;
  onClose: () => void;
}

export function InviteLinkModal({ conversationId, groupName, onClose }: InviteLinkModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const inviteUrl = token ? `${window.location.origin}/join/${token}` : '';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await conversationService.generateInvite(conversationId);
        setToken(data.inviteToken);
      } catch (err) {
        console.warn('[InviteLinkModal] generateInvite failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[0.25rem] shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">Mời vào nhóm</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-[0.25rem] flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-[#0068FF]" /></div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4 text-center">Chia sẻ link hoặc mã QR để mời bạn bè vào <strong>{groupName}</strong></p>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="p-4 bg-white rounded-[0.25rem] border border-gray-100 shadow-sm">
                <QRCodeSVG value={inviteUrl} size={180} level="M" />
              </div>
            </div>

            {/* Link + Copy */}
            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly value={inviteUrl}
                className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-[0.25rem] outline-none text-gray-600 truncate"
              />
              <button onClick={handleCopy} className={`px-4 py-2 rounded-[0.25rem] text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-[#0068FF] text-white hover:bg-[#0052CC]'}`}>
                {copied ? 'Đã copy!' : 'Copy'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
