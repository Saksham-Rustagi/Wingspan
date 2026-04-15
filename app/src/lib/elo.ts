import type { GameEntry, Player, EloSnapshot } from '../types';

const K = 32;
const STARTING_ELO = 1000;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Multiplayer Elo: decompose into pairwise comparisons.
 * Returns a map of playerId -> new elo rating.
 */
export function calculateEloChanges(
  game: GameEntry,
  currentRatings: Record<string, number>
): Record<string, number> {
  const participants = game.players;
  const deltas: Record<string, number> = {};

  for (const p of participants) {
    deltas[p.playerId] = 0;
  }

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const a = participants[i];
      const b = participants[j];
      const rA = currentRatings[a.playerId] ?? STARTING_ELO;
      const rB = currentRatings[b.playerId] ?? STARTING_ELO;

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

      deltas[a.playerId] += K * (sA - eA);
      deltas[b.playerId] += K * (sB - eB);
    }
  }

  const newRatings: Record<string, number> = {};
  for (const p of participants) {
    const current = currentRatings[p.playerId] ?? STARTING_ELO;
    newRatings[p.playerId] = Math.round(current + deltas[p.playerId]);
  }

  return newRatings;
}

/**
 * Recompute full Elo history from scratch given all games in order.
 */
export function recomputeAllElo(
  players: Player[],
  games: GameEntry[]
): { updatedPlayers: Player[]; eloHistory: EloSnapshot[] } {
  const ratings: Record<string, number> = {};
  for (const p of players) {
    ratings[p.id] = STARTING_ELO;
  }

  const history: EloSnapshot[] = [
    { gameId: 'initial', ratings: { ...ratings } },
  ];

  for (const game of games) {
    const newRatings = calculateEloChanges(game, ratings);
    for (const [pid, elo] of Object.entries(newRatings)) {
      ratings[pid] = elo;
    }
    history.push({ gameId: game.id, ratings: { ...ratings } });
  }

  const updatedPlayers = players.map((p) => ({
    ...p,
    currentElo: ratings[p.id] ?? STARTING_ELO,
  }));

  return { updatedPlayers, eloHistory: history };
}

export { STARTING_ELO };
