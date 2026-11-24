import React from 'react';
import { Award, CheckCircle2, Flame, Star, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, getGamesByAgeGroup, getPlayerLevel } from '../data/games';
import { AgeGroup, PlayerProgress } from '../types/game';

interface ProgressDashboardProps {
  ageGroup: AgeGroup;
  progress: PlayerProgress;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  ageGroup,
  progress,
}) => {
  const ageGames = getGamesByAgeGroup(ageGroup);
  const completedCount = ageGames.filter((g) => progress.records[g.id]?.completed).length;
  const accuracy =
    progress.totalAnswers > 0
      ? Math.round((progress.correctAnswers / progress.totalAnswers) * 100)
      : 0;
  const levelInfo = getPlayerLevel(progress.totalPoints);

  const topRecords = ageGames
    .filter((g) => progress.records[g.id])
    .sort((a, b) => (progress.records[b.id]?.bestScore ?? 0) - (progress.records[a.id]?.bestScore ?? 0));

  return (
    <section id="statistika" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16 space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white">O‘yinchi statistikasi va yutuqlar</h2>
        <p className="text-sm text-slate-400 mt-1">
          Natijalaringiz, darajangiz va qo‘lga kiritilgan yutuqlar paneli
        </p>
      </div>

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Umumiy ochko</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono-num text-amber-400">{progress.totalPoints}</div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Yakunlangan o‘yinlar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono-num text-white">
            {completedCount} <span className="text-base text-slate-500 font-normal">/ {ageGames.length}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Joriy daraja</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">
            {levelInfo.level}-daraja · {levelInfo.title}
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2.5 overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${levelInfo.progressPct}%` }} />
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>O‘rtacha aniqlik</span>
            <Trophy className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono-num text-white">{accuracy}%</div>
        </div>
      </div>

      {/* Achievements & Best Scores Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-[#111827] border border-slate-800 p-5 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Yutuqlar ({progress.unlockedAchievements.length}/{ACHIEVEMENTS.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = progress.unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border ${
                    unlocked
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-slate-900/70 border-slate-800 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <Award className={`w-4 h-4 shrink-0 ${unlocked ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span>{ach.title}</span>
                    </div>
                    <span className="text-xs font-mono-num text-amber-400">+{ach.pointsReward}</span>
                  </div>
                  <p className="text-xs text-slate-400">{ach.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#111827] border border-slate-800 p-5 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Eng yaxshi natijalar</h3>
          {topRecords.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Hali o‘yinlar yakunlanmagan. Istalgan o‘yinni tanlab rekord o‘rnating!
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
              {topRecords.slice(0, 6).map((g) => {
                const rec = progress.records[g.id];
                return (
                  <div key={g.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{g.title}</div>
                      <div className="text-xs text-slate-400">
                        {rec.plays} marta o‘ynalgan · {rec.bestAccuracy}% aniqlik
                      </div>
                    </div>
                    <div className="font-mono-num font-bold text-emerald-400 shrink-0">
                      {rec.bestScore} ball
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
