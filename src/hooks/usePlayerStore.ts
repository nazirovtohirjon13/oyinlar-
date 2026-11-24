import { useCallback, useEffect, useState } from 'react';
import { ACHIEVEMENTS, DAILY_CHALLENGES } from '../data/games';
import {
  AgeGroup,
  GameCompletionPayload,
  PlayerProfile,
  PlayerProgress,
} from '../types/game';
import { soundEngine } from '../utils/sound';

const PROFILE_KEY = 'zehnolam_profile_v1';
const PROGRESS_KEY = 'zehnolam_progress_v1';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function createInitialProgress(): PlayerProgress {
  return {
    totalPoints: 0,
    records: {},
    recentlyPlayed: [],
    favorites: [],
    unlockedAchievements: [],
    totalAnswers: 0,
    correctAnswers: 0,
    daily: {
      dateKey: getTodayKey(),
      gamesPlayedToday: 0,
      highAccuracyWinsToday: 0,
      pointsEarnedToday: 0,
      claimedIds: [],
    },
    soundMuted: false,
  };
}

function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerProfile;
    if (!parsed.name || !parsed.ageGroup) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as PlayerProgress;
    const today = getTodayKey();
    if (!parsed.daily || parsed.daily.dateKey !== today) {
      parsed.daily = {
        dateKey: today,
        gamesPlayedToday: 0,
        highAccuracyWinsToday: 0,
        pointsEarnedToday: 0,
        claimedIds: [],
      };
    }
    return {
      ...createInitialProgress(),
      ...parsed,
    };
  } catch {
    return createInitialProgress();
  }
}

export function usePlayerStore() {
  const [profile, setProfileState] = useState<PlayerProfile | null>(() => loadProfile());
  const [progress, setProgressState] = useState<PlayerProgress>(() => loadProgress());
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    soundEngine.setMuted(progress.soundMuted);
  }, [progress.soundMuted]);

  const saveProfile = useCallback((next: PlayerProfile | null) => {
    setProfileState(next);
    if (next) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(PROFILE_KEY);
    }
  }, []);

  const saveProgress = useCallback((next: PlayerProgress) => {
    setProgressState(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  }, []);

  const registerPlayer = useCallback(
    (name: string, ageGroup: AgeGroup, avatarId = 'leo') => {
      const clean = name.trim();
      if (!clean) return;
      const nextProfile: PlayerProfile = {
        name: clean,
        ageGroup,
        avatarId,
        createdAt: new Date().toISOString(),
      };
      saveProfile(nextProfile);
    },
    [saveProfile]
  );

  const updateProfile = useCallback(
    (updates: Partial<Pick<PlayerProfile, 'name' | 'ageGroup' | 'avatarId'>>) => {
      if (!profile) return;
      saveProfile({
        ...profile,
        ...updates,
        name: updates.name ? updates.name.trim() || profile.name : profile.name,
      });
    },
    [profile, saveProfile]
  );

  const resetProfile = useCallback(() => {
    saveProfile(null);
    const fresh = createInitialProgress();
    saveProgress(fresh);
  }, [saveProfile, saveProgress]);

  const toggleSound = useCallback(() => {
    setProgressState((prev) => {
      const next = { ...prev, soundMuted: !prev.soundMuted };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((gameId: string) => {
    setProgressState((prev) => {
      const exists = prev.favorites.includes(gameId);
      const favorites = exists
        ? prev.favorites.filter((id) => id !== gameId)
        : [gameId, ...prev.favorites];
      const next = { ...prev, favorites };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markPlayed = useCallback((gameId: string) => {
    setProgressState((prev) => {
      const recentlyPlayed = [
        gameId,
        ...prev.recentlyPlayed.filter((id) => id !== gameId),
      ].slice(0, 8);
      const next = { ...prev, recentlyPlayed };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const recordGameResult = useCallback(
    (gameId: string, payload: GameCompletionPayload): { earnedPoints: number; newAchievements: string[] } => {
      const accuracy =
        payload.totalQuestions > 0
          ? Math.round((payload.correctCount / payload.totalQuestions) * 100)
          : 100;
      const accuracyBonus = accuracy >= 80 ? 40 : accuracy >= 60 ? 20 : 0;
      const earnedPoints = Math.max(20, payload.score + accuracyBonus);

      let resultNewAch: string[] = [];

      setProgressState((prev) => {
        const today = getTodayKey();
        const daily =
          prev.daily.dateKey === today
            ? { ...prev.daily }
            : {
                dateKey: today,
                gamesPlayedToday: 0,
                highAccuracyWinsToday: 0,
                pointsEarnedToday: 0,
                claimedIds: [],
              };

        daily.gamesPlayedToday += 1;
        if (accuracy >= 80) {
          daily.highAccuracyWinsToday += 1;
        }
        daily.pointsEarnedToday += earnedPoints;

        // Check daily challenge auto-claim rewards
        let bonusFromDaily = 0;
        for (const ch of DAILY_CHALLENGES) {
          if (!daily.claimedIds.includes(ch.id) && daily[ch.metric] >= ch.target) {
            daily.claimedIds.push(ch.id);
            bonusFromDaily += ch.rewardPoints;
          }
        }

        const existingRec = prev.records[gameId];
        const nextRec = {
          bestScore: Math.max(existingRec?.bestScore ?? 0, payload.score),
          plays: (existingRec?.plays ?? 0) + 1,
          completed: true,
          bestAccuracy: Math.max(existingRec?.bestAccuracy ?? 0, accuracy),
          lastPlayedAt: new Date().toISOString(),
        };

        const recentlyPlayed = [
          gameId,
          ...prev.recentlyPlayed.filter((id) => id !== gameId),
        ].slice(0, 8);

        let draft: PlayerProgress = {
          ...prev,
          totalPoints: prev.totalPoints + earnedPoints + bonusFromDaily,
          records: {
            ...prev.records,
            [gameId]: nextRec,
          },
          recentlyPlayed,
          totalAnswers: prev.totalAnswers + payload.totalQuestions,
          correctAnswers: prev.correctAnswers + payload.correctCount,
          daily,
        };

        const unlockedNow: string[] = [];
        let achPoints = 0;
        for (const ach of ACHIEVEMENTS) {
          if (!draft.unlockedAchievements.includes(ach.id) && ach.check(draft)) {
            unlockedNow.push(ach.id);
            achPoints += ach.pointsReward;
          }
        }

        if (unlockedNow.length > 0) {
          draft = {
            ...draft,
            totalPoints: draft.totalPoints + achPoints,
            unlockedAchievements: [...draft.unlockedAchievements, ...unlockedNow],
          };
          resultNewAch = unlockedNow;
          setNewlyUnlocked(unlockedNow);
        }

        localStorage.setItem(PROGRESS_KEY, JSON.stringify(draft));
        return draft;
      });

      return { earnedPoints, newAchievements: resultNewAch };
    },
    []
  );

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  return {
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
  };
}
