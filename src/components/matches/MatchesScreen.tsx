import React, { useState } from 'react';
import { Search, MessageCircle, Sparkles, Heart, ChevronRight, ShieldCheck, Check, CheckCheck } from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { Match } from '../../types';

export const MatchesScreen: React.FC = () => {
  const { matches, messages, currentUser, setActiveChatMatchId, candidateProfiles, setActiveTab } = useDating();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMatches = matches.filter((m) =>
    m.partnerProfile.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col p-4 bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm người tương hợp..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
        />
      </div>

      {/* Top Carousel: New Matches */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Tương hợp mới ({matches.length})
          </span>
          {matches.length > 0 && (
            <span className="text-[11px] text-rose-400 font-medium">Chạm để mở lời</span>
          )}
        </div>

        {matches.length === 0 ? (
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-center">
            <Heart className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">Chưa có ai match với bạn lúc này.</p>
            <button
              onClick={() => setActiveTab('discovery')}
              className="mt-2 text-xs font-semibold text-rose-400 hover:text-rose-300"
            >
              Tiếp tục quẹt để tìm đối tượng →
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setActiveChatMatchId(match.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-md group-hover:scale-105 transition-transform">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-950 bg-neutral-900">
                    <img
                      src={match.partnerProfile.photos[0]}
                      alt={match.partnerProfile.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {match.unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-neutral-950 rounded-full" />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-neutral-200 truncate max-w-[64px]">
                  {match.partnerProfile.displayName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Tin nhắn & Trò chuyện
        </h3>

        {filteredMatches.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs">
            {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có cuộc trò chuyện nào'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => setActiveChatMatchId(match.id)}
                className="w-full p-3 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 flex items-center gap-3 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={match.partnerProfile.photos[0]}
                    alt={match.partnerProfile.displayName}
                    className="w-12 h-12 rounded-full object-cover bg-neutral-800"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-950 rounded-full" />
                </div>

                {/* Text summary */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-100 truncate">
                      {match.partnerProfile.displayName}
                    </span>
                    <span className="text-[10px] text-neutral-500 shrink-0">
                      {match.lastMessageTime || 'Mới'}
                    </span>
                  </div>
                  {(() => {
                    const matchMsgs = messages[match.id] || [];
                    const lastMsg = matchMsgs[matchMsgs.length - 1];
                    const isLastMsgFromMe = lastMsg ? lastMsg.senderId === currentUser?.id : false;
                    const isRead = isLastMsgFromMe && (lastMsg.status === 'read' || lastMsg.isRead);
                    const isDelivered = isLastMsgFromMe && lastMsg.status === 'delivered';

                    return (
                      <p className="text-xs text-neutral-400 truncate mt-0.5 flex items-center gap-1">
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
                        <span className="truncate">{match.lastMessage || 'Chạm để gửi tin nhắn đầu tiên'}</span>
                      </p>
                    );
                  })()}
                </div>

                {/* Arrow or Unread Badge */}
                {match.unreadCount > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {match.unreadCount}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
