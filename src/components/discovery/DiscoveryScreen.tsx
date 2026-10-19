import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import {
  Heart,
  X,
  Star,
  RotateCcw,
  Zap,
  Info,
  MapPin,
  Sparkles,
  Shield,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { CardDetailSheet } from './CardDetailSheet';

export const DiscoveryScreen: React.FC = () => {
  const {
    currentCandidate,
    candidateProfiles,
    swipe,
    rewindLastSwipe,
    canRewind,
    activateBoost,
    isBoostActive,
    setIsFilterModalOpen,
    resetAllData,
    showToast,
  } = useDating();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Motion drag values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotate card as user drags
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  // Stamp opacities
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [-20, -100], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 90;
    const velocityThreshold = 500;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> LIKE
      swipe('LIKE');
      setActivePhotoIndex(0);
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swiped Left -> PASS
      swipe('PASS');
      setActivePhotoIndex(0);
    } else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      // Swiped Up -> SUPER LIKE
      swipe('SUPER_LIKE');
      setActivePhotoIndex(0);
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCandidate) return;
    setActivePhotoIndex((prev) => (prev + 1) % currentCandidate.photos.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCandidate) return;
    setActivePhotoIndex((prev) => (prev - 1 + currentCandidate.photos.length) % currentCandidate.photos.length);
  };

  // If no more profiles available
  if (!currentCandidate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-neutral-950 text-neutral-100">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center animate-ping" />
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-xl">
            <Heart className="w-10 h-10 text-rose-500 fill-rose-500/20" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-neutral-100 mb-2">
          Đã xem hết các hồ sơ quanh bạn!
        </h3>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto mb-6 leading-relaxed">
          Hãy mở rộng bán kính khoảng cách hoặc độ tuổi trong bộ lọc để tiếp tục khám phá thêm người mới.
        </p>

        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Điều chỉnh bộ lọc tìm kiếm
          </button>

          <button
            onClick={resetAllData}
            className="w-full py-2.5 px-4 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tải lại toàn bộ hồ sơ mẫu
          </button>
        </div>
      </div>
    );
  }

  const nextCandidate = candidateProfiles[1] || null;

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 bg-neutral-950 overflow-hidden relative select-none">
      {/* Cards Deck Container */}
      <div className="relative flex-1 w-full max-w-sm mx-auto flex items-center justify-center">
        {/* Underneath Card Preview (Next in deck) */}
        {nextCandidate && (
          <div className="absolute inset-x-2 top-2 bottom-4 rounded-3xl bg-neutral-900 border border-neutral-800/80 overflow-hidden opacity-40 scale-[0.96] pointer-events-none transition-transform">
            <img
              src={nextCandidate.photos[0]}
              alt={nextCandidate.displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Top Active Card with Gestures */}
        <motion.div
          style={{ x, y, rotate }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          className="absolute inset-x-0 inset-y-1 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none flex flex-col justify-between"
        >
          {/* Main Photo with Photo Nav Taps */}
          <div className="relative w-full h-full">
            <img
              src={currentCandidate.photos[activePhotoIndex] || currentCandidate.photos[0]}
              alt={currentCandidate.displayName}
              className="w-full h-full object-cover pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Photo Segment Indicators */}
            {currentCandidate.photos.length > 1 && (
              <div className="absolute top-3 inset-x-3 flex gap-1 z-20">
                {currentCandidate.photos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i === activePhotoIndex ? 'bg-white shadow' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap areas for photo paging */}
            <div className="absolute inset-0 flex z-10">
              <div
                className="w-1/2 h-3/4"
                onClick={handlePrevPhoto}
                title="Ảnh trước"
              />
              <div
                className="w-1/2 h-3/4"
                onClick={handleNextPhoto}
                title="Ảnh tiếp"
              />
            </div>

            {/* Stamp Overlays */}
            {/* LIKE STAMP (Right swipe) */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-8 left-6 border-4 border-emerald-400 text-emerald-400 font-extrabold text-2xl px-4 py-1.5 rounded-xl rotate-[-20deg] tracking-wider uppercase pointer-events-none z-30 shadow-lg bg-emerald-950/40 backdrop-blur-sm"
            >
              THÍCH
            </motion.div>

            {/* NOPE STAMP (Left swipe) */}
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-8 right-6 border-4 border-rose-500 text-rose-500 font-extrabold text-2xl px-4 py-1.5 rounded-xl rotate-[20deg] tracking-wider uppercase pointer-events-none z-30 shadow-lg bg-rose-950/40 backdrop-blur-sm"
            >
              BỎ QUA
            </motion.div>

            {/* SUPER LIKE STAMP (Up swipe) */}
            <motion.div
              style={{ opacity: superLikeOpacity }}
              className="absolute bottom-32 inset-x-12 mx-auto text-center border-4 border-blue-400 text-blue-400 font-extrabold text-2xl px-4 py-2 rounded-xl tracking-wider uppercase pointer-events-none z-30 shadow-lg bg-blue-950/40 backdrop-blur-sm"
            >
              SIÊU THÍCH
            </motion.div>

            {/* Bottom Card Scrim & Bio Info */}
            <div className="absolute inset-x-0 bottom-0 pt-20 pb-4 px-4 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent pointer-events-auto z-20">
              <div className="flex items-end justify-between">
                <div className="flex-1 mr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                      {currentCandidate.displayName}
                    </h2>
                    <span className="text-2xl font-light text-neutral-200">
                      {currentCandidate.age}
                    </span>
                    {currentCandidate.isVerified && (
                      <span className="p-0.5 rounded-full bg-blue-500 text-white" title="Đã xác thực">
                        <Shield className="w-3.5 h-3.5 fill-white stroke-none" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-300 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{currentCandidate.locationName}</span>
                    <span>·</span>
                    <span>Cách {currentCandidate.distanceKm} km</span>
                  </div>

                  {currentCandidate.bio && (
                    <p className="text-xs text-neutral-200 mt-2 line-clamp-2 leading-relaxed">
                      {currentCandidate.bio}
                    </p>
                  )}

                  {/* Interests preview pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {currentCandidate.interests.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-neutral-900/90 border border-neutral-700/80 rounded-md text-[10px] font-medium text-neutral-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info Detail Sheet Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDetailOpen(true);
                  }}
                  className="w-10 h-10 rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-200 hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0"
                  aria-label="Xem chi tiết hồ sơ"
                >
                  <Info className="w-5 h-5 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons Row */}
      <div className="shrink-0 pt-3 pb-1 flex items-center justify-center gap-3 sm:gap-4 max-w-sm mx-auto w-full">
        {/* 1. Rewind Button */}
        <button
          onClick={() => rewindLastSwipe()}
          disabled={!canRewind}
          aria-label="Hoàn tác lượt vuốt"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            canRewind
              ? 'bg-neutral-900 border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 active:scale-90 shadow-md'
              : 'bg-neutral-900/60 border border-neutral-800 text-neutral-600 cursor-not-allowed'
          }`}
          title="Hoàn tác lượt vừa qua"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* 2. Pass / Nope Button */}
        <button
          onClick={() => {
            swipe('PASS');
            setActivePhotoIndex(0);
          }}
          aria-label="Bỏ qua"
          className="w-14 h-14 rounded-full bg-neutral-900 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex items-center justify-center shadow-lg active:scale-90 transition-all"
          title="Bỏ qua"
        >
          <X className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* 3. Super Like Button */}
        <button
          onClick={() => {
            swipe('SUPER_LIKE');
            setActivePhotoIndex(0);
          }}
          aria-label="Siêu thích"
          className="w-12 h-12 rounded-full bg-neutral-900 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex items-center justify-center shadow-lg active:scale-90 transition-all"
          title="Siêu Thích (Tăng 3x cơ hội Match)"
        >
          <Star className="w-6 h-6 fill-blue-400 stroke-none" />
        </button>

        {/* 4. Like Button */}
        <button
          onClick={() => {
            swipe('LIKE');
            setActivePhotoIndex(0);
          }}
          aria-label="Thích"
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 active:scale-90 transition-all hover:brightness-105"
          title="Thích"
        >
          <Heart className="w-7 h-7 fill-white stroke-none" />
        </button>

        {/* 5. Boost Button */}
        <button
          onClick={activateBoost}
          aria-label="Tăng tốc hồ sơ"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isBoostActive
              ? 'bg-purple-600/30 border border-purple-500 text-purple-300 animate-pulse'
              : 'bg-neutral-900 border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 active:scale-90 shadow-md'
          }`}
          title="Tăng tốc hồ sơ 30 phút"
        >
          <Zap className="w-5 h-5 fill-purple-400/30" />
        </button>
      </div>

      {/* Card Detail Sheet if opened */}
      {isDetailOpen && (
        <CardDetailSheet
          profile={currentCandidate}
          onClose={() => setIsDetailOpen(false)}
          onLike={() => {
            swipe('LIKE');
            setIsDetailOpen(false);
          }}
          onPass={() => {
            swipe('PASS');
            setIsDetailOpen(false);
          }}
          onSuperLike={() => {
            swipe('SUPER_LIKE');
            setIsDetailOpen(false);
          }}
        />
      )}
    </div>
  );
};
