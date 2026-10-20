import React, { useState } from 'react';
import {
  Search,
  MessageCircle,
  Sparkles,
  Heart,
  ChevronRight,
  ShieldCheck,
  Check,
  CheckCheck,
  MessageSquareDashed,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { Match } from '../../types';
import { ChatScreen } from '../chat/ChatScreen';

export const MatchesScreen: React.FC = () => {
  const {
    matches,
    messages,
    currentUser,
    activeChatMatchId,
    setActiveChatMatchId,
    setActiveTab,
  } = useDating();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredMatches = matches.filter((m) =>
    m.partnerProfile.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMatch = matches.find((m) => m.id === activeChatMatchId) || (matches.length > 0 ? matches[0] : null);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto h-[calc(100vh-4rem)] flex overflow-hidden bg-neutral-950 text-neutral-100 sm:border-x sm:border-neutral-800/80">
      {/* ============================================================== */}
      {/* LEFT COLUMN: MATCHES CAROUSEL & CONVERSATIONS LIST (Desktop & Mobile) */}
      {/* ============================================================== */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-neutral-800 flex flex-col shrink-0 bg-neutral-900/40 overflow-hidden ${
          activeChatMatchId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Header & Search */}
        <div className="p-4 border-b border-neutral-800/80 shrink-0">
          <h2 className="text-base font-bold text-neutral-100 mb-3">
            Tương Hợp & Tin Nhắn
          </h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm người tương hợp..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable area for New Matches & Conversations */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
          {/* Top Carousel: New Matches */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Tương hợp mới ({matches.length})
              </span>
              {matches.length > 0 && (
                <span className="text-[10px] text-rose-400 font-medium">Nhấn để nhắn</span>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-center">
                <Heart className="w-5 h-5 text-neutral-600 mx-auto mb-1.5" />
                <p className="text-xs text-neutral-400">Chưa có ai tương hợp lúc này.</p>
                <button
                  onClick={() => setActiveTab('discovery')}
                  className="mt-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Khám phá thêm đối tượng →
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setActiveChatMatchId(match.id)}
                    className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                  >
                    <div
                      className={`relative p-0.5 rounded-full transition-transform ${
                        activeChatMatchId === match.id
                          ? 'ring-2 ring-rose-500 bg-rose-500 scale-105'
                          : 'bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 group-hover:scale-105'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-950 bg-neutral-900">
                        <img
                          src={match.partnerProfile.photos[0]}
                          alt={match.partnerProfile.displayName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {match.unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-neutral-950 rounded-full" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-200 truncate max-w-[60px]">
                      {match.partnerProfile.displayName.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Hội thoại ({filteredMatches.length})
            </h3>

            {filteredMatches.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs">
                {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có cuộc trò chuyện nào'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMatches.map((match) => {
                  const isSelected = activeChatMatchId === match.id;
                  const matchMsgs = messages[match.id] || [];
                  const lastMsg = matchMsgs[matchMsgs.length - 1];
                  const isLastMsgFromMe = lastMsg ? lastMsg.senderId === currentUser?.id : false;
                  const isRead = isLastMsgFromMe && (lastMsg.status === 'read' || lastMsg.isRead);
                  const isDelivered = isLastMsgFromMe && lastMsg.status === 'delivered';

                  return (
                    <button
                      key={match.id}
                      onClick={() => setActiveChatMatchId(match.id)}
                      className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-colors text-left border ${
                        isSelected
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-neutral-900/40 hover:bg-neutral-850/80 border-transparent hover:border-neutral-800'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={match.partnerProfile.photos[0]}
                          alt={match.partnerProfile.displayName}
                          className="w-11 h-11 rounded-full object-cover bg-neutral-800"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-neutral-950 rounded-full" />
                      </div>

                      {/* Text summary */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-rose-400' : 'text-neutral-100'
                            }`}
                          >
                            {match.partnerProfile.displayName}
                          </span>
                          <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                            {match.lastMessageTime || 'Mới'}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                          {isLastMsgFromMe && (
                            isRead ? (
                              <span title="Đã xem" className="inline-flex items-center text-rose-400 shrink-0">
                                <CheckCheck className="w-3.5 h-3.5" />
                              </span>
                            ) : isDelivered ? (
                              <span title="Đã nhận" className="inline-flex items-center text-neutral-400 shrink-0">
                                <CheckCheck className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span title="Đã gửi" className="inline-flex items-center text-neutral-500 shrink-0">
                                <Check className="w-3 h-3" />
                              </span>
                            )
                          )}
                          <span className="truncate">
                            {match.lastMessage || 'Chạm để gửi tin nhắn đầu tiên'}
                          </span>
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {match.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {match.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: ACTIVE CHAT CONVERSATION OR DESKTOP EMPTY STATE  */}
      {/* ============================================================== */}
      <div
        className={`flex-1 flex flex-col bg-neutral-950 overflow-hidden ${
          !activeChatMatchId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeChatMatchId ? (
          <ChatScreen
            matchId={activeChatMatchId}
            onBack={() => setActiveChatMatchId(null)}
            isEmbedded={true}
          />
        ) : selectedMatch ? (
          /* Desktop default state: auto-preview or select a chat */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-xl">
              <MessageSquareDashed className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-100 mb-1.5">
              Chọn một cuộc hội thoại
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
              Nhấp vào một người bạn đã tương hợp ở danh sách bên trái để bắt đầu trò chuyện và kết nối trực tiếp theo thời gian thực.
            </p>
            {matches.length > 0 && (
              <button
                onClick={() => setActiveChatMatchId(matches[0].id)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Nhắn tin cho {matches[0].partnerProfile.displayName}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-xl">
              <Heart className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-100 mb-1.5">
              Chưa có tương hợp nào
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
              Hãy tiếp tục khám phá và quẹt phải những hồ sơ bạn thích để tạo tương hợp và bắt đầu trò chuyện!
            </p>
            <button
              onClick={() => setActiveTab('discovery')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all"
            >
              Bắt đầu khám phá đối tượng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
