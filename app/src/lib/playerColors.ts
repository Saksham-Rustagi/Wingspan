import type { Player } from '../types';

// Default colors for the original seed players (kept for backwards compatibility
// so existing data still looks the same).
export const DEFAULT_PLAYER_COLORS: Record<string, string> = {
  AS: '#f43f5e',
  NT: '#0ea5e9',
  HS: '#10b981',
  SR: '#8b5cf6',
  GM: '#f59e0b',
};

// Fallback palette used for newly added players that don't have an
// assigned color yet.
export const FALLBACK_COLORS = [
  '#ec4899',
  '#06b6d4',
  '#22c55e',
  '#a855f7',
  '#eab308',
  '#f97316',
  '#14b8a6',
  '#ef4444',
];

// The palette shown in the color picker. Curated to look good against the
// dark zinc background.
export const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Fuchsia', hex: '#d946ef' },
  { name: 'Slate', hex: '#64748b' },
];

export function getPlayerColor(player: Player, index: number): string {
  if (player.color) return player.color;
  if (DEFAULT_PLAYER_COLORS[player.id]) return DEFAULT_PLAYER_COLORS[player.id];
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function getPlayerColorById(
  players: Player[],
  id: string,
): string {
  const idx = players.findIndex((p) => p.id === id);
  if (idx === -1) return '#71717a';
  return getPlayerColor(players[idx], idx);
}
