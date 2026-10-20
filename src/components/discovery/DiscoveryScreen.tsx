import React, { useState, useEffect } from 'react';
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
  Briefcase,
  GraduationCap,
  Sparkle,
  MessageCircle,
  Flag,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
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
    resetSwipeHistoryForCurrentUser,
    setBlockReportModal,
    showToast,
    setActiveTab,
    refreshCandidates,
  } = useDating();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Motion drag values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotate card as user drags
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  // Stamp opacities
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [-20, -100], [0, 1]);

  // Keyboard navigation support on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (!currentCandidate) return;

      if (e.key === 'ArrowRight') {
        swipe('LIKE');
        setActivePhotoIndex(0);
      } else if (e.key === 'ArrowLeft') {
        swipe('PASS');
        setActivePhotoIndex(0);
      } else if (e.key === 'ArrowUp') {
        swipe('SUPER_LIKE');
        setActivePhotoIndex(0);
      } else if (e.key === 'Backspace' && canRewind) {
        rewindLastSwipe();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCandidate, swipe, rewindLastSwipe, canRewind]);

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

  const handleRefreshCandidates = async () => {
    setIsRefreshing(true);
    try {
      await refreshCandidates();
      showToast('Đã làm mới danh sách ứng viên từ hệ thống');
    } catch {
      showToast('Không thể làm mới danh sách lúc này');
    } finally {
      setIsRefreshing(false);
    }
  };

  // If no more profiles available (Waiting for real users to register)
  if (!currentCandidate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-neutral-950 text-neutral-100 min-h-[75vh]">
        {/* Radar Scanning Visual Ring */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center animate-ping duration-1000" />
          <div className="absolute w-28 h-28 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center animate-pulse" />
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500/25 to-pink-500/25 border border-rose-500/60 flex items-center justify-center shadow-2xl shadow-rose-500/30">
            <Heart className="w-9 h-9 text-rose-500 fill-rose-500" />
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Đang chờ đón những thành viên mới
        </h3>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto mb-8 leading-relaxed">
          Hiện tại bạn là một trong những thành viên đầu tiên của CupidGo! Khi có thêm người dùng mới đăng ký và hoàn thiện hồ sơ trên cơ sở dữ liệu, họ sẽ xuất hiện tại đây ngay lập tức để bạn kết nối và ghép đôi.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg justify-center">
          <button
            onClick={handleRefreshCandidates}
            disabled={isRefreshing}
            className="py-3 px-6 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang kiểm tra...' : 'Làm mới danh sách'}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className="py-3 px-6 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <User className="w-4 h-4 text-rose-400" />
            <span>Cập nhật hồ sơ của bạn</span>
          </button>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="py-3 px-5 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 text-neutral-400 hover:text-neutral-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Bộ lọc</span>
          </button>
        </div>
      </div>
    );
  }

  const nextCandidate = candidateProfiles[1] || null;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-center">
      {/* 2-Column Responsive Layout for Desktop / Single Column for Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: SWIPE CARD STACK & ACTION BUTTONS (Col 1-5)  */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Card Stack Container */}
          <div className="relative w-full max-w-sm sm:max-w-md h-[520px] sm:h-[580px] flex items-center justify-center select-none">
            {/* Underneath Card Preview (Next in deck) */}
            {nextCandidate && (
              <div className="absolute inset-x-2 top-2 bottom-3 rounded-3xl bg-neutral-900 border border-neutral-800/80 overflow-hidden opacity-40 scale-[0.96] pointer-events-none transition-transform shadow-lg">
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
              className="absolute inset-x-0 inset-y-0 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none flex flex-col justify-between"
            >
              {/* Main Photo with Navigation */}
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
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex(i);
                        }}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i === activePhotoIndex ? 'bg-white shadow' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Left/Right Arrow Overlays on Hover */}
                {currentCandidate.photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20"
                      title="Ảnh tiếp"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Tap areas for photo paging */}
                <div className="absolute inset-0 flex z-10">
                  <div className="w-1/2 h-3/4" onClick={handlePrevPhoto} title="Ảnh trước" />
                  <div className="w-1/2 h-3/4" onClick={handleNextPhoto} title="Ảnh tiếp" />
                </div>

                {/* Stamps Overlays */}
                <motion.div
                  style={{ opacity: likeOpacity }}
                  className="absolute top-8 left-6 border-4 border-emerald-400 text-emerald-400 font-extrabold text-2xl px-4 py-1.5 rounded-xl rotate-[-20deg] tracking-wider uppercase pointer-events-none z-30 shadow-lg bg-emerald-950/40 backdrop-blur-sm"
                >
                  THÍCH
                </motion.div>

                <motion.div
                  style={{ opacity: nopeOpacity }}
                  className="absolute top-8 right-6 border-4 border-rose-500 text-rose-500 font-extrabold text-2xl px-4 py-1.5 rounded-xl rotate-[20deg] tracking-wider uppercase pointer-events-none z-30 shadow-lg bg-rose-950/40 backdrop-blur-sm"
                >
                  BỎ QUA
                </motion.div>

                <motion.div
                  style={{ opacity: superLikeOpacity }}
                  className="absolute bottom-32 inset-x-12 mx-auto text-center border-4 border-blue-400 text-blue-400 font-extrabold text-2xl px-4 py-2 rounded-xl tracking-wider uppercase pointer-events-none z-30 shadow-lg bg-blue-950/40 backdrop-blur-sm"
                >
                  SIÊU THÍCH
                </motion.div>

                {/* Bottom Card Scrim (compact on desktop since right column has full detail) */}
                <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-4 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent pointer-events-auto z-20">
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
                    </div>

                    {/* Mobile detail trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDetailOpen(true);
                      }}
                      className="lg:hidden w-10 h-10 rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-200 hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0"
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
          <div className="pt-4 flex items-center justify-center gap-3 sm:gap-4 w-full">
            {/* Rewind */}
            <button
              onClick={() => rewindLastSwipe()}
              disabled={!canRewind}
              aria-label="Hoàn tác lượt quẹt"
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                canRewind
                  ? 'bg-neutral-900 border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 active:scale-90 shadow-md'
                  : 'bg-neutral-900/60 border border-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
              title="Hoàn tác lượt vừa quẹt"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Pass / Nope */}
            <button
              onClick={() => {
                swipe('PASS');
                setActivePhotoIndex(0);
              }}
              aria-label="Bỏ qua"
              className="w-14 h-14 rounded-full bg-neutral-900 border border-rose-500/40 text-rose-500 hover:bg-rose-500/15 flex items-center justify-center shadow-xl active:scale-90 transition-all hover:border-rose-500"
              title="Bỏ qua"
            >
              <X className="w-7 h-7 stroke-[2.5]" />
            </button>

            {/* Super Like */}
            <button
              onClick={() => {
                swipe('SUPER_LIKE');
                setActivePhotoIndex(0);
              }}
              aria-label="Siêu thích"
              className="w-12 h-12 rounded-full bg-neutral-900 border border-blue-500/40 text-blue-400 hover:bg-blue-500/15 flex items-center justify-center shadow-xl active:scale-90 transition-all hover:border-blue-400"
              title="Siêu Thích"
            >
              <Star className="w-6 h-6 fill-blue-400 stroke-none" />
            </button>

            {/* Like */}
            <button
              onClick={() => {
                swipe('LIKE');
                setActivePhotoIndex(0);
              }}
              aria-label="Thích"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 active:scale-90 transition-all hover:brightness-110"
              title="Thích"
            >
              <Heart className="w-7 h-7 fill-white stroke-none" />
            </button>

            {/* Boost */}
            <button
              onClick={activateBoost}
              aria-label="Tăng tốc hồ sơ"
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                isBoostActive
                  ? 'bg-purple-600/30 border border-purple-500 text-purple-300 animate-pulse'
                  : 'bg-neutral-900 border border-purple-500/40 text-purple-400 hover:bg-purple-500/15 active:scale-90 shadow-md'
              }`}
              title="Tăng tốc hồ sơ"
            >
              <Zap className="w-5 h-5 fill-purple-400/30" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: RICH PROFILE INFORMATION DETAILS (Col 6-12) */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:col-span-7 flex-col space-y-4">
          {/* Header Card: Name, Match Compatibility, Location */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    {currentCandidate.displayName}
                  </h1>
                  <span className="text-3xl font-light text-neutral-400">
                    {currentCandidate.age}
                  </span>
                  {currentCandidate.isVerified && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3 fill-blue-400 stroke-none" />
                      Đã xác thực
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span className="text-neutral-200">{currentCandidate.locationName}</span>
                  <span>·</span>
                  <span>Cách bạn {currentCandidate.distanceKm} km</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-medium">Đang hoạt động gần đây</span>
                </div>
              </div>

              {/* Compatibility Badge */}
              <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-amber-500/10 border border-rose-500/30 text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-rose-400 font-bold text-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentCandidate.compatibilityRate || 92}%</span>
                </div>
                <span className="text-[10px] text-neutral-400 block">Độ hòa hợp</span>
              </div>
            </div>

            {/* Quick Photo Strip (Click to view any photo immediately) */}
            {currentCandidate.photos.length > 1 && (
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Bộ sưu tập ảnh ({currentCandidate.photos.length})
                </span>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {currentCandidate.photos.map((pUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activePhotoIndex === idx
                          ? 'border-rose-500 ring-2 ring-rose-500/30 scale-105'
                          : 'border-neutral-800 opacity-70 hover:opacity-100 hover:border-neutral-600'
                      }`}
                    >
                      <img
                        src={pUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bio Section */}
            {currentCandidate.bio && (
              <div className="pt-2 border-t border-neutral-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Giới thiệu bản thân
                </h4>
                <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/60">
                  {currentCandidate.bio}
                </p>
              </div>
            )}

            {/* Basic Info Badges (Work, Education, Zodiac, Height) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {currentCandidate.jobTitle && (
                <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Nghề nghiệp</span>
                  <span className="font-semibold text-neutral-200 truncate block">
                    {currentCandidate.jobTitle}
                  </span>
                </div>
              )}

              {currentCandidate.education && (
                <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Học vấn</span>
                  <span className="font-semibold text-neutral-200 truncate block">
                    {currentCandidate.education}
                  </span>
                </div>
              )}

              {currentCandidate.zodiac && (
                <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Cung hoàng đạo</span>
                  <span className="font-semibold text-neutral-200 truncate block">
                    {currentCandidate.zodiac}
                  </span>
                </div>
              )}

              {currentCandidate.heightCm && (
                <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">Chiều cao</span>
                  <span className="font-semibold text-neutral-200 truncate block">
                    {currentCandidate.heightCm} cm
                  </span>
                </div>
              )}
            </div>

            {/* Interests Chips */}
            {currentCandidate.interests && currentCandidate.interests.length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Sở thích & Đam mê
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentCandidate.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-200"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Details if any */}
            {currentCandidate.lifestyle && Object.keys(currentCandidate.lifestyle).length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Lối sống & Thói quen
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currentCandidate.lifestyle).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-300"
                    >
                      {String(value)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prompts / Questions if any */}
            {currentCandidate.prompts && currentCandidate.prompts.length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Câu hỏi phỏng vấn nhanh
                </h4>
                {currentCandidate.prompts.map((pr, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs"
                  >
                    <span className="text-[10px] text-rose-400 font-semibold block mb-1">
                      {pr.question}
                    </span>
                    <span className="text-neutral-200 font-medium">
                      {pr.answer}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Safety & Action Footer */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setBlockReportModal({ target: currentCandidate, type: 'REPORT' })}
                className="text-neutral-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Báo cáo hoặc Chặn {currentCandidate.displayName}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    swipe('PASS');
                    setActivePhotoIndex(0);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold transition-colors"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={() => {
                    swipe('LIKE');
                    setActivePhotoIndex(0);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>Thích hồ sơ này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Detail Sheet (for mobile screens when info icon is tapped) */}
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
