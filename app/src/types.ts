export interface PlayerScores {
  birds: number;
  bonusCards: number;
  endOfRoundGoals: number;
  eggs: number;
  foodOnCards: number;
  tuckedCards: number;
  total: number;
}

export interface GamePlayer {
  playerId: string;
  placement: number;
  scores: PlayerScores;
}

export interface GameEntry {
  id: string;
  date: string;
  players: GamePlayer[];
}

export interface Player {
  id: string;
  name: string;
  /**
   * Cached display rating (legacy name kept for Firestore compatibility).
   * Always recomputed client-side based on the active rating system.
   */
  currentElo: number;
  color?: string;
}

export type RatingSystem = 'elo' | 'glicko2' | 'trueskill';

export interface RatingSnapshot {
  gameId: string;
  ratings: Record<string, number>;
}

// Backwards compatibility alias — older components referenced EloSnapshot.
export type EloSnapshot = RatingSnapshot;

export interface AppState {
  players: Player[];
  games: GameEntry[];
}
