import React, { useState } from 'react';
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Heart,
  Star,
  Shield,
  Flag,
  Wine,
  Cigarette,
  Dumbbell,
  PawPrint,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Profile } from '../../types';
import { useDating } from '../../context/DatingContext';

interface CardDetailSheetProps {
  profile: Profile;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
}

export const CardDetailSheet: React.FC<CardDetailSheetProps> = ({
  profile,
  onClose,
  onLike,
  onPass,
  onSuperLike,
}) => {
  const { setBlockReportModal } = useDating();
  const [photoIndex, setPhotoIndex] = useState(0);

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % profile.photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div 
        className="w-full max-w-md h-[90vh] sm:h-[85vh] bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Drag Bar / Close */}
        <div className="relative shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/90 z-10">
          <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 pt-1 sm:pt-0">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Hồ sơ chi tiết</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Photo Carousel */}
          <div className="relative aspect-[3/4] bg-neutral-950 overflow-hidden select-none">
            <img
              src={profile.photos[photoIndex] || profile.photos[0]}
              alt={profile.displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            {/* Photo indicators */}
            {profile.photos.length > 1 && (
              <div className="absolute top-3 inset-x-3 flex gap-1 z-10">
                {profile.photos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i === photoIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Left/Right click zones */}
            {profile.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm opacity-80 hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm opacity-80 hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Bottom Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white">{profile.displayName}</h2>
                  <span className="text-2xl font-light text-neutral-300">{profile.age}</span>
                  {profile.isVerified && (
                    <span className="p-0.5 rounded-full bg-blue-500 text-white" title="Đã xác thực">
                      <Shield className="w-3.5 h-3.5 fill-white stroke-none" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-300 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{profile.locationName}</span>
                  <span>·</span>
                  <span>Cách {profile.distanceKm} km</span>
                </div>
              </div>

              {/* Compatibility Badge */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900/90 border border-rose-500/40 rounded-xl backdrop-blur-md">
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-xs font-bold text-rose-400">{profile.compatibilityRate}%</span>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Compatibility Breakdown */}
            <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Độ tương thích năng lượng
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Gu âm nhạc</span>
                  <span className="text-sm font-bold text-neutral-100">
                    {profile.compatibilityDetails?.music || 92}%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Lối sống</span>
                  <span className="text-sm font-bold text-neutral-100">
                    {profile.compatibilityDetails?.lifestyle || 90}%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Quan điểm sống</span>
                  <span className="text-sm font-bold text-neutral-100">
                    {profile.compatibilityDetails?.values || 94}%
                  </span>
                </div>
              </div>
            </div>

            {/* About / Bio */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Giới thiệu bản thân
              </h3>
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>

            {/* Job & School */}
            {(profile.jobTitle || profile.education) && (
              <div className="space-y-2 pt-1 border-t border-neutral-800">
                {profile.jobTitle && (
                  <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                    <Briefcase className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>
                      {profile.jobTitle} {profile.company && `tại ${profile.company}`}
                    </span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center gap-2.5 text-xs text-neutral-300">
                    <GraduationCap className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>Học tại {profile.education}</span>
                  </div>
                )}
              </div>
            )}

            {/* Looking for */}
            <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Mục tiêu hẹn hò
              </span>
              <span className="text-xs font-semibold text-rose-300">
                {profile.lookingFor}
              </span>
            </div>

            {/* Interests */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                Sở thích & Đam mê
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-neutral-800/80 border border-neutral-700/60 rounded-lg text-xs font-medium text-neutral-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Lifestyle habits */}
            {profile.lifestyle && (
              <div className="space-y-2.5 pt-2 border-t border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Thói quen & Lối sống
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                  {profile.lifestyle.drinking && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <Wine className="w-3.5 h-3.5 text-rose-400" />
                      <span className="truncate">{profile.lifestyle.drinking}</span>
                    </div>
                  )}
                  {profile.lifestyle.smoking && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <Cigarette className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">{profile.lifestyle.smoking}</span>
                    </div>
                  )}
                  {profile.lifestyle.exercise && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate">{profile.lifestyle.exercise}</span>
                    </div>
                  )}
                  {profile.lifestyle.pets && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <PawPrint className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">{profile.lifestyle.pets}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Questions */}
            {profile.prompts && profile.prompts.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                {profile.prompts.map((p, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <span className="text-[11px] font-semibold text-rose-400 block mb-1">
                      {p.question}
                    </span>
                    <p className="text-xs text-neutral-200 leading-relaxed italic">
                      "{p.answer}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Safety & Report actions */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setBlockReportModal({ target: profile, type: 'BLOCK' })}
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Chặn người dùng này
              </button>
              <button
                onClick={() => setBlockReportModal({ target: profile, type: 'REPORT' })}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                Báo cáo hồ sơ vi phạm
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Action Buttons at sheet bottom (if triggers passed) */}
        {(onLike || onPass || onSuperLike) && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent flex items-center justify-center gap-6 z-20">
            {onPass && (
              <button
                onClick={() => {
                  onPass();
                  onClose();
                }}
                className="w-14 h-14 rounded-full bg-neutral-900 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title="Bỏ qua"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}

            {onSuperLike && (
              <button
                onClick={() => {
                  onSuperLike();
                  onClose();
                }}
                className="w-12 h-12 rounded-full bg-neutral-900 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title="Siêu thích"
              >
                <Star className="w-5 h-5 fill-blue-400" />
              </button>
            )}

            {onLike && (
              <button
                onClick={() => {
                  onLike();
                  onClose();
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
                title="Thích"
              >
                <Heart className="w-7 h-7 fill-white stroke-none" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
