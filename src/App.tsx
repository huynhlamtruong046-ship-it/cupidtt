import React, { useState, useEffect } from 'react';
import {
  DatingProvider,
  useDating,
} from './context/DatingContext';
import { MobileHeader } from './components/navigation/MobileHeader';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { AuthScreen } from './components/auth/AuthScreen';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { DiscoveryScreen } from './components/discovery/DiscoveryScreen';
import { LikesYouScreen } from './components/likes/LikesYouScreen';
import { MatchesScreen } from './components/matches/MatchesScreen';
import { ChatScreen } from './components/chat/ChatScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { MatchCelebrationModal } from './components/modals/MatchCelebrationModal';
import { FilterModal } from './components/modals/FilterModal';
import { PremiumModal } from './components/modals/PremiumModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { BlockReportModal } from './components/modals/BlockReportModal';
import { DownloadAppModal } from './components/modals/DownloadAppModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  Wifi,
  Battery,
  Smartphone,
  Maximize2,
  Minimize2,
  Sparkles,
  Heart,
  Download,
  LayoutDashboard,
} from 'lucide-react';

const DatingAppInner: React.FC = () => {
  const {
    currentUser,
    activeTab,
    activeChatMatchId,
    setActiveChatMatchId,
    toastMessage,
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    isAdminMode,
    setIsAdminMode,
  } = useDating();

  const [currentTime, setCurrentTime] = useState('09:41');
  const [isExpandedView, setIsExpandedView] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isAdminMode) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-0 md:p-6 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Ambient Glow on Desktop */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-rose-600/15 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-pink-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[160px]" />
      </div>

      {/* Desktop Brand bar & Layout Toggle */}
      <div className="hidden md:flex items-center justify-between w-full max-w-md mb-3 px-2 z-10 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="font-bold text-neutral-200">CupidGo Mobile</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400">
            Khung mô phỏng App
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdminMode(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-200 hover:text-white transition-colors"
            title="Mở Trang Quản Trị Hệ Thống (Admin Portal)"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-rose-400" />
            <span>Trang Admin</span>
          </button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/40 text-rose-300 hover:text-white hover:border-rose-500 transition-colors"
            title="Tải ứng dụng về máy"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải về máy</span>
          </button>
          <button
            onClick={() => setIsExpandedView(!isExpandedView)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:text-white hover:border-neutral-700 transition-colors"
            title="Chuyển đổi kích thước hiển thị"
          >
            {isExpandedView ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Giao diện chuẩn</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Mở rộng</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Smartphone Shell */}
      <div
        className={`relative w-full ${
          isExpandedView ? 'max-w-lg h-[92vh]' : 'max-w-[420px] h-[100dvh] md:h-[844px]'
        } bg-neutral-950 md:rounded-[44px] md:border-[10px] md:border-neutral-800 shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 z-10`}
      >
        {/* Phone Notch / Dynamic Island & Status Bar (on desktop/tablet mockup) */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-3 pb-1 text-xs font-semibold text-neutral-200 select-none bg-neutral-900/90 z-40">
          <span>{currentTime}</span>

          {/* Dynamic Island Pill */}
          <div className="w-20 h-4 bg-black rounded-full mx-auto -mt-1 hidden md:block" />

          <div className="flex items-center gap-1.5 text-neutral-300">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Content Screens */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {!currentUser ? (
            <AuthScreen />
          ) : !currentUser.isCompleted ? (
            <OnboardingScreen />
          ) : activeChatMatchId ? (
            <ChatScreen
              matchId={activeChatMatchId}
              onBack={() => setActiveChatMatchId(null)}
            />
          ) : (
            <>
              <MobileHeader />

              {/* Active Tab Screen */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTab === 'discovery' && <DiscoveryScreen />}
                {activeTab === 'likes' && <LikesYouScreen />}
                {activeTab === 'matches' && <MatchesScreen />}
                {activeTab === 'profile' && <ProfileScreen />}
              </div>

              <BottomTabBar />
            </>
          )}
        </main>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="absolute top-14 inset-x-4 z-50 flex justify-center pointer-events-none">
            <div className="px-4 py-2.5 bg-neutral-900/95 border border-rose-500/40 text-neutral-100 rounded-2xl shadow-xl text-xs font-medium backdrop-blur-md animate-in slide-in-from-top-3 duration-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Modals & Dialogs */}
        <MatchCelebrationModal />
        <FilterModal />
        <PremiumModal />
        <EditProfileModal />
        <BlockReportModal />
        <DownloadAppModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <DatingProvider>
      <DatingAppContentWrapper />
    </DatingProvider>
  );
}

const DatingAppContentWrapper: React.FC = () => {
  return <DatingAppInner />;
};
