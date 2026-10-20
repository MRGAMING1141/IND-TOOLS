import React from 'react';

interface IndHubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const IndHubLogo: React.FC<IndHubLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  subtitle = 'MAX SUITE',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  }[size];

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Vector Badge (Gradient-Free Soft Clay Depth) */}
      <div
        className={`${iconDimensions} relative rounded-xl flex items-center justify-center p-1.5 
          bg-white border border-slate-200/90 
          shadow-[0_2px_8px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1.5px_0_rgba(226,232,240,0.8)] 
          transition-transform hover:scale-105 active:scale-95`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Interconnected Hexagonal Shield (Solid Royal Blue) */}
          <path
            d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
            stroke="#2563eb"
            strokeWidth="2.75"
            strokeLinejoin="round"
          />

          {/* Precision Cross-Links / Circuit Nodes */}
          <path
            d="M24 4V18M42 14L30 22M42 34L30 28M24 44V30M6 34L18 28M6 14L18 22"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Core Faceted Prism / Diamond Node */}
          <polygon
            points="24,14 34,24 24,34 14,24"
            fill="#e0f2fe"
            stroke="#0284c7"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Central Energetic Core */}
          <circle cx="24" cy="24" r="3.5" fill="#2563eb" />
          <circle cx="24" cy="24" r="1.5" fill="#ffffff" />

          {/* Tri-Node Accents */}
          <circle cx="24" cy="6.5" r="2" fill="#d97706" />
          <circle cx="39.5" cy="32.5" r="2" fill="#059669" />
          <circle cx="8.5" cy="32.5" r="2" fill="#0284c7" />
        </svg>
      </div>

      {/* Brand Typography (High Contrast Light Mode) */}
      {showText && (
        <div className="flex flex-col leading-none shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`${titleSizes} font-black tracking-tight text-slate-900 font-sans shrink-0 whitespace-nowrap`}
            >
              IND<span className="text-blue-600 ml-0.5">HUB</span>
            </span>
            <span className="hidden sm:inline-flex text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest shadow-sm shrink-0 whitespace-nowrap">
              {subtitle}
            </span>
          </div>
          <span className="hidden sm:block text-[10px] text-slate-500 font-medium tracking-wide mt-0.5 shrink-0 whitespace-nowrap">
            Engineering & Tools
          </span>
        </div>
      )}
    </div>
  );
};
