import React from 'react';
import { AGE_GROUP_THEMES, AVATAR_OPTIONS } from '../data/games';
import { PlayerProfile } from '../types/game';

interface NavbarProps {
  profile: PlayerProfile;
  totalPoints: number;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  totalPoints,
  onOpenSettings,
}) => {
  const theme = AGE_GROUP_THEMES[profile.ageGroup];
  const avatar = AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) ?? AVATAR_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F19]/95 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#bosh-sahifa"
          className="text-xl font-extrabold font-display tracking-tight text-white whitespace-nowrap shrink-0"
        >
          ZehnOlam
        </a>

        {/* Zone 2: 4 Concise Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <a href="#bosh-sahifa" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Bosh sahifa
          </a>
          <a href="#oyinlar" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            O‘yinlar
          </a>
          <a href="#vazifalar" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Vazifalar
          </a>
          <a href="#statistika" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Statistika
          </a>
        </nav>

        {/* Zone 3: Primary Player Profile / Settings Action */}
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span
            className={`w-6 h-6 rounded-lg bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-sm shrink-0`}
            aria-hidden="true"
          >
            {avatar.symbol}
          </span>
          <span className="font-semibold max-w-[110px] truncate">{profile.name}</span>
          <span className="text-slate-500 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs font-mono-num text-amber-400 hidden sm:inline">
            {theme.label} · {totalPoints} ball
          </span>
        </button>
      </div>
    </header>
  );
};
