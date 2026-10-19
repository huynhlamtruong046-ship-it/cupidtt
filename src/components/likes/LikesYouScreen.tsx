import React from 'react';
import { Crown, Heart, Sparkles, Lock, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { CardDetailSheet } from '../discovery/CardDetailSheet';

export const LikesYouScreen: React.FC = () => {
  const {
    likedMeProfiles,
    currentUser,
    setIsPremiumModalOpen,
    swipe,
    candidateProfiles,
    setDetailProfileModal,
    detailProfileModal,
    showToast,
  } = useDating();

  const isPremium = currentUser?.isPremium;

  const handleInstantMatch = (profileId: string) => {
    // If not premium, prompt upgrade
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }

    // Find and like
    const target = likedMeProfiles.find((p) => p.userId === profileId);
    if (target) {
      swipe('LIKE');
      showToast(`Đã ghép đôi thành công với ${target.displayName}!`);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Premium Teaser Banner */}
      {!isPremium ? (
        <div className="relative mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Mở khóa người đã thích bạn</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Có <strong className="text-white font-bold">{likedMeProfiles.length} người</strong> đang thầm thích bạn. Nâng cấp CupidGo VIP để thấy rõ ảnh và Match ngay lập tức!
              </p>
            </div>
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="shrink-0 py-2 px-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              Mở khóa
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-200">
              {likedMeProfiles.length} người đã thích bạn
            </span>
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 rounded-md">
              VIP Mở khóa
            </span>
          </div>
          <span className="text-xs text-neutral-400">Chạm để xem & kết đôi</span>
        </div>
      )}

      {/* Grid of Profiles */}
      {likedMeProfiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
            <Heart className="w-7 h-7 text-neutral-600" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-300">Chưa có lượt thích mới</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs">
            Hãy tích cực quẹt hoặc dùng tính năng Tăng Tốc (Boost) để đưa hồ sơ của bạn tới nhiều người hơn!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-8">
          {likedMeProfiles.map((profile) => (
            <div
              key={profile.userId}
              onClick={() => {
                if (isPremium) {
                  setDetailProfileModal(profile);
                } else {
                  setIsPremiumModalOpen(true);
                }
              }}
              className="relative aspect-[3/4] rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden cursor-pointer group hover:border-neutral-700 transition-all shadow-md"
            >
              {/* Photo (Blurred if non-premium) */}
              <img
                src={profile.photos[0]}
                alt={profile.displayName}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  !isPremium ? 'blur-lg scale-110 opacity-75' : 'group-hover:scale-105'
                }`}
                referrerPolicy="no-referrer"
              />

              {/* Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

              {/* Overlay Content */}
              {!isPremium ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-neutral-900/80 backdrop-blur-md border border-amber-500/40 flex items-center justify-center mb-2 shadow-lg">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-white drop-shadow">
                    {profile.age} tuổi · {profile.locationName.split(',')[0]}
                  </span>
                  <span className="text-[10px] text-amber-300/90 mt-0.5">
                    Tương thích {profile.compatibilityRate}%
                  </span>
                </div>
              ) : (
                <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{profile.displayName}</span>
                      <span className="text-xs text-neutral-300">{profile.age}</span>
                    </div>
                    <span className="text-[10px] text-neutral-300 block">
                      {profile.locationName.split(',')[0]}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstantMatch(profile.userId);
                    }}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    title="Ghép đôi ngay"
                  >
                    <Heart className="w-4 h-4 fill-white stroke-none" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail sheet when clicking a profile */}
      {detailProfileModal && (
        <CardDetailSheet
          profile={detailProfileModal}
          onClose={() => setDetailProfileModal(null)}
          onLike={() => {
            handleInstantMatch(detailProfileModal.userId);
            setDetailProfileModal(null);
          }}
        />
      )}
    </div>
  );
};
