import { useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { Player, EloSnapshot } from '../types';

const PLAYER_LINE_COLORS: Record<string, string> = {
  AS: '#f43f5e',
  NT: '#0ea5e9',
  HS: '#10b981',
  SR: '#8b5cf6',
  GM: '#f59e0b',
};

interface Props {
  players: Player[];
  eloHistory: EloSnapshot[];
  totalGames: number;
  selectedGameIndex: number | null;
  onSelectGame: (gameIndex: number | null) => void;
}

export default function EloChart({
  players,
  eloHistory,
  totalGames,
  selectedGameIndex,
  onSelectGame,
}: Props) {
  const data = eloHistory.map((snap, idx) => {
    const point: Record<string, string | number> = {
      name: idx === 0 ? 'Start' : `Game ${idx}`,
      _index: idx,
    };
    for (const p of players) {
      if (snap.ratings[p.id] != null) {
        point[p.id] = snap.ratings[p.id];
      }
    }
    return point;
  });

  const handleChartClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => {
      if (!state) return;
      const idx: number | undefined = state.activeTooltipIndex;
      if (idx == null || idx === 0) return;
      const gameIdx = idx - 1;
      onSelectGame(selectedGameIndex === gameIdx ? null : gameIdx);
    },
    [onSelectGame, selectedGameIndex]
  );

  const refLineIndex =
    selectedGameIndex != null ? selectedGameIndex + 1 : null;
  const refLineName =
    refLineIndex != null ? data[refLineIndex]?.name : null;

  const gameNumbers = Array.from({ length: totalGames }, (_, i) => i);

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 space-y-4">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          onClick={handleChartClick}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 12 }} />
          <YAxis
            stroke="#71717a"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 20', 'dataMax + 20']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }} />
          {refLineName && (
            <ReferenceLine
              x={refLineName}
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
          {players.map((p) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.id}
              name={p.name}
              stroke={PLAYER_LINE_COLORS[p.id] ?? '#71717a'}
              strokeWidth={2.5}
              dot={{ r: 4, fill: PLAYER_LINE_COLORS[p.id] ?? '#71717a' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500 mr-1">Select game:</span>
        {gameNumbers.map((i) => (
          <button
            key={i}
            onClick={() =>
              onSelectGame(selectedGameIndex === i ? null : i)
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedGameIndex === i
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
          >
            Game {i + 1}
          </button>
        ))}
      </div>

      {selectedGameIndex != null && (
        <p className="text-center text-xs text-zinc-500">
          Showing Game {selectedGameIndex + 1} details below &middot;{' '}
          <button
            onClick={() => onSelectGame(null)}
            className="text-violet-400 hover:text-violet-300 underline"
          >
            dismiss
          </button>
        </p>
      )}
    </div>
  );
}
