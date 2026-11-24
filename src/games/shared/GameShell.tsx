import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AGE_GROUP_THEMES } from '../../data/games';
import { GameCompletionPayload, GameDefinition } from '../../types/game';
import { soundEngine } from '../../utils/sound';
import { ActiveGameProps } from './gameHelpers';

interface GameShellProps {
  game: GameDefinition;
  bestScore: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  onCompleteRecord: (gameId: string, payload: GameCompletionPayload) => { earnedPoints: number; newAchievements: string[] };
  onExit: () => void;
  renderGame: (props: ActiveGameProps) => React.ReactNode;
}

type Phase = 'intro' | 'playing' | 'paused' | 'completed';

export const GameShell: React.FC<GameShellProps> = ({
  game,
  bestScore,
  soundMuted,
  onToggleSound,
  onCompleteRecord,
  onExit,
  renderGame,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [level, setLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restartNonce, setRestartNonce] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [completionInfo, setCompletionInfo] = useState<{
    payload: GameCompletionPayload;
    earnedPoints: number;
  } | null>(null);

  const theme = AGE_GROUP_THEMES[game.ageGroup];

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const handleRestart = useCallback(() => {
    soundEngine.playClick();
    setScore(0);
    setCorrectCount(0);
    setTotalQuestions(0);
    setLevel(1);
    setElapsedSeconds(0);
    setFeedback(null);
    setCompletionInfo(null);
    setRestartNonce((n) => n + 1);
    setPhase('playing');
  }, []);

  const handleScore = useCallback((points: number, correct = true, msg?: string) => {
    setScore((s) => Math.max(0, s + points));
    setTotalQuestions((t) => t + 1);
    if (correct) {
      setCorrectCount((c) => c + 1);
      soundEngine.playSuccess();
      setFeedback({ text: msg || 'Ajoyib!', ok: true });
    } else {
      soundEngine.playError();
      setFeedback({ text: msg || "Yana bir bor urinib ko'ring!", ok: false });
    }
  }, []);

  const handleAttempt = useCallback((correct: boolean, msg?: string) => {
    setTotalQuestions((t) => t + 1);
    if (correct) {
      setCorrectCount((c) => c + 1);
      soundEngine.playSuccess();
      setFeedback({ text: msg || 'Barakalla!', ok: true });
    } else {
      soundEngine.playError();
      setFeedback({ text: msg || "Yana bir bor urinib ko'ring!", ok: false });
    }
  }, []);

  const handleLevelChange = useCallback((lvl: number, maxLvl: number) => {
    setLevel(lvl);
    setMaxLevel(maxLvl);
  }, []);

  const handleComplete = useCallback(
    (payload: GameCompletionPayload) => {
      soundEngine.playWin();
      const result = onCompleteRecord(game.id, payload);
      setCompletionInfo({
        payload,
        earnedPoints: result.earnedPoints,
      });
      setPhase('completed');
    },
    [game.id, onCompleteRecord]
  );

  const accuracy =
    totalQuestions > 0 ? Math.min(100, Math.round((correctCount / totalQuestions) * 100)) : 100;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080C16] text-slate-100">
      {/* Top Game Bar */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-[#0D1322] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Chiqish</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white truncate">{game.title}</h2>
            <p className="text-xs text-slate-400 truncate hidden sm:block">
              {theme.label} · {game.difficulty}
            </p>
          </div>
        </div>

        {/* Live Telemetry */}
        <div className="flex items-center gap-3 sm:gap-5 text-sm font-mono-num">
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">Bosqich</div>
            <div className="font-bold text-white">
              {level}/{maxLevel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">Ochko</div>
            <div className="font-bold text-amber-400">{score}</div>
          </div>
          {game.timed && (
            <div className="text-center hidden sm:block">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">Vaqt</div>
              <div className="font-bold text-cyan-400">{formatTime(elapsedSeconds)}</div>
            </div>
          )}
          <div className="text-center hidden md:block">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">Rekord</div>
            <div className="font-bold text-emerald-400">{Math.max(bestScore, score)}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Yo'riqnoma"
            aria-label="Yo'riqnoma"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
            title={soundMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
            aria-label={soundMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          {phase === 'playing' || phase === 'paused' ? (
            <>
              <button
                onClick={() => setPhase((p) => (p === 'paused' ? 'playing' : 'paused'))}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
                title={phase === 'paused' ? 'Davom ettirish' : 'Pauza'}
                aria-label={phase === 'paused' ? 'Davom ettirish' : 'Pauza'}
              >
                {phase === 'paused' ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRestart}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Qayta boshlash"
                aria-label="Qayta boshlash"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      </header>

      {/* Main Arena */}
      <main className="relative flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 flex flex-col">
        {feedback && phase === 'playing' && (
          <div
            className={`mb-3 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-between border ${
              feedback.ok
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative flex-1 min-h-[420px] flex flex-col">
          {phase !== 'intro' &&
            renderGame({
              onScore: handleScore,
              onAttempt: handleAttempt,
              onLevelChange: handleLevelChange,
              onComplete: handleComplete,
              isPaused: phase !== 'playing',
              restartNonce,
            })}
        </div>

        {/* Intro Screen */}
        {phase === 'intro' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#080C16]/95 p-4">
            <div className="max-w-lg w-full rounded-2xl bg-[#111827] border border-slate-800 p-6 sm:p-8 shadow-2xl">
              <div className="text-xs font-semibold text-amber-400 mb-2">
                {theme.label} · {game.difficulty}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{game.title}</h1>
              <p className="text-slate-300 text-sm sm:text-base mb-5 leading-relaxed">{game.shortDesc}</p>

              <div className="space-y-3 mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">O‘yin maqsadi</div>
                  <p className="text-sm text-slate-200">{game.objective}</p>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 mb-1">Qanday o‘ynaladi</div>
                  <p className="text-sm text-slate-200">{game.instructions}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    soundEngine.playLaunch();
                    setPhase('playing');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-colors cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Boshlash
                </button>
                <button
                  onClick={onExit}
                  className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Orqaga
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {phase === 'paused' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-4">
            <div className="max-w-sm w-full rounded-2xl bg-[#111827] border border-slate-800 p-6 text-center shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2">O‘yin to‘xtatildi</h3>
              <p className="text-sm text-slate-400 mb-6">Tayyor bo‘lganingizda davom ettirishingiz mumkin.</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setPhase('playing')}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  Davom ettirish
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
                >
                  Qayta boshlash
                </button>
                <button
                  onClick={onExit}
                  className="w-full py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Bosh sahifaga qaytish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-4">
            <div className="max-w-md w-full rounded-2xl bg-[#111827] border border-slate-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">O‘yin yo‘riqnomasi</h3>
                <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-300 mb-3">{game.objective}</p>
              <p className="text-sm text-slate-200 bg-slate-900 p-3.5 rounded-xl border border-slate-800 mb-5">
                {game.instructions}
              </p>
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
              >
                Tushunarli
              </button>
            </div>
          </div>
        )}

        {/* Completion Screen */}
        {phase === 'completed' && completionInfo && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/92 p-4">
            <div className="max-w-md w-full rounded-2xl bg-[#111827] border border-amber-500/40 p-6 sm:p-8 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy className="w-9 h-9" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">Siz uddaladingiz!</h3>
              <p className="text-sm text-emerald-400 font-medium mb-6">
                Barakalla! Keyingi bosqich va yangi o‘yinlarga tayyormisiz?
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Ball</div>
                  <div className="text-xl font-bold font-mono-num text-amber-400">{completionInfo.payload.score}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Aniqlik</div>
                  <div className="text-xl font-bold font-mono-num text-cyan-400">{accuracy}%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Jami bonus</div>
                  <div className="text-xl font-bold font-mono-num text-emerald-400">+{completionInfo.earnedPoints}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  Qayta o‘ynash
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors cursor-pointer"
                >
                  Bosh sahifaga qaytish
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
