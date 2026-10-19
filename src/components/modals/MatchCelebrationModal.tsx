import React, { useEffect } from 'react';
import { Heart, Sparkles, MessageCircle, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDating } from '../../context/DatingContext';

export const MatchCelebrationModal: React.FC = () => {
  const {
    activeMatchModal,
    closeMatchModal,
    currentProfile,
    matches,
    setActiveChatMatchId,
    setActiveTab,
  } = useDating();

  useEffect(() => {
    if (activeMatchModal) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#FF4458', '#FE6B8B', '#FFD700', '#FF758C', '#FFFFFF'],
        });
      } catch {}
    }
  }, [activeMatchModal]);

  if (!activeMatchModal || !currentProfile) return null;

  const partner = activeMatchModal;

  const handleStartChat = () => {
    const existingMatch = matches.find((m) => m.partnerProfile.userId === partner.userId);
    closeMatchModal();
    if (existingMatch) {
      setActiveChatMatchId(existingMatch.id);
    } else {
      setActiveTab('matches');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="w-full max-w-sm bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeMatchModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Floating Heart Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 p-0.5 shadow-xl shadow-rose-500/30 mb-3 animate-bounce">
          <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black italic tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
          It's a Match!
        </h2>
        <p className="text-xs text-neutral-300 mt-1">
          Bạn và <strong className="text-white font-bold">{partner.displayName}</strong> đều đã thích nhau!
        </p>

        {/* 2 Avatars touching with Heart Ring */}
        <div className="flex items-center justify-center -space-x-4 my-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-neutral-950 ring-2 ring-rose-500 shadow-xl z-10">
            <img
              src={currentProfile.photos[0]}
              alt={currentProfile.displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-neutral-950 ring-2 ring-pink-500 shadow-xl z-20">
            <img
              src={partner.photos[0]}
              alt={partner.displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Compatibility badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-xs font-semibold text-rose-300 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tương thích {partner.compatibilityRate}%</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleStartChat}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Nhắn tin làm quen ngay
          </button>

          <button
            onClick={closeMatchModal}
            className="w-full py-3 px-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Tiếp tục tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
};
