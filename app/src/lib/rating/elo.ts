import type { GameEntry, Player, RatingSnapshot } from '../../types';

export const ELO_K = 32;
export const ELO_START = 1000;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Multiplayer Elo via pairwise decomposition.
 * Each game splits into all 2-player sub-matches; deltas are summed
 * and applied at the end of the game. This is the common FFA Elo
 * adaptation and works well for 2–5 player Wingspan games.
 */
export function calculateEloChanges(
  game: GameEntry,
  currentRatings: Record<string, number>,
): Record<string, number> {
  const participants = game.players;
  const deltas: Record<string, number> = {};

  for (const p of participants) deltas[p.playerId] = 0;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const a = participants[i];
      const b = participants[j];
      const rA = currentRatings[a.playerId] ?? ELO_START;
      const rB = currentRatings[b.playerId] ?? ELO_START;

      const eA = expectedScore(rA, rB);
      const eB = expectedScore(rB, rA);

      let sA: number, sB: number;
      if (a.placement < b.placement) {
        sA = 1;
        sB = 0;
      } else if (a.placement > b.placement) {
        sA = 0;
        sB = 1;
      } else {
        sA = 0.5;
        sB = 0.5;
      }

      deltas[a.playerId] += ELO_K * (sA - eA);
      deltas[b.playerId] += ELO_K * (sB - eB);
    }
  }

  const newRatings: Record<string, number> = {};
  for (const p of participants) {
    const current = currentRatings[p.playerId] ?? ELO_START;
    newRatings[p.playerId] = Math.round(current + deltas[p.playerId]);
  }

  return newRatings;
}

export function recomputeAllElo(
  players: Player[],
  games: GameEntry[],
): { updatedPlayers: Player[]; history: RatingSnapshot[] } {
  const ratings: Record<string, number> = {};
  for (const p of players) ratings[p.id] = ELO_START;

  const history: RatingSnapshot[] = [
    { gameId: 'initial', ratings: { ...ratings } },
  ];

  for (const game of games) {
    const newRatings = calculateEloChanges(game, ratings);
    for (const [pid, r] of Object.entries(newRatings)) {
      ratings[pid] = r;
    }
    history.push({ gameId: game.id, ratings: { ...ratings } });
  }

  const updatedPlayers = players.map((p) => ({
    ...p,
    currentElo: ratings[p.id] ?? ELO_START,
  }));

  return { updatedPlayers, history };
}
