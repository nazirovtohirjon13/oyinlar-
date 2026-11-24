export type AgeGroup = '3-5' | '6-9' | '10-15' | '16-20';

export type GameCategory =
  | 'mantiq'
  | 'matematika'
  | 'xotira'
  | 'til'
  | 'fazoviy'
  | 'fan'
  | 'strategiya';

export type DifficultyLevel = 'Oson' | "O'rta" | 'Qiyin';

export interface GameDefinition {
  id: string;
  ageGroup: AgeGroup;
  title: string;
  shortDesc: string;
  objective: string;
  instructions: string;
  category: GameCategory;
  difficulty: DifficultyLevel;
  accentHex: string;
  iconKey: string;
  featured?: boolean;
  popular?: boolean;
  recommended?: boolean;
  timed?: boolean;
}

export interface AgeGroupTheme {
  id: AgeGroup;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  imagePath: string;
  accentHex: string;
  secondaryHex: string;
  bgTintClass: string;
  borderTintClass: string;
  buttonClass: string;
  sceneTheme: 'playground' | 'island' | 'lab' | 'arena';
}

export interface PlayerProfile {
  name: string;
  ageGroup: AgeGroup;
  avatarId: string;
  createdAt: string;
}

export interface GameRecord {
  bestScore: number;
  plays: number;
  completed: boolean;
  bestAccuracy: number;
  lastPlayedAt: string;
}

export interface DailyProgress {
  dateKey: string;
  gamesPlayedToday: number;
  highAccuracyWinsToday: number;
  pointsEarnedToday: number;
  claimedIds: string[];
}

export interface PlayerProgress {
  totalPoints: number;
  records: Record<string, GameRecord>;
  recentlyPlayed: string[];
  favorites: string[];
  unlockedAchievements: string[];
  totalAnswers: number;
  correctAnswers: number;
  daily: DailyProgress;
  soundMuted: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  check: (progress: PlayerProgress) => boolean;
}

export interface DailyChallengeDef {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardPoints: number;
  metric: 'gamesPlayedToday' | 'highAccuracyWinsToday' | 'pointsEarnedToday';
}

export interface GameCompletionPayload {
  score: number;
  correctCount: number;
  totalQuestions: number;
  levelReached: number;
}
