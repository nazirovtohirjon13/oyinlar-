import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { AGE_GROUP_THEMES, AVATAR_OPTIONS } from '../data/games';
import { AgeGroup, PlayerProfile } from '../types/game';
import { soundEngine } from '../utils/sound';

interface SettingsModalProps {
  profile: PlayerProfile;
  soundMuted: boolean;
  onToggleSound: () => void;
  onSave: (updates: Partial<Pick<PlayerProfile, 'name' | 'ageGroup' | 'avatarId'>>) => void;
  onResetProfile: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  soundMuted,
  onToggleSound,
  onSave,
  onResetProfile,
  onClose,
}) => {
  const [name, setName] = useState(profile.name);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(profile.ageGroup);
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    soundEngine.playSuccess();
    onSave({ name: name.trim(), ageGroup, avatarId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
      <div className="max-w-lg w-full rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Profil va sozlamalar</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-semibold text-slate-200 mb-1.5">
              O‘yinchi ismi
            </label>
            <input
              id="edit-name"
              type="text"
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-white"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-200 mb-2">Yosh toifasi</div>
            <div className="grid grid-cols-2 gap-2.5">
              {(['3-5', '6-9', '10-15', '16-20'] as AgeGroup[]).map((ag) => {
                const t = AGE_GROUP_THEMES[ag];
                return (
                  <button
                    key={ag}
                    type="button"
                    onClick={() => setAgeGroup(ag)}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      ageGroup === ag
                        ? 'bg-amber-500/15 border-amber-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{t.label}</div>
                    <div className="text-xs text-slate-400 truncate">{t.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-200 mb-2">Avatar</div>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarId(av.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${av.bg} border-2 cursor-pointer ${
                    avatarId === av.id ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {av.symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-sm font-medium text-slate-200">O‘yin ovozlari</span>
            <button
              type="button"
              onClick={onToggleSound}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
            >
              {soundMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  O‘chirilgan
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Yoqilgan
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
            >
              Saqlash
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
            >
              Bekor qilish
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Profil va barcha natijalarni tozalash
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-rose-200">Haqiqatan ham profilni o‘chirmoqchimisiz?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetProfile();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
                >
                  Ha, tozalash
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Yo‘q
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
