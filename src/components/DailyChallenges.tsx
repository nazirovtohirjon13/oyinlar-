import React from 'react';
import { CheckCircle2, Target } from 'lucide-react';
import { DAILY_CHALLENGES } from '../data/games';
import { PlayerProgress } from '../types/game';

interface DailyChallengesProps {
  progress: PlayerProgress;
}

export const DailyChallenges: React.FC<DailyChallengesProps> = ({ progress }) => {
  return (
    <section id="vazifalar" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white">Kundalik vazifalar</h2>
          <p className="text-sm text-slate-400 mt-1">
            Har kuni vazifalarni bajaring va qo‘shimcha bonus ochkolariga ega bo‘ling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {DAILY_CHALLENGES.map((ch) => {
          const currentVal = progress.daily[ch.metric] ?? 0;
          const pct = Math.min(100, Math.round((currentVal / ch.target) * 100));
          const done = currentVal >= ch.target;

          return (
            <div
              key={ch.id}
              className={`rounded-2xl p-5 border transition-colors ${
                done
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-[#111827] border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Target className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <h3 className="font-bold text-white">{ch.title}</h3>
                </div>
                <span className="text-xs font-mono-num font-bold text-amber-400 whitespace-nowrap">
                  +{ch.rewardPoints} ball
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">{ch.description}</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono-num">
                  <span className="text-slate-300">
                    {Math.min(currentVal, ch.target)} / {ch.target}
                  </span>
                  <span className={done ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {done ? 'Bajarildi' : `${pct}%`}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      done ? 'bg-emerald-400' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
