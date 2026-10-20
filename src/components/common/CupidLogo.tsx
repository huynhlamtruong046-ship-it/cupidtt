import React from 'react';

interface CupidLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CupidLogo: React.FC<CupidLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  onClick,
}) => {
  // Dimensions map
  const dimensions = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', badge: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', badge: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', badge: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', badge: 'text-sm' },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Cupid Emblem: Hình 1 Logo nhận diện chính */}
      <div
        className={`${dimensions.icon} rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 p-[1.5px] shadow-lg shadow-rose-500/25 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-rose-500/40`}
      >
        <div className="w-full h-full rounded-[10px] bg-neutral-950 flex items-center justify-center overflow-hidden relative">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/30 to-pink-500/20" />
          
          <svg
            viewBox="0 0 100 100"
            className="w-4/5 h-4/5 relative z-10 drop-shadow-[0_2px_8px_rgba(255,51,102,0.6)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3366" />
                <stop offset="45%" stopColor="#FF5E7E" />
                <stop offset="100%" stopColor="#FFA07A" />
              </linearGradient>
              <linearGradient id="logoWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA8BA" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FF3366" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Left Wing Feather */}
            <path
              d="M32 40 C20 28 12 40 8 50 C6 56 10 59 16 57 C24 54 30 48 35 46 Z"
              fill="url(#logoWingGrad)"
            />

            {/* Right Wing Feather */}
            <path
              d="M68 40 C80 28 88 40 92 50 C94 56 90 59 84 57 C76 54 70 48 65 46 Z"
              fill="url(#logoWingGrad)"
            />

            {/* Cupid Central Heart Body */}
            <path
              d="M50 82 C50 82 22 62 22 41 C22 28 32 20 43 20 C48 20 49 22.5 50 24 C51 22.5 52 20 57 20 C68 20 78 28 78 41 C78 62 50 82 50 82 Z"
              fill="url(#logoHeartGrad)"
            />

            {/* Top-Right Heart Sparkle */}
            <path
              d="M65 29 Q65 32 68 32 Q65 32 65 35 Q65 32 62 32 Q65 32 65 29 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </div>

      {/* Brand Wordmark Typography */}
      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={`${dimensions.text} font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-rose-300 bg-clip-text text-transparent leading-none`}
          >
            CupidGo
          </span>
        </div>
      )}
    </div>
  );
};
