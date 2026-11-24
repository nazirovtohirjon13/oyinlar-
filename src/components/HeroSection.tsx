import React from 'react';
import { Play, Compass } from 'lucide-react';
import { AGE_GROUP_THEMES } from '../data/games';
import { PlayerProfile } from '../types/game';
import { HeroScene3D } from './three/HeroScene3D';

interface HeroSectionProps {
  profile: PlayerProfile;
  onStartFeatured: () => void;
  onBrowseGames: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  profile,
  onStartFeatured,
  onBrowseGames,
}) => {
  const theme = AGE_GROUP_THEMES[profile.ageGroup];

  return (
    <section id="bosh-sahifa" className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Copy Column */}
        <div className="lg:col-span-6 flex flex-col justify-center py-4">
          <div className="text-sm font-semibold text-amber-400 mb-3">
            Xush kelibsiz, {profile.name}! · {theme.label} — {theme.title}
          </div>

          <h1
            className="text-4xl sm:text-5xl xl:text-[3.4rem] font-extrabold font-display tracking-tight text-white leading-[1.1] mb-4"
            style={{ textWrap: 'balance' }}
          >
            O‘YNA, O‘RGAN, RIVOJLAN!
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-7 max-w-xl">
            Aqlni charxlaydigan 3D o‘yinlar olamiga xush kelibsiz! Sizning yoshingizga mos 13 ta maxsus 3D o‘yin aynan shu yerda.
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <button
              onClick={onStartFeatured}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              O‘YINLARNI BOSHLASH
            </button>
            <button
              onClick={onBrowseGames}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              O‘YINLARNI KO‘RISH
            </button>
          </div>
        </div>

        {/* Right Interactive 3D Viewport */}
        <div className="lg:col-span-6 min-h-[300px] sm:min-h-[360px] lg:h-full">
          <HeroScene3D
            accentHex={theme.accentHex}
            secondaryHex={theme.secondaryHex}
            fallbackImage="/src/assets/images/hero_gaming_world_1795501329403.jpg"
          />
        </div>
      </div>
    </section>
  );
};
