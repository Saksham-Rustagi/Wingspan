import type { GameEntry, Player } from '../types';

export const MIN_GAMES_ACTIVE = 3;

export function getGameCounts(games: GameEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const game of games) {
    for (const gp of game.players) {
      counts[gp.playerId] = (counts[gp.playerId] ?? 0) + 1;
    }
  }
  return counts;
}

export function getActivePlayerIds(
  games: GameEntry[],
  min: number = MIN_GAMES_ACTIVE,
): Set<string> {
  const counts = getGameCounts(games);
  const ids = new Set<string>();
  for (const [id, n] of Object.entries(counts)) {
    if (n >= min) ids.add(id);
  }
  return ids;
}

export function filterActivePlayers(
  players: Player[],
  games: GameEntry[],
  min: number = MIN_GAMES_ACTIVE,
): Player[] {
  const active = getActivePlayerIds(games, min);
  return players.filter((p) => active.has(p.id));
}
