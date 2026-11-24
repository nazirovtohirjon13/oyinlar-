import { useState } from 'react';
import { Award, X } from 'lucide-react';
import { AgeSelection } from './components/AgeSelection';
import { DailyChallenges } from './components/DailyChallenges';
import { GameLibrary } from './components/GameLibrary';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SettingsModal } from './components/SettingsModal';
import { ACHIEVEMENTS, getGamesByAgeGroup } from './data/games';
import { renderGameById } from './games/GameRouter';
import { GameShell } from './games/shared/GameShell';
import { usePlayerStore } from './hooks/usePlayerStore';
import { GameDefinition } from './types/game';
import { soundEngine } from './utils/sound';

export default function App() {
  const {
    profile,
    progress,
    newlyUnlocked,
    clearNewlyUnlocked,
    registerPlayer,
    updateProfile,
    resetProfile,
    toggleSound,
    toggleFavorite,
    markPlayed,
    recordGameResult,
  } = usePlayerStore();

  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!profile) {
    return <AgeSelection onComplete={registerPlayer} />;
  }

  const ageGames = getGamesByAgeGroup(profile.ageGroup);

  const handleOpenGame = (game: GameDefinition) => {
    soundEngine.playLaunch();
    markPlayed(game.id);
    setActiveGame(game);
  };

  const handleStartFeatured = () => {
    const featured = ageGames.find((g) => g.featured) ?? ageGames[0];
    if (featured) handleOpenGame(featured);
  };

  const handleBrowseGames = () => {
    document.getElementById('oyinlar')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar
        profile={profile}
        totalPoints={progress.totalPoints}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1">
        <HeroSection
          profile={profile}
          onStartFeatured={handleStartFeatured}
          onBrowseGames={handleBrowseGames}
        />

        <div className="border-t border-slate-800/70">
          <GameLibrary
            ageGroup={profile.ageGroup}
            progress={progress}
            onPlayGame={handleOpenGame}
            onToggleFavorite={toggleFavorite}
          />
        </div>

        <div className="border-t border-slate-800/70">
          <DailyChallenges progress={progress} />
        </div>

        <div className="border-t border-slate-800/70">
          <ProgressDashboard ageGroup={profile.ageGroup} progress={progress} />
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        ZehnOlam — Bolalar, o‘smirlar va yoshlar uchun o‘zbek tilidagi 3D ta’limiy o‘yinlar platformasi · 52 ta noyob o‘yin
      </footer>

      {settingsOpen && (
        <SettingsModal
          profile={profile}
          soundMuted={progress.soundMuted}
          onToggleSound={toggleSound}
          onSave={updateProfile}
          onResetProfile={resetProfile}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {activeGame && (
        <GameShell
          game={activeGame}
          bestScore={progress.records[activeGame.id]?.bestScore ?? 0}
          soundMuted={progress.soundMuted}
          onToggleSound={toggleSound}
          onCompleteRecord={recordGameResult}
          onExit={() => setActiveGame(null)}
          renderGame={(gameProps) => renderGameById(activeGame.id, gameProps)}
        />
      )}

      {newlyUnlocked.length > 0 && !activeGame && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-[#111827] border border-amber-500/50 p-4 shadow-2xl flex items-start gap-3">
          <Award className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-semibold text-amber-400">Yangi yutuq ochildi!</div>
            <div className="text-sm font-bold text-white">
              {ACHIEVEMENTS.find((a) => a.id === newlyUnlocked[0])?.title}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {ACHIEVEMENTS.find((a) => a.id === newlyUnlocked[0])?.description}
            </div>
          </div>
          <button onClick={clearNewlyUnlocked} className="text-slate-400 hover:text-white cursor-pointer" aria-label="Yopish">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
