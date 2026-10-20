import React, { useState } from 'react';
import {
  Heart,
  Flame,
  Crown,
  Zap,
  SlidersHorizontal,
  Download,
  Database,
  User as UserIcon,
  MessageCircle,
  Sparkles,
  LogOut,
  Shield,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { CupidLogo } from '../common/CupidLogo';

export const TopNavBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsAdminMode,
    currentUser,
    currentProfile,
    likedMeProfiles,
    matches,
    isBoostActive,
    boostTimeRemaining,
    activateBoost,
    setIsPremiumModalOpen,
    setIsDownloadModalOpen,
    setIsFilterModalOpen,
    logout,
  } = useDating();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const formatBoostTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isAdmin = currentUser?.email?.toLowerCase() === 'huynhlamtruong046@gmail.com';

  const unreadMatchesCount = matches.reduce((acc, m) => acc + (m.unreadCount || 0), 0);

  const navItems = [
    {
      id: 'discovery' as const,
      label: 'Khám phá',
      icon: Compass,
    },
    {
      id: 'likes' as const,
      label: 'Ai thích bạn',
      icon: Heart,
      badge: likedMeProfiles.length > 0 ? likedMeProfiles.length : undefined,
    },
    {
      id: 'matches' as const,
      label: 'Tin nhắn',
      icon: MessageCircle,
      badge: unreadMatchesCount > 0 ? unreadMatchesCount : undefined,
    },
    {
      id: 'profile' as const,
      label: 'Hồ sơ của tôi',
      icon: UserIcon,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Logo & Wordmark (Hình 1) */}
        <div className="flex items-center gap-3">
          <CupidLogo
            size="md"
            onClick={() => setActiveTab('discovery')}
            className="transition-transform active:scale-95"
          />
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-400 shadow-sm border border-rose-500/30'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin / Data Management Item */}
          {isAdmin && (
            <button
              onClick={() => setIsAdminMode(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all ml-1"
              title="Mở Quản lý dữ liệu Cloud SQL PostgreSQL"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Quản lý dữ liệu</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                SQL
              </span>
            </button>
          )}
        </nav>

        {/* Zone 3: Quick Controls & User Profile Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Boost Trigger */}
          {activeTab === 'discovery' && (
            <button
              onClick={activateBoost}
              title={isBoostActive ? `Tăng tốc còn ${formatBoostTime(boostTimeRemaining)}` : 'Tăng tốc hồ sơ của bạn'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
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

          {/* Filter button on Discovery */}
          {activeTab === 'discovery' && (
            <button
              onClick={() => setIsFilterModalOpen(true)}
              title="Bộ lọc tìm kiếm"
              className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-750 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* VIP Upgrade Banner / Badge */}
          {currentUser?.isPremium ? (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Crown className="w-3.5 h-3.5" />
              <span>VIP</span>
            </div>
          ) : (
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-rose-500/30 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Nâng cấp VIP</span>
            </button>
          )}

          {/* Download App trigger */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            title="Tải ứng dụng về máy / Cài đặt"
            className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-750 transition-colors"
          >
            <Download className="w-4 h-4 text-rose-400" />
          </button>

          {/* User Account / Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 transition-all text-left"
            >
              <span className="hidden lg:inline text-xs font-semibold text-neutral-200 max-w-[120px] truncate">
                {currentProfile?.displayName || currentUser?.email?.split('@')[0]}
              </span>
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-neutral-700 shrink-0 ring-1 ring-neutral-600">
                {currentProfile?.photos?.[0] ? (
                  <img
                    src={currentProfile.photos[0]}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-300">
                    {currentProfile?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3.5 py-2.5 border-b border-neutral-800/80">
                  <span className="font-bold text-neutral-100 block truncate">
                    {currentProfile?.displayName || 'Người dùng CupidGo'}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono block truncate">
                    {currentUser?.email}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Hồ sơ & Cài đặt</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPremiumModalOpen(true);
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-amber-300 hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gói thành viên VIP</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsAdminMode(true);
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-emerald-300 hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Quản lý dữ liệu (PostgreSQL)</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-neutral-800/80">
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-900 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-rose-500 text-white'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                setIsAdminMode(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30"
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Quản lý dữ liệu (PostgreSQL)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Admin
              </span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
