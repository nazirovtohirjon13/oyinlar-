import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { AGE_GROUP_THEMES, CATEGORY_LABELS, getGamesByAgeGroup } from '../data/games';
import { AgeGroup, GameCategory, GameDefinition, PlayerProgress } from '../types/game';
import { GameCard } from './GameCard';

interface GameLibraryProps {
  ageGroup: AgeGroup;
  progress: PlayerProgress;
  onPlayGame: (game: GameDefinition) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const GameLibrary: React.FC<GameLibraryProps> = ({
  ageGroup,
  progress,
  onPlayGame,
  onToggleFavorite,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'barchasi' | 'sevimli'>('barchasi');

  const ageGames = useMemo(() => getGamesByAgeGroup(ageGroup), [ageGroup]);
  const theme = AGE_GROUP_THEMES[ageGroup];

  const availableCategories = useMemo(() => {
    const cats = new Set<GameCategory>();
    ageGames.forEach((g) => cats.add(g.category));
    return Array.from(cats);
  }, [ageGames]);

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ageGames.filter((g) => {
      if (selectedCategory === 'sevimli' && !progress.favorites.includes(g.id)) return false;
      if (selectedCategory !== 'barchasi' && selectedCategory !== 'sevimli' && g.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.shortDesc.toLowerCase().includes(q) ||
        CATEGORY_LABELS[g.category].toLowerCase().includes(q)
      );
    });
  }, [ageGames, search, selectedCategory, progress.favorites]);

  const featuredGames = useMemo(() => ageGames.filter((g) => g.featured), [ageGames]);
  const recommendedGames = useMemo(() => ageGames.filter((g) => g.recommended), [ageGames]);
  const popularGames = useMemo(() => ageGames.filter((g) => g.popular), [ageGames]);
  const recentGames = useMemo(
    () =>
      progress.recentlyPlayed
        .map((id) => ageGames.find((g) => g.id === id))
        .filter((g): g is GameDefinition => Boolean(g)),
    [progress.recentlyPlayed, ageGames]
  );

  const showSections = !search.trim() && selectedCategory === 'barchasi';

  return (
    <section id="oyinlar" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {theme.label} uchun 3D o‘yinlar kutubxonasi
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Sizning yosh toifangizga mos {ageGames.length} ta noyob ta’limiy 3D o‘yin
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="O‘yin nomini qidiring..."
              aria-label="O‘yin qidirish"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Qidiruvni tozalash"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('barchasi')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'barchasi'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Barchasi ({ageGames.length})
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedCategory('sevimli')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'sevimli'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Sevimlilar ({progress.favorites.filter((id) => ageGames.some((g) => g.id === id)).length})
          </button>
        </div>
      </div>

      {/* Recently Played */}
      {showSections && recentGames.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Yaqinda o‘ynalganlar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentGames.slice(0, 4).map((game) => (
              <GameCard
                key={`recent-${game.id}`}
                game={game}
                record={progress.records[game.id]}
                isFavorite={progress.favorites.includes(game.id)}
                onPlay={onPlayGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* Featured & Recommended */}
      {showSections && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Tanlangan o‘yinlar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {featuredGames.slice(0, 2).map((game) => (
                <GameCard
                  key={`feat-${game.id}`}
                  game={game}
                  record={progress.records[game.id]}
                  isFavorite={progress.favorites.includes(game.id)}
                  onPlay={onPlayGame}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Tavsiya etilganlar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {recommendedGames.slice(0, 2).map((game) => (
                <GameCard
                  key={`rec-${game.id}`}
                  game={game}
                  record={progress.records[game.id]}
                  isFavorite={progress.favorites.includes(game.id)}
                  onPlay={onPlayGame}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular Games */}
      {showSections && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Ommabop o‘yinlar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularGames.slice(0, 4).map((game) => (
              <GameCard
                key={`pop-${game.id}`}
                game={game}
                record={progress.records[game.id]}
                isFavorite={progress.favorites.includes(game.id)}
                onPlay={onPlayGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full Age-Appropriate 13 Games Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            {selectedCategory === 'sevimli'
              ? 'Sevimli o‘yinlar'
              : selectedCategory === 'barchasi'
              ? 'Barcha o‘yinlar (13 ta)'
              : `${CATEGORY_LABELS[selectedCategory]} o‘yinlari`}
          </h3>
          <span className="text-xs font-mono-num text-slate-400">{filteredGames.length} ta o‘yin</span>
        </div>

        {filteredGames.length === 0 ? (
          <div className="rounded-2xl bg-[#111827] border border-slate-800 p-10 text-center text-slate-400">
            Ushbu bo‘limda hozircha o‘yin topilmadi. Qidiruv so‘zini yoki toifani o‘zgartirib ko‘ring.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                record={progress.records[game.id]}
                isFavorite={progress.favorites.includes(game.id)}
                onPlay={onPlayGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
