import React from 'react';
import {
  Atom,
  Box,
  Brain,
  Building2,
  Calculator,
  Code2,
  Compass,
  Cpu,
  Crown,
  Gem,
  Grid3X3,
  Hash,
  Heart,
  Layers,
  Lock,
  Palette,
  Play,
  Puzzle,
  Route,
  Scale,
  Search,
  Shapes,
  Sparkles,
  Sun,
  Swords,
  Type,
  Volume2,
  Zap,
} from 'lucide-react';
import { AGE_GROUP_THEMES, CATEGORY_LABELS } from '../data/games';
import { GameDefinition, GameRecord } from '../types/game';

interface GameCardProps {
  game: GameDefinition;
  record?: GameRecord;
  isFavorite: boolean;
  onPlay: (game: GameDefinition) => void;
  onToggleFavorite: (gameId: string) => void;
}

function renderGameIcon(iconKey: string) {
  const cls = 'w-10 h-10 text-white drop-shadow-md';
  switch (iconKey) {
    case 'palette': return <Palette className={cls} />;
    case 'shapes': return <Shapes className={cls} />;
    case 'volume': return <Volume2 className={cls} />;
    case 'scale': return <Scale className={cls} />;
    case 'hash': return <Hash className={cls} />;
    case 'layers': return <Layers className={cls} />;
    case 'compass': return <Compass className={cls} />;
    case 'grid': return <Grid3X3 className={cls} />;
    case 'sun': return <Sun className={cls} />;
    case 'sparkles': return <Sparkles className={cls} />;
    case 'blocks': return <Box className={cls} />;
    case 'calculator': return <Calculator className={cls} />;
    case 'brain': return <Brain className={cls} />;
    case 'type': return <Type className={cls} />;
    case 'route': return <Route className={cls} />;
    case 'zap': return <Zap className={cls} />;
    case 'box': return <Box className={cls} />;
    case 'cpu': return <Cpu className={cls} />;
    case 'puzzle': return <Puzzle className={cls} />;
    case 'gem': return <Gem className={cls} />;
    case 'swords': return <Swords className={cls} />;
    case 'atom': return <Atom className={cls} />;
    case 'building': return <Building2 className={cls} />;
    case 'code': return <Code2 className={cls} />;
    case 'lock': return <Lock className={cls} />;
    case 'search': return <Search className={cls} />;
    case 'crown': return <Crown className={cls} />;
    default: return <Sparkles className={cls} />;
  }
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  record,
  isFavorite,
  onPlay,
  onToggleFavorite,
}) => {
  const ageMeta = AGE_GROUP_THEMES[game.ageGroup];

  return (
    <article className="group rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-slate-600 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1">
      {/* 3D Isometric Game Thumbnail */}
      <div
        onClick={() => onPlay(game)}
        className="relative h-40 w-full overflow-hidden cursor-pointer flex items-center justify-center bg-[#0D1322]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 25%, ${game.accentHex}33 0%, transparent 62%), linear-gradient(135deg, #0D1322 0%, #151F34 100%)`,
        }}
      >
        {/* Subtle 3D geometric perspective grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 320 160"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 120 L160 40 L320 120" stroke={game.accentHex} strokeWidth="1" />
          <path d="M0 140 L160 60 L320 140" stroke="#94A3B8" strokeWidth="0.75" />
          <circle cx="160" cy="80" r="54" stroke={game.accentHex} strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* 3D Floating Cube Emblem */}
        <div
          className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: `linear-gradient(145deg, ${game.accentHex}, ${ageMeta.secondaryHex})`,
            boxShadow: `0 16px 32px -10px ${game.accentHex}66`,
          }}
        >
          {renderGameIcon(game.iconKey)}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id);
          }}
          aria-label={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
          className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-slate-950/75 hover:bg-slate-900 border border-slate-700/80 transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
            }`}
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 truncate">
            <span>{CATEGORY_LABELS[game.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{game.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span>{ageMeta.label}</span>
          </div>

          <h3 className="text-base font-bold text-white mb-1.5 truncate">{game.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{game.shortDesc}</p>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div className="text-xs font-mono-num">
            {record ? (
              <span className="text-emerald-400 font-semibold">Rekord: {record.bestScore}</span>
            ) : (
              <span className="text-slate-500">Yangi o‘yin</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onPlay(game)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            O‘ynash
          </button>
        </div>
      </div>
    </article>
  );
};
