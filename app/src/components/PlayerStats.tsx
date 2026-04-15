import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import type { Player, GameEntry, PlayerScores } from '../types';

const PLAYER_COLORS: Record<string, string> = {
  AS: '#f43f5e',
  NT: '#0ea5e9',
  HS: '#10b981',
  SR: '#8b5cf6',
  GM: '#f59e0b',
};

const FALLBACK_COLORS = [
  '#ec4899',
  '#06b6d4',
  '#22c55e',
  '#a855f7',
  '#eab308',
  '#f97316',
];

type ScoreCategory = keyof Omit<PlayerScores, 'total'>;

const CATEGORIES: { key: ScoreCategory; label: string; short: string }[] = [
  { key: 'birds', label: 'Birds', short: 'Birds' },
  { key: 'bonusCards', label: 'Bonus Cards', short: 'Bonus' },
  { key: 'endOfRoundGoals', label: 'End-of-Round Goals', short: 'Goals' },
  { key: 'eggs', label: 'Eggs', short: 'Eggs' },
  { key: 'foodOnCards', label: 'Food on Cards', short: 'Food' },
  { key: 'tuckedCards', label: 'Tucked Cards', short: 'Tucked' },
];

const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  fontSize: '13px',
};

function color(id: string, idx: number) {
  return PLAYER_COLORS[id] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function name(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? id;
}

interface Props {
  players: Player[];
  games: GameEntry[];
}

export default function PlayerStats({ players, games }: Props) {
  const [dnaPlayer, setDnaPlayer] = useState<string | null>(null);

  const scoredGames = useMemo(
    () => games.filter((g) => g.players.some((p) => p.scores.total > 0)),
    [games],
  );

  const categoryGames = useMemo(
    () =>
      scoredGames.filter((g) =>
        g.players.some(
          (p) =>
            p.scores.birds > 0 ||
            p.scores.bonusCards > 0 ||
            p.scores.endOfRoundGoals > 0 ||
            p.scores.eggs > 0 ||
            p.scores.foodOnCards > 0 ||
            p.scores.tuckedCards > 0,
        ),
      ),
    [scoredGames],
  );

  // ── Player overview ──
  const playerStats = useMemo(() => {
    return players
      .map((player) => {
        const played = games.filter((g) =>
          g.players.some((gp) => gp.playerId === player.id),
        );
        const playedScored = scoredGames.filter((g) =>
          g.players.some(
            (gp) => gp.playerId === player.id && gp.scores.total > 0,
          ),
        );

        const wins = played.filter((g) =>
          g.players.some(
            (gp) => gp.playerId === player.id && gp.placement === 1,
          ),
        ).length;

        const placements = played.map(
          (g) => g.players.find((gp) => gp.playerId === player.id)!.placement,
        );
        const avgPlacement =
          placements.length > 0
            ? placements.reduce((a, b) => a + b, 0) / placements.length
            : 0;

        const totals = playedScored.map(
          (g) => g.players.find((gp) => gp.playerId === player.id)!.scores.total,
        );
        const bestScore = totals.length > 0 ? Math.max(...totals) : 0;
        const avgScore =
          totals.length > 0
            ? totals.reduce((a, b) => a + b, 0) / totals.length
            : 0;

        let topTwoStreak = 0;
        for (let i = played.length - 1; i >= 0; i--) {
          const gp = played[i].players.find((p) => p.playerId === player.id);
          if (gp && gp.placement <= 2) topTwoStreak++;
          else break;
        }

        return {
          player,
          gamesPlayed: played.length,
          wins,
          winRate: played.length > 0 ? wins / played.length : 0,
          avgPlacement,
          bestScore,
          avgScore,
          topTwoStreak,
        };
      })
      .sort((a, b) => b.player.currentElo - a.player.currentElo);
  }, [players, games, scoredGames]);

  // ── Score trends ──
  const scoreTrendData = useMemo(() => {
    return games
      .map((game, idx) => {
        if (!game.players.some((p) => p.scores.total > 0)) return null;
        const point: Record<string, string | number> = {
          name: `Game ${idx + 1}`,
        };
        for (const gp of game.players) {
          if (gp.scores.total > 0) point[gp.playerId] = gp.scores.total;
        }
        return point;
      })
      .filter((d): d is Record<string, string | number> => d !== null);
  }, [games]);

  // ── Category breakdown ──
  const categoryBreakdown = useMemo(() => {
    return CATEGORIES.map(({ key, label, short }) => {
      let topScore = 0;
      let topPlayer = '';
      const playerAvgs: {
        id: string;
        name: string;
        avg: number;
        max: number;
      }[] = [];
      let globalSum = 0;
      let globalCount = 0;

      for (const player of players) {
        let sum = 0;
        let count = 0;
        let pMax = 0;

        for (const game of categoryGames) {
          const gp = game.players.find((p) => p.playerId === player.id);
          if (gp && gp.scores.total > 0) {
            const val = gp.scores[key];
            sum += val;
            count++;
            if (val > pMax) pMax = val;
          }
        }

        const avg = count > 0 ? sum / count : 0;
        playerAvgs.push({ id: player.id, name: player.name, avg, max: pMax });
        globalSum += sum;
        globalCount += count;

        if (pMax > topScore) {
          topScore = pMax;
          topPlayer = player.id;
        }
      }

      const overallAvg = globalCount > 0 ? globalSum / globalCount : 0;
      const leader = [...playerAvgs].sort((a, b) => b.avg - a.avg)[0];

      return {
        key,
        label,
        short,
        topScore,
        topPlayer,
        overallAvg,
        playerAvgs,
        leader,
      };
    });
  }, [players, categoryGames]);

  // ── Placement distribution ──
  const placementData = useMemo(() => {
    const maxP = Math.max(
      ...games.flatMap((g) => g.players.map((p) => p.placement)),
      1,
    );
    const data = [];
    for (let p = 1; p <= maxP; p++) {
      const point: Record<string, string | number> = {
        placement:
          p === 1 ? '1st' : p === 2 ? '2nd' : p === 3 ? '3rd' : `${p}th`,
      };
      for (const player of players) {
        point[player.id] = games.reduce((c, game) => {
          const gp = game.players.find((gp) => gp.playerId === player.id);
          return c + (gp && gp.placement === p ? 1 : 0);
        }, 0);
      }
      data.push(point);
    }
    return data;
  }, [players, games]);

  // ── Radar / scoring DNA (normalized per-category: 0–100 relative to group best) ──
  const radarData = useMemo(() => {
    const catAvgs: Record<string, Record<string, number>> = {};
    for (const { key } of CATEGORIES) {
      catAvgs[key] = {};
      for (const player of players) {
        let sum = 0;
        let count = 0;
        for (const game of scoredGames) {
          const gp = game.players.find((p) => p.playerId === player.id);
          if (gp && gp.scores.total > 0) {
            sum += gp.scores[key];
            count++;
          }
        }
        catAvgs[key][player.id] = count > 0 ? sum / count : 0;
      }
    }

    return CATEGORIES.map(({ key, short }) => {
      const point: Record<string, string | number> = { category: short };
      const maxInCat = Math.max(
        ...players.map((p) => catAvgs[key][p.id]),
        1,
      );
      for (const player of players) {
        point[player.id] =
          Math.round((catAvgs[key][player.id] / maxInCat) * 1000) / 10;
      }
      return point;
    });
  }, [players, scoredGames]);

  const dnaPlayers = useMemo(
    () => (dnaPlayer ? players.filter((p) => p.id === dnaPlayer) : players),
    [players, dnaPlayer],
  );

  // ── Records & superlatives ──
  const records = useMemo(() => {
    const results: {
      label: string;
      value: string;
      detail: string;
      icon: string;
    }[] = [];

    // Highest single game score
    let maxTotal = 0;
    let maxTotalPlayer = '';
    let maxTotalGame = 0;
    games.forEach((game, idx) => {
      for (const gp of game.players) {
        if (gp.scores.total > maxTotal) {
          maxTotal = gp.scores.total;
          maxTotalPlayer = gp.playerId;
          maxTotalGame = idx + 1;
        }
      }
    });
    if (maxTotal > 0)
      results.push({
        label: 'Highest Score',
        value: String(maxTotal),
        detail: `${name(players, maxTotalPlayer)} in Game ${maxTotalGame}`,
        icon: '🏆',
      });

    // Lowest winning score
    let minWin = Infinity;
    let minWinPlayer = '';
    let minWinGame = 0;
    scoredGames.forEach((game) => {
      const winner = game.players.find((p) => p.placement === 1);
      if (winner && winner.scores.total > 0 && winner.scores.total < minWin) {
        minWin = winner.scores.total;
        minWinPlayer = winner.playerId;
        minWinGame = games.indexOf(game) + 1;
      }
    });
    if (minWin < Infinity)
      results.push({
        label: 'Lowest Winning Score',
        value: String(minWin),
        detail: `${name(players, minWinPlayer)} in Game ${minWinGame}`,
        icon: '🎲',
      });

    // Most dominant win
    let maxGap = 0;
    let maxGapPlayer = '';
    let maxGapGame = 0;
    scoredGames.forEach((game) => {
      const sorted = [...game.players]
        .filter((p) => p.scores.total > 0)
        .sort((a, b) => b.scores.total - a.scores.total);
      if (sorted.length >= 2) {
        const gap = sorted[0].scores.total - sorted[1].scores.total;
        if (gap > maxGap) {
          maxGap = gap;
          maxGapPlayer = sorted[0].playerId;
          maxGapGame = games.indexOf(game) + 1;
        }
      }
    });
    if (maxGap > 0)
      results.push({
        label: 'Most Dominant Win',
        value: `+${maxGap} pts`,
        detail: `${name(players, maxGapPlayer)} in Game ${maxGapGame}`,
        icon: '💪',
      });

    // Closest game
    let minSpread = Infinity;
    let closestGame = 0;
    scoredGames.forEach((game) => {
      const totals = game.players
        .filter((p) => p.scores.total > 0)
        .map((p) => p.scores.total);
      if (totals.length >= 2) {
        const spread = Math.max(...totals) - Math.min(...totals);
        if (spread < minSpread) {
          minSpread = spread;
          closestGame = games.indexOf(game) + 1;
        }
      }
    });
    if (minSpread < Infinity)
      results.push({
        label: 'Closest Game',
        value: `${minSpread} pt spread`,
        detail: `Game ${closestGame}`,
        icon: '⚔️',
      });

    // Most consistent player
    let bestCV = Infinity;
    let consistentPlayer = '';
    for (const player of players) {
      const totals = scoredGames
        .flatMap((g) =>
          g.players.filter(
            (p) => p.playerId === player.id && p.scores.total > 0,
          ),
        )
        .map((p) => p.scores.total);
      if (totals.length >= 2) {
        const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
        const variance =
          totals.reduce((a, b) => a + (b - mean) ** 2, 0) / totals.length;
        const cv = Math.sqrt(variance) / mean;
        if (cv < bestCV) {
          bestCV = cv;
          consistentPlayer = player.id;
        }
      }
    }
    if (bestCV < Infinity)
      results.push({
        label: 'Most Consistent',
        value: name(players, consistentPlayer),
        detail: `${(bestCV * 100).toFixed(1)}% score variance`,
        icon: '🎯',
      });

    // Highest average score
    let bestAvg = 0;
    let bestAvgPlayer = '';
    for (const player of players) {
      const totals = scoredGames
        .flatMap((g) =>
          g.players.filter(
            (p) => p.playerId === player.id && p.scores.total > 0,
          ),
        )
        .map((p) => p.scores.total);
      if (totals.length > 0) {
        const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestAvgPlayer = player.id;
        }
      }
    }
    if (bestAvg > 0)
      results.push({
        label: 'Highest Average',
        value: bestAvg.toFixed(1),
        detail: name(players, bestAvgPlayer),
        icon: '📊',
      });

    // Most improved (last game score vs first game score)
    let bestImprovement = -Infinity;
    let improvedPlayer = '';
    for (const player of players) {
      const totals = scoredGames
        .flatMap((g) =>
          g.players.filter(
            (p) => p.playerId === player.id && p.scores.total > 0,
          ),
        )
        .map((p) => p.scores.total);
      if (totals.length >= 2) {
        const improvement = totals[totals.length - 1] - totals[0];
        if (improvement > bestImprovement) {
          bestImprovement = improvement;
          improvedPlayer = player.id;
        }
      }
    }
    if (bestImprovement > -Infinity && bestImprovement > 0)
      results.push({
        label: 'Most Improved',
        value: `+${bestImprovement} pts`,
        detail: `${name(players, improvedPlayer)} (last game vs first)`,
        icon: '📈',
      });

    // Best single category score ever
    let bestCatScore = 0;
    let bestCatScorePlayer = '';
    let bestCatScoreName = '';
    let bestCatScoreGame = 0;
    for (const { key, label } of CATEGORIES) {
      games.forEach((game, idx) => {
        for (const gp of game.players) {
          if (gp.scores[key] > bestCatScore) {
            bestCatScore = gp.scores[key];
            bestCatScorePlayer = gp.playerId;
            bestCatScoreName = label;
            bestCatScoreGame = idx + 1;
          }
        }
      });
    }
    if (bestCatScore > 0)
      results.push({
        label: 'Best Category Score',
        value: String(bestCatScore),
        detail: `${name(players, bestCatScorePlayer)} — ${bestCatScoreName}, Game ${bestCatScoreGame}`,
        icon: '⭐',
      });

    // Best podium rate (top 3 finish %)
    let bestPodium = 0;
    let podiumPlayer = '';
    for (const player of players) {
      const played = games.filter((g) =>
        g.players.some((gp) => gp.playerId === player.id),
      );
      if (played.length >= 2) {
        const podiums = played.filter((g) =>
          g.players.some(
            (gp) => gp.playerId === player.id && gp.placement <= 3,
          ),
        ).length;
        const rate = podiums / played.length;
        if (rate > bestPodium) {
          bestPodium = rate;
          podiumPlayer = player.id;
        }
      }
    }
    if (bestPodium > 0)
      results.push({
        label: 'Best Podium Rate',
        value: `${(bestPodium * 100).toFixed(0)}%`,
        detail: `${name(players, podiumPlayer)} (top 3 finishes)`,
        icon: '🥇',
      });

    // Most last-place finishes
    let mostLast = 0;
    let lastPlayer = '';
    for (const player of players) {
      const lastCount = games.filter((g) => {
        const gp = g.players.find((p) => p.playerId === player.id);
        if (!gp) return false;
        const maxPlacement = Math.max(...g.players.map((p) => p.placement));
        return gp.placement === maxPlacement;
      }).length;
      if (lastCount > mostLast) {
        mostLast = lastCount;
        lastPlayer = player.id;
      }
    }
    if (mostLast > 0)
      results.push({
        label: 'Cellar Dweller',
        value: `${mostLast} time${mostLast > 1 ? 's' : ''}`,
        detail: `${name(players, lastPlayer)} (last place finishes)`,
        icon: '🪣',
      });

    // Category specialist (highest avg in any single category)
    let bestCatAvg = 0;
    let bestCatAvgPlayer = '';
    let bestCatAvgName = '';
    for (const { key, label } of CATEGORIES) {
      for (const player of players) {
        let sum = 0;
        let count = 0;
        for (const game of categoryGames) {
          const gp = game.players.find((p) => p.playerId === player.id);
          if (gp && gp.scores.total > 0) {
            sum += gp.scores[key];
            count++;
          }
        }
        if (count > 0) {
          const avg = sum / count;
          if (avg > bestCatAvg) {
            bestCatAvg = avg;
            bestCatAvgPlayer = player.id;
            bestCatAvgName = label;
          }
        }
      }
    }
    if (bestCatAvg > 0)
      results.push({
        label: 'Category Specialist',
        value: bestCatAvg.toFixed(1),
        detail: `${name(players, bestCatAvgPlayer)} — avg ${bestCatAvgName}`,
        icon: '🔬',
      });

    return results;
  }, [players, games, scoredGames]);

  // ── Head-to-head ──
  const h2h = useMemo(() => {
    const result: Record<
      string,
      Record<string, { wins: number; losses: number }>
    > = {};
    for (const p of players) {
      result[p.id] = {};
      for (const q of players) {
        if (p.id !== q.id) result[p.id][q.id] = { wins: 0, losses: 0 };
      }
    }
    for (const game of games) {
      for (let i = 0; i < game.players.length; i++) {
        for (let j = i + 1; j < game.players.length; j++) {
          const a = game.players[i];
          const b = game.players[j];
          if (a.placement < b.placement) {
            result[a.playerId][b.playerId].wins++;
            result[b.playerId][a.playerId].losses++;
          } else if (a.placement > b.placement) {
            result[b.playerId][a.playerId].wins++;
            result[a.playerId][b.playerId].losses++;
          }
        }
      }
    }
    return result;
  }, [players, games]);

  return (
    <div className="space-y-8">
      {/* ── Player Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {playerStats.map(
          ({
            player,
            gamesPlayed,
            wins,
            winRate,
            avgPlacement,
            bestScore,
            avgScore,
            topTwoStreak,
          }) => (
            <div
              key={player.id}
              className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: color(
                        player.id,
                        players.indexOf(player),
                      ),
                    }}
                  />
                  <p className="text-zinc-100 font-semibold text-lg">
                    {player.name}
                  </p>
                </div>
                <span className="font-mono text-sm text-zinc-400">
                  {player.currentElo} Elo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <Stat label="Games" value={gamesPlayed} />
                <Stat
                  label="Win Rate"
                  value={`${(winRate * 100).toFixed(0)}%`}
                />
                <Stat label="Wins" value={wins} />
                <Stat label="Avg Place" value={avgPlacement.toFixed(1)} />
                <Stat label="Best" value={bestScore} />
                <Stat label="Avg Score" value={avgScore.toFixed(0)} />
              </div>
              {topTwoStreak > 0 && (
                <p className="text-xs text-amber-400">
                  🔥 Top-2 streak: {topTwoStreak} game
                  {topTwoStreak > 1 ? 's' : ''}
                </p>
              )}
            </div>
          ),
        )}
      </div>

      {/* ── Score Trends Over Time ── */}
      {scoreTrendData.length > 0 && (
        <Section title="Score Trends" subtitle="Total score per game over time">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={scoreTrendData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
              />
              {players.map((p, idx) => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.id}
                  name={p.name}
                  stroke={color(p.id, idx)}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: color(p.id, idx) }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── Category Leaders ── */}
      <Section
        title="Category Breakdown"
        subtitle="Top and average scores in each scoring category"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categoryBreakdown.map((cat) => {
            const maxAvg = Math.max(...cat.playerAvgs.map((p) => p.avg), 1);
            return (
              <div
                key={cat.key}
                className="rounded-lg bg-zinc-800/40 border border-zinc-800 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-zinc-200 font-semibold text-sm">
                    {cat.label}
                  </h4>
                  <span className="text-xs font-mono text-zinc-500">
                    avg {cat.overallAvg.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-zinc-100">
                    {cat.topScore}
                  </span>
                  <span className="text-xs text-zinc-500">
                    top score by{' '}
                    <span
                      className="font-medium"
                      style={{
                        color: color(
                          cat.topPlayer,
                          players.findIndex((p) => p.id === cat.topPlayer),
                        ),
                      }}
                    >
                      {name(players, cat.topPlayer)}
                    </span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[...cat.playerAvgs]
                    .sort((a, b) => b.avg - a.avg)
                    .map((pa) => (
                      <div
                        key={pa.id}
                        className="flex items-center gap-2"
                      >
                        <span className="text-xs text-zinc-400 w-8 shrink-0">
                          {pa.name}
                        </span>
                        <div className="flex-1 h-2 bg-zinc-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${maxAvg > 0 ? (pa.avg / maxAvg) * 100 : 0}%`,
                              backgroundColor: color(
                                pa.id,
                                players.findIndex((p) => p.id === pa.id),
                              ),
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-zinc-300 w-10 text-right shrink-0">
                          {pa.avg.toFixed(1)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Placement Distribution ── */}
      {placementData.length > 0 && (
        <Section
          title="Placement Distribution"
          subtitle="How often each player finishes in each position"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={placementData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="placement"
                stroke="#71717a"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
              />
              {players.map((p, idx) => (
                <Bar
                  key={p.id}
                  dataKey={p.id}
                  name={p.name}
                  fill={color(p.id, idx)}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── Scoring DNA ── */}
      {radarData.length > 0 && (
        <Section
          title="Scoring DNA"
          subtitle="Each axis scaled 0–100 relative to the group's best — shows where you stand out"
        >
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <button
              onClick={() => setDnaPlayer(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dnaPlayer === null
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              All Players
            </button>
            {players.map((p, idx) => (
              <button
                key={p.id}
                onClick={() =>
                  setDnaPlayer(dnaPlayer === p.id ? null : p.id)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dnaPlayer === p.id
                    ? 'text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
                style={
                  dnaPlayer === p.id
                    ? { backgroundColor: color(p.id, idx) }
                    : undefined
                }
              >
                {p.name}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis
                dataKey="category"
                stroke="#71717a"
                tick={{ fontSize: 12, fill: '#a1a1aa' }}
              />
              {dnaPlayers.map((p) => (
                <Radar
                  key={p.id}
                  name={p.name}
                  dataKey={p.id}
                  stroke={color(p.id, players.indexOf(p))}
                  fill={color(p.id, players.indexOf(p))}
                  fillOpacity={dnaPlayer ? 0.2 : 0.08}
                  strokeWidth={dnaPlayer ? 3 : 2}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value) => `${value}%`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── Records & Superlatives ── */}
      {records.length > 0 && (
        <Section title="Records" subtitle="Notable achievements and milestones">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {records.map((r) => (
              <div
                key={r.label}
                className="rounded-lg bg-zinc-800/40 border border-zinc-800 p-4 flex gap-3 items-start"
              >
                <span className="text-2xl leading-none mt-0.5">{r.icon}</span>
                <div className="min-w-0">
                  <p className="text-zinc-500 text-xs">{r.label}</p>
                  <p className="text-zinc-100 font-bold font-mono text-lg leading-tight">
                    {r.value}
                  </p>
                  <p className="text-zinc-400 text-xs mt-0.5 truncate">
                    {r.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Head-to-Head ── */}
      <Section title="Head-to-Head" subtitle="Win-loss record between players">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-zinc-500 py-1 pr-3" />
                {playerStats.map(({ player }) => (
                  <th
                    key={player.id}
                    className="text-center text-zinc-400 py-1 px-2 font-medium"
                  >
                    {player.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {playerStats.map(({ player: rowPlayer }) => (
                <tr
                  key={rowPlayer.id}
                  className="border-t border-zinc-800/50"
                >
                  <td className="py-2 pr-3 text-zinc-300 font-medium">
                    {rowPlayer.name}
                  </td>
                  {playerStats.map(({ player: colPlayer }) => {
                    if (rowPlayer.id === colPlayer.id) {
                      return (
                        <td
                          key={colPlayer.id}
                          className="py-2 px-2 text-center text-zinc-700"
                        >
                          —
                        </td>
                      );
                    }
                    const record = h2h[rowPlayer.id]?.[colPlayer.id];
                    if (!record)
                      return (
                        <td
                          key={colPlayer.id}
                          className="py-2 px-2 text-center"
                        >
                          —
                        </td>
                      );
                    return (
                      <td
                        key={colPlayer.id}
                        className="py-2 px-2 text-center font-mono text-xs"
                      >
                        <span className="text-emerald-400">{record.wins}</span>
                        <span className="text-zinc-600">-</span>
                        <span className="text-rose-400">{record.losses}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-zinc-100 font-semibold">{title}</h3>
        <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="text-zinc-200 font-mono font-semibold">{value}</p>
    </div>
  );
}
