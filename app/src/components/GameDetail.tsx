import type { GameEntry, EloSnapshot, Player } from '../types';

function getEloChange(
  playerId: string,
  gameIndex: number,
  eloHistory: EloSnapshot[]
): number | null {
  const snapIdx = gameIndex + 1;
  if (snapIdx >= eloHistory.length || snapIdx < 1) return null;
  const after = eloHistory[snapIdx].ratings[playerId];
  const before = eloHistory[snapIdx - 1].ratings[playerId];
  if (after == null || before == null) return null;
  return after - before;
}

function hasScoreData(game: GameEntry): boolean {
  return game.players.some((gp) => gp.scores.total > 0);
}

function hasCategoryData(game: GameEntry): boolean {
  return game.players.some(
    (gp) =>
      gp.scores.birds > 0 ||
      gp.scores.bonusCards > 0 ||
      gp.scores.endOfRoundGoals > 0 ||
      gp.scores.eggs > 0 ||
      gp.scores.foodOnCards > 0 ||
      gp.scores.tuckedCards > 0,
  );
}

interface Props {
  game: GameEntry;
  gameIndex: number;
  players: Player[];
  eloHistory: EloSnapshot[];
}

export default function GameDetail({ game, gameIndex, players, eloHistory }: Props) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const sorted = [...game.players].sort((a, b) => a.placement - b.placement);
  const showScores = hasScoreData(game);
  const showCategories = hasCategoryData(game);

  if (!showScores) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-500 italic">Game data missing</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs">
              <th className="text-left py-1 pr-4">#</th>
              <th className="text-left py-1 pr-4">Player</th>
              <th className="text-right py-1 pl-4">Elo Δ</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((gp) => {
              const eloChange = getEloChange(gp.playerId, gameIndex, eloHistory);
              return (
                <tr key={gp.playerId} className="text-zinc-300 border-t border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-500">{gp.placement}</td>
                  <td className="py-2 pr-4 font-medium text-zinc-100">
                    {playerMap[gp.playerId]?.name ?? gp.playerId}
                  </td>
                  <td
                    className={`py-2 pl-4 text-right font-mono text-xs font-medium ${
                      eloChange && eloChange > 0
                        ? 'text-emerald-400'
                        : eloChange && eloChange < 0
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                    }`}
                  >
                    {eloChange != null
                      ? `${eloChange > 0 ? '+' : ''}${eloChange}`
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (!showCategories) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-500 italic">Category breakdown unavailable</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs">
              <th className="text-left py-1 pr-4">#</th>
              <th className="text-left py-1 pr-4">Player</th>
              <th className="text-right py-1 px-2 font-semibold">Total</th>
              <th className="text-right py-1 pl-4">Elo Δ</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((gp) => {
              const eloChange = getEloChange(gp.playerId, gameIndex, eloHistory);
              return (
                <tr key={gp.playerId} className="text-zinc-300 border-t border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-500">{gp.placement}</td>
                  <td className="py-2 pr-4 font-medium text-zinc-100">
                    {playerMap[gp.playerId]?.name ?? gp.playerId}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-semibold text-zinc-100">
                    {gp.scores.total}
                  </td>
                  <td
                    className={`py-2 pl-4 text-right font-mono text-xs font-medium ${
                      eloChange && eloChange > 0
                        ? 'text-emerald-400'
                        : eloChange && eloChange < 0
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                    }`}
                  >
                    {eloChange != null
                      ? `${eloChange > 0 ? '+' : ''}${eloChange}`
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-zinc-500 text-xs">
            <th className="text-left py-1 pr-4">#</th>
            <th className="text-left py-1 pr-4">Player</th>
            <th className="text-right py-1 px-2">Birds</th>
            <th className="text-right py-1 px-2">Bonus</th>
            <th className="text-right py-1 px-2">Goals</th>
            <th className="text-right py-1 px-2">Eggs</th>
            <th className="text-right py-1 px-2">Food</th>
            <th className="text-right py-1 px-2">Tucked</th>
            <th className="text-right py-1 px-2 font-semibold">Total</th>
            <th className="text-right py-1 pl-4">Elo Δ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((gp) => {
            const eloChange = getEloChange(gp.playerId, gameIndex, eloHistory);
            return (
              <tr
                key={gp.playerId}
                className="text-zinc-300 border-t border-zinc-800/50"
              >
                <td className="py-2 pr-4 text-zinc-500">{gp.placement}</td>
                <td className="py-2 pr-4 font-medium text-zinc-100">
                  {playerMap[gp.playerId]?.name ?? gp.playerId}
                </td>
                <td className="py-2 px-2 text-right font-mono">{gp.scores.birds}</td>
                <td className="py-2 px-2 text-right font-mono">{gp.scores.bonusCards}</td>
                <td className="py-2 px-2 text-right font-mono">{gp.scores.endOfRoundGoals}</td>
                <td className="py-2 px-2 text-right font-mono">{gp.scores.eggs}</td>
                <td className="py-2 px-2 text-right font-mono">{gp.scores.foodOnCards}</td>
                <td className="py-2 px-2 text-right font-mono">{gp.scores.tuckedCards}</td>
                <td className="py-2 px-2 text-right font-mono font-semibold text-zinc-100">
                  {gp.scores.total}
                </td>
                <td
                  className={`py-2 pl-4 text-right font-mono text-xs font-medium ${
                    eloChange && eloChange > 0
                      ? 'text-emerald-400'
                      : eloChange && eloChange < 0
                        ? 'text-rose-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {eloChange != null
                    ? `${eloChange > 0 ? '+' : ''}${eloChange}`
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
