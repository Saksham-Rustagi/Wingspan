import type { Player, GameEntry, RatingSnapshot, RatingSystem } from '../../types';
import { recomputeAllElo, ELO_START } from './elo';
import { recomputeAllGlicko2, GLICKO_START_RATING } from './glicko2';
import { recomputeAllTrueSkill, TRUESKILL_START_DISPLAY } from './trueskill';

export type { RatingSystem };

export interface RatingSystemMeta {
  id: RatingSystem;
  label: string;
  short: string;
  tagline: string;
  description: string;
  startingRating: number;
}

export const RATING_SYSTEMS: Record<RatingSystem, RatingSystemMeta> = {
  elo: {
    id: 'elo',
    label: 'Elo',
    short: 'Elo',
    tagline: 'K=32 · pairwise FFA',
    description:
      'Classic chess-style rating. Each game splits into every pair of players, with deltas summed. Simple, reactive, and well-suited for small groups.',
    startingRating: ELO_START,
  },
  glicko2: {
    id: 'glicko2',
    label: 'Glicko-2',
    short: 'Glicko-2',
    tagline: 'Rating + uncertainty',
    description:
      'Glickman’s improvement over Elo that tracks a rating deviation (confidence) and volatility. Each Wingspan game is one rating period with pairwise results — steadier ratings for active players, wider swings for newcomers.',
    startingRating: GLICKO_START_RATING,
  },
  trueskill: {
    id: 'trueskill',
    label: 'TrueSkill',
    short: 'TrueSkill',
    tagline: 'Bayesian FFA skill (μ±σ)',
    description:
      'Microsoft’s ranking system for multiplayer free-for-all. Maintains a skill belief (μ) with uncertainty (σ) per player, updated from every pairwise matchup within the game. Converges quickly from few games.',
    startingRating: TRUESKILL_START_DISPLAY,
  },
};

export const RATING_SYSTEM_LIST: RatingSystemMeta[] = [
  RATING_SYSTEMS.elo,
  RATING_SYSTEMS.glicko2,
  RATING_SYSTEMS.trueskill,
];

export function recomputeRatings(
  system: RatingSystem,
  players: Player[],
  games: GameEntry[],
): { updatedPlayers: Player[]; history: RatingSnapshot[] } {
  switch (system) {
    case 'elo':
      return recomputeAllElo(players, games);
    case 'glicko2':
      return recomputeAllGlicko2(players, games);
    case 'trueskill':
      return recomputeAllTrueSkill(players, games);
  }
}
