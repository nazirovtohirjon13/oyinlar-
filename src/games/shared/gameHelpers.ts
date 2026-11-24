import { GameCompletionPayload } from '../../types/game';

export const ENCOURAGE_CORRECT = [
  'Ajoyib!',
  'Barakalla!',
  "Zo'r natija!",
  "To'g'ri topdingiz!",
];

export const ENCOURAGE_TRY_AGAIN = [
  "Yana bir bor urinib ko'ring!",
  "Xavotir olmang, qayta urinib ko'ring!",
  "Diqqat bilan qarang, siz uddalaysiz!",
];

export function pickCorrectMessage(idx: number): string {
  return ENCOURAGE_CORRECT[idx % ENCOURAGE_CORRECT.length];
}

export function pickTryAgainMessage(idx: number): string {
  return ENCOURAGE_TRY_AGAIN[idx % ENCOURAGE_TRY_AGAIN.length];
}

export function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface ActiveGameProps {
  onScore: (points: number, correct?: boolean, feedback?: string) => void;
  onAttempt: (correct: boolean, feedback?: string) => void;
  onLevelChange: (level: number, maxLevel: number) => void;
  onComplete: (payload: GameCompletionPayload) => void;
  isPaused: boolean;
  restartNonce: number;
}
