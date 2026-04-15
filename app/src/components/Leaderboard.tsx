import type { Player, EloSnapshot } from '../types';

const RANK_COLORS = [
  'from-amber-400 to-yellow-500',
  'from-zinc-300 to-zinc-400',
  'from-orange-500 to-amber-600',
];

const PLAYER_COLORS: Record<string, string> = {
  AS: 'bg-rose-500',
  NT: 'bg-sky-500',
  HS: 'bg-emerald-500',
  SR: 'bg-violet-500',
  GM: 'bg-amber-500',
};

function getEloDelta(
  playerId: string,
  eloHistory: EloSnapshot[]
): number | null {
  if (eloHistory.length < 2) return null;
  const current = eloHistory[eloHistory.length - 1].ratings[playerId];
  const previous = eloHistory[eloHistory.length - 2].ratings[playerId];
  if (current == null || previous == null) return null;
  return current - previous;
}

interface Props {
  players: Player[];
  eloHistory: EloSnapshot[];
}

export default function Leaderboard({ players, eloHistory }: Props) {
  const sorted = [...players].sort((a, b) => b.currentElo - a.currentElo);

  return (
    <div className="space-y-3">
      {sorted.map((player, idx) => {
        const delta = getEloDelta(player.id, eloHistory);
        const rankColor = RANK_COLORS[idx] ?? '';
        const avatarColor = PLAYER_COLORS[player.id] ?? 'bg-zinc-600';

        return (
          <div
            key={player.id}
            className="flex items-center gap-4 rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-4 transition-all hover:border-zinc-700"
          >
            <div className="flex-shrink-0 w-8 text-center">
              {idx < 3 ? (
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${rankColor} text-zinc-900 text-sm font-bold`}
                >
                  {idx + 1}
                </span>
              ) : (
                <span className="text-zinc-500 text-sm font-medium">
                  {idx + 1}
                </span>
              )}
            </div>

            <div
              className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
            >
              {player.name.slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-zinc-100 font-semibold text-lg leading-tight">
                {player.name}
              </p>
              <p className="text-zinc-500 text-xs">
                Rank #{idx + 1}
              </p>
            </div>

            <div className="text-right">
              <p className="font-mono text-xl font-semibold text-zinc-100">
                {player.currentElo}
              </p>
              {delta !== null && (
                <p
                  className={`text-xs font-medium ${
                    delta > 0
                      ? 'text-emerald-400'
                      : delta < 0
                        ? 'text-rose-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'}{' '}
                  {delta !== 0 ? Math.abs(delta) : '0'}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
