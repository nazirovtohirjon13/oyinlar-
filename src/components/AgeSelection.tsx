import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { AGE_GROUP_THEMES, AVATAR_OPTIONS } from '../data/games';
import { AgeGroup } from '../types/game';
import { soundEngine } from '../utils/sound';

interface AgeSelectionProps {
  onComplete: (name: string, ageGroup: AgeGroup, avatarId: string) => void;
}

export const AgeSelection: React.FC<AgeSelectionProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState('leo');
  const [error, setError] = useState('');

  const ageList: AgeGroup[] = ['3-5', '6-9', '10-15', '16-20'];

  const handleSelectAge = (age: AgeGroup) => {
    soundEngine.playClick();
    setSelectedAge(age);
    setStep(2);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Iltimos, kamida 2 ta harfdan iborat ismingizni kiriting.');
      return;
    }
    if (!selectedAge) return;
    soundEngine.playLaunch();
    onComplete(trimmed, selectedAge, avatarId);
  };

  const activeTheme = selectedAge ? AGE_GROUP_THEMES[selectedAge] : null;

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex flex-col justify-center px-4 sm:px-8 py-10">
      <div className="max-w-6xl w-full mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-sm font-semibold text-amber-400 mb-2">ZehnOlam · 3D Ta’limiy O‘yinlar Platformasi</div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 text-balance">
            {step === 1 ? 'Yoshingizni tanlang' : 'Shaxsiy profilingizni yarating'}
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            {step === 1
              ? 'Har bir yosh toifasi uchun maxsus 3D muhit va 13 ta noyob ta’limiy o‘yin tayyorlangan.'
              : 'Profil ma’lumotlari faqat qurilmangizda saqlanadi. Telefon raqami yoki elektron pochta talab qilinmaydi.'}
          </p>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ageList.map((ageKey, idx) => {
              const t = AGE_GROUP_THEMES[ageKey];
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.28 }}
                  onClick={() => handleSelectAge(t.id)}
                  className={`group text-left rounded-2xl bg-[#111827] border ${t.borderTintClass} overflow-hidden transition-transform duration-200 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-amber-400 flex flex-col cursor-pointer`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                    <img
                      src={t.imagePath}
                      alt={t.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-black/25 to-transparent" />
                    <div
                      className="absolute bottom-3 left-4 text-2xl font-extrabold font-display"
                      style={{ color: t.accentHex }}
                    >
                      {t.label}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">{t.title}</h2>
                      <p className="text-xs font-medium text-slate-300 mb-2">{t.subtitle}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>
                    </div>
                    <div
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${t.buttonClass}`}
                    >
                      <span>Tanlash</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto rounded-2xl bg-[#111827] border border-slate-800 p-6 sm:p-8 shadow-2xl"
          >
            {activeTheme && (
              <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
                <div>
                  <div className="text-xs text-slate-400">Tanlangan toifa</div>
                  <div className="text-base font-bold" style={{ color: activeTheme.accentHex }}>
                    {activeTheme.label} · {activeTheme.title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  O‘zgartirish
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="player-name" className="block text-sm font-semibold text-white mb-2">
                  Ismingizni kiriting
                </label>
                <input
                  id="player-name"
                  type="text"
                  maxLength={24}
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Masalan: Azizbek"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-base"
                />
                {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
              </div>

              <div>
                <div className="text-sm font-semibold text-white mb-2">Avatar tanlang</div>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setAvatarId(av.id);
                      }}
                      className={`aspect-square rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${av.bg} border-2 transition-transform cursor-pointer ${
                        avatarId === av.id ? 'border-white scale-105' : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      {av.symbol}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition-colors cursor-pointer"
              >
                Boshlash
              </button>

              <div className="flex items-start gap-2.5 text-xs text-slate-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Bolalar xavfsizligi: hech qanday shaxsiy aloqa ma’lumotlari so‘ralmaydi va profil istalgan payt tozalab tashlanishi mumkin.
                </span>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};
