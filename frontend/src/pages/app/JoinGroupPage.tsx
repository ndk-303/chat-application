import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { conversationService } from '../../services/conversationService';
import { useChatStore } from '../../stores/chatStore';
import { toast } from 'sonner';
import { Users, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface InviteInfo {
  _id: string;
  name?: string;
  avatar?: string;
  participantCount: number;
  participants: { _id: string; displayName: string; avatar?: string }[];
}

export default function JoinGroupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const data = await conversationService.getInviteInfo(token);
        setInfo(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Link mời không hợp lệ hoặc đã hết hạn.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    try {
      await conversationService.joinByInvite(token);
      setJoined(true);
      toast.success('Đã tham gia nhóm thành công!');
      await fetchConversations();
      // Navigate after a short delay to show success state
      setTimeout(() => {
        setActiveConversation(info?._id ?? '');
        navigate('/');
      }, 1500);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Tham gia nhóm thất bại';
      toast.error(msg);
      setError(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-[#0068FF] to-[#6C5CE7]" />

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 size={40} className="animate-spin text-[#0068FF]" />
              <p className="text-gray-500 text-sm">Đang tải thông tin nhóm...</p>
            </div>
          ) : error && !info ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Không thể tham gia</h2>
              <p className="text-gray-500 text-sm text-center">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          ) : joined ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Tham gia thành công!</h2>
              <p className="text-gray-500 text-sm">Đang chuyển hướng...</p>
            </div>
          ) : info ? (
            <div className="flex flex-col items-center gap-5">
              {/* Group avatar */}
              {info.avatar ? (
                <img
                  src={info.avatar}
                  alt={info.name}
                  className="w-20 h-20 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#0068FF]/15 text-[#0068FF] flex items-center justify-center shadow-lg">
                  <Users size={36} />
                </div>
              )}

              {/* Group info */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {info.name || 'Nhóm chat'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {info.participantCount} thành viên
                </p>
              </div>

              {/* Member previews */}
              {info.participants.length > 0 && (
                <div className="flex items-center justify-center -space-x-2">
                  {info.participants.map((p) => (
                    <div
                      key={p._id}
                      className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200 flex items-center justify-center"
                      title={p.displayName}
                    >
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">
                          {p.displayName[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                  {info.participantCount > info.participants.length && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-500">
                        +{info.participantCount - info.participants.length}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Invite message */}
              <p className="text-gray-500 text-sm text-center">
                Bạn đã được mời tham gia nhóm này
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Từ chối
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex-1 px-4 py-3 bg-[#0068FF] text-white rounded-xl text-sm font-semibold hover:bg-[#0052CC] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang tham gia...
                    </>
                  ) : (
                    'Tham gia nhóm'
                  )}
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-xs text-center mt-1">{error}</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
