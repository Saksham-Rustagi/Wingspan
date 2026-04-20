import { useState } from 'react';
import type { GameEntry, EloSnapshot, Player } from '../types';
import GameDetail from './GameDetail';

interface Props {
  games: GameEntry[];
  players: Player[];
  eloHistory: EloSnapshot[];
  ratingLabel?: string;
}

export default function GameHistory({
  games,
  players,
  eloHistory,
  ratingLabel = 'Elo',
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-3">
      {[...games].reverse().map((game, reverseIdx) => {
        const gameIdx = games.length - 1 - reverseIdx;
        const isOpen = expanded === game.id;
        const sorted = [...game.players].sort(
          (a, b) => a.placement - b.placement
        );
        const winner = sorted[0];

        return (
          <div
            key={game.id}
            className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : game.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-500">
                  #{gameIdx + 1}
                </span>
                <span className="text-zinc-100 font-semibold">
                  Game {gameIdx + 1}
                </span>
                <span className="text-xs text-zinc-500">{game.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">
                  Winner:{' '}
                  <span className="text-amber-400 font-semibold">
                    {playerMap[winner.playerId]?.name ?? winner.playerId}
                  </span>
                </span>
                <span
                  className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  ▾
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-zinc-800 px-5 py-4">
                <GameDetail
                  game={game}
                  gameIndex={gameIdx}
                  players={players}
                  eloHistory={eloHistory}
                  ratingLabel={ratingLabel}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
