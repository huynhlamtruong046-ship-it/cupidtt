import React from 'react';
import { DatingProvider, useDating } from './context/DatingContext';
import { TopNavBar } from './components/navigation/TopNavBar';
import { AuthScreen } from './components/auth/AuthScreen';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { DiscoveryScreen } from './components/discovery/DiscoveryScreen';
import { LikesYouScreen } from './components/likes/LikesYouScreen';
import { MatchesScreen } from './components/matches/MatchesScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { MatchCelebrationModal } from './components/modals/MatchCelebrationModal';
import { FilterModal } from './components/modals/FilterModal';
import { PremiumModal } from './components/modals/PremiumModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { BlockReportModal } from './components/modals/BlockReportModal';
import { DownloadAppModal } from './components/modals/DownloadAppModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Sparkles } from 'lucide-react';

const DatingAppInner: React.FC = () => {
  const {
    currentUser,
    activeTab,
    toastMessage,
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    isAdminMode,
  } = useDating();

  // If in dedicated admin mode (Data Management & System Dashboard)
  if (isAdminMode) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Subtle Ambient Glow on Desktop */}
      <div className="fixed inset-0 pointer-events-none hidden md:block overflow-hidden z-0">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-rose-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-pink-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Full-width Desktop & Responsive Website Navigation Header */}
      {currentUser && currentUser.isCompleted && <TopNavBar />}

      {/* Main Content Area: Responsive Full-Screen Workspace */}
      <main className="flex-1 flex flex-col relative z-10 overflow-x-hidden">
        {!currentUser ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-[90vh]">
            <div className="w-full max-w-md my-auto">
              <AuthScreen />
            </div>
          </div>
        ) : !currentUser.isCompleted ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-[90vh]">
            <div className="w-full max-w-xl my-auto">
              <OnboardingScreen />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {activeTab === 'discovery' && <DiscoveryScreen />}
            {activeTab === 'likes' && <LikesYouScreen />}
            {activeTab === 'matches' && <MatchesScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
          </div>
        )}
      </main>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div className="px-5 py-2.5 bg-neutral-900/95 border border-rose-500/40 text-neutral-100 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md animate-in slide-in-from-top-3 duration-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
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
