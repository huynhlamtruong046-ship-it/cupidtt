import React from 'react';
import { SlidersHorizontal, Zap, Crown, Download } from 'lucide-react';
import { useDating } from '../../context/DatingContext';

export const MobileHeader: React.FC = () => {
  const {
    activeTab,
    setIsFilterModalOpen,
    setIsPremiumModalOpen,
    setIsDownloadModalOpen,
    activateBoost,
    isBoostActive,
    boostTimeRemaining,
    currentUser,
  } = useDating();

  const formatBoostTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'discovery':
        return 'CupidGo';
      case 'likes':
        return 'Ai Đã Thích Bạn';
      case 'matches':
        return 'Tương Hợp & Tin Nhắn';
      case 'profile':
        return 'Hồ Sơ Của Tôi';
      default:
        return 'CupidGo';
    }
  };

  return (
    <header className="shrink-0 z-30 flex items-center justify-between px-4 py-3 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800/80">
      {/* Zone 1: Brand title or page title */}
      <div className="flex items-center gap-2">
        {activeTab === 'discovery' ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              CupidGo
            </span>
            {currentUser?.isPremium && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded">
                <Crown className="w-2.5 h-2.5" />
                VIP
              </span>
            )}
          </div>
        ) : (
          <h1 className="text-base font-bold text-neutral-100 truncate">
            {getTitle()}
          </h1>
        )}
      </div>

      {/* Zone 2 & 3: Contextual Action buttons */}
      <div className="flex items-center gap-2">
        {/* Boost Button */}
        {activeTab === 'discovery' && (
          <button
            onClick={activateBoost}
            title={isBoostActive ? `Tăng tốc còn ${formatBoostTime(boostTimeRemaining)}` : 'Tăng tốc hồ sơ'}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 ${
              isBoostActive
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 animate-pulse'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isBoostActive ? 'text-purple-400 fill-purple-400' : 'text-purple-400'}`} />
            <span className="hidden sm:inline">
              {isBoostActive ? formatBoostTime(boostTimeRemaining) : 'Tăng tốc'}
            </span>
          </button>
        )}

        {/* Filter Trigger in Discovery */}
        {activeTab === 'discovery' && (
          <button
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Mở bộ lọc tìm kiếm"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        {/* Download App Trigger */}
        <button
          onClick={() => setIsDownloadModalOpen(true)}
          title="Tải ứng dụng về máy / Cài đặt"
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 text-rose-400 hover:text-rose-300 hover:bg-neutral-700 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* VIP Upgrade Banner trigger */}
        {!currentUser?.isPremium && (
          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-rose-500/30 transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Nâng cấp VIP</span>
          </button>
        )}
      </div>
    </header>
  );
};
