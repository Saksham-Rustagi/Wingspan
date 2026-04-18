import { useEffect, useRef, useState } from 'react';
import type { Player, EloSnapshot } from '../types';
import { COLOR_PALETTE, getPlayerColor } from '../lib/playerColors';

const RANK_COLORS = [
  'from-amber-400 to-yellow-500',
  'from-zinc-300 to-zinc-400',
  'from-orange-500 to-amber-600',
];

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
  onChangeColor?: (playerId: string, color: string) => void | Promise<void>;
}

export default function Leaderboard({ players, eloHistory, onChangeColor }: Props) {
  const sorted = [...players].sort((a, b) => b.currentElo - a.currentElo);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {sorted.map((player, idx) => {
        const delta = getEloDelta(player.id, eloHistory);
        const rankColor = RANK_COLORS[idx] ?? '';
        const playerIndex = players.findIndex((p) => p.id === player.id);
        const avatarColor = getPlayerColor(player, playerIndex);

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

            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() =>
                  onChangeColor &&
                  setOpenPickerId(openPickerId === player.id ? null : player.id)
                }
                disabled={!onChangeColor}
                aria-label={
                  onChangeColor ? `Change color for ${player.name}` : undefined
                }
                title={onChangeColor ? 'Change color' : undefined}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform ${
                  onChangeColor
                    ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-900'
                    : 'cursor-default'
                }`}
                style={{ backgroundColor: avatarColor }}
              >
                {player.name.slice(0, 2)}
              </button>

              {openPickerId === player.id && onChangeColor && (
                <ColorPicker
                  currentColor={avatarColor}
                  onPick={async (hex) => {
                    setOpenPickerId(null);
                    await onChangeColor(player.id, hex);
                  }}
                  onClose={() => setOpenPickerId(null)}
                />
              )}
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

interface ColorPickerProps {
  currentColor: string;
  onPick: (hex: string) => void;
  onClose: () => void;
}

function ColorPicker({ currentColor, onPick, onClose }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [custom, setCustom] = useState(currentColor);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const normalizedCurrent = currentColor.toLowerCase();

  return (
    <div
      ref={ref}
      className="absolute z-50 top-12 left-0 w-60 rounded-xl bg-zinc-900 border border-zinc-700 shadow-xl p-3 animate-in"
      role="dialog"
      aria-label="Pick player color"
    >
      <p className="text-xs text-zinc-400 mb-2 font-medium">Player color</p>
      <div className="grid grid-cols-6 gap-1.5">
        {COLOR_PALETTE.map((c) => {
          const selected = c.hex.toLowerCase() === normalizedCurrent;
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onPick(c.hex)}
              title={c.name}
              aria-label={c.name}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                selected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
              }`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
        <input
          type="color"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border border-zinc-700"
          aria-label="Custom color"
        />
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          maxLength={7}
          spellCheck={false}
          className="flex-1 min-w-0 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-mono focus:outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={() => {
            if (/^#[0-9a-fA-F]{6}$/.test(custom)) onPick(custom);
          }}
          disabled={!/^#[0-9a-fA-F]{6}$/.test(custom)}
          className="px-2.5 py-1 rounded bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Set
        </button>
      </div>
    </div>
  );
}
