import React from 'react';
import { Flame, Star, MessageCircle, User } from 'lucide-react';
import { useDating } from '../../context/DatingContext';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, matches, likedMeProfiles, currentUser } = useDating();

  const unreadMessagesCount = matches.reduce((acc, m) => acc + (m.unreadCount || 0), 0);
  const likesCount = likedMeProfiles.length;

  const tabs = [
    {
      id: 'discovery' as const,
      label: 'Khám phá',
      icon: Flame,
      badge: 0,
    },
    {
      id: 'likes' as const,
      label: 'Đã thích',
      icon: Star,
      badge: likesCount,
    },
    {
      id: 'matches' as const,
      label: 'Tin nhắn',
      icon: MessageCircle,
      badge: unreadMessagesCount,
    },
    {
      id: 'profile' as const,
      label: 'Cá nhân',
      icon: User,
      badge: 0,
      isPremium: currentUser?.isPremium,
    },
  ];

  return (
    <nav 
      aria-label="Điều hướng chính"
      className="shrink-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800/80 px-4 py-2"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 transition-transform active:scale-95 min-h-[48px]"
            >
              <div className="relative">
                <IconComponent
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive
                      ? 'text-rose-500 fill-rose-500/20 stroke-[2.2]'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
                {tab.isPremium && (
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-neutral-900" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-rose-500 font-semibold' : 'text-neutral-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
