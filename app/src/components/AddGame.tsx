import { useState } from 'react';
import type { Player, GameEntry, PlayerScores } from '../types';

const EMPTY_SCORES: PlayerScores = {
  birds: 0,
  bonusCards: 0,
  endOfRoundGoals: 0,
  eggs: 0,
  foodOnCards: 0,
  tuckedCards: 0,
  total: 0,
};

const SCORE_FIELDS: { key: keyof Omit<PlayerScores, 'total'>; label: string }[] = [
  { key: 'birds', label: 'Birds' },
  { key: 'bonusCards', label: 'Bonus Cards' },
  { key: 'endOfRoundGoals', label: 'Round Goals' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'foodOnCards', label: 'Food on Cards' },
  { key: 'tuckedCards', label: 'Tucked Cards' },
];

interface PlayerForm {
  playerId: string;
  scores: PlayerScores;
}

interface Props {
  players: Player[];
  gameCount: number;
  onSubmit: (game: GameEntry) => void;
}

function stableSortByScore(order: string[], forms: Record<string, PlayerForm>): string[] {
  return [...order].sort((a, b) => {
    const diff = (forms[b]?.scores.total ?? 0) - (forms[a]?.scores.total ?? 0);
    if (diff !== 0) return diff;
    return order.indexOf(a) - order.indexOf(b);
  });
}

export default function AddGame({ players, gameCount, onSubmit }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playerForms, setPlayerForms] = useState<Record<string, PlayerForm>>({});
  const [showScores, setShowScores] = useState(false);
  const [finalOrder, setFinalOrder] = useState<string[]>([]);

  function togglePlayer(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
      setFinalOrder((prev) => prev.filter((x) => x !== id));
    } else {
      next.add(id);
      setFinalOrder((prev) => [...prev, id]);
    }
    setSelected(next);
    if (!playerForms[id]) {
      setPlayerForms((prev) => ({
        ...prev,
        [id]: { playerId: id, scores: { ...EMPTY_SCORES } },
      }));
    }
  }

  function updateScore(playerId: string, field: keyof PlayerScores, value: number) {
    setPlayerForms((prev) => {
      const form = prev[playerId] ?? { playerId, scores: { ...EMPTY_SCORES } };
      const scores = { ...form.scores, [field]: value };
      if (field !== 'total') {
        scores.total =
          scores.birds +
          scores.bonusCards +
          scores.endOfRoundGoals +
          scores.eggs +
          scores.foodOnCards +
          scores.tuckedCards;
      }
      const next = { ...prev, [playerId]: { ...form, scores } };
      setFinalOrder((order) => stableSortByScore(order, next));
      return next;
    });
  }

  function movePlayer(playerId: string, direction: 'up' | 'down') {
    setFinalOrder((prev) => {
      const idx = prev.indexOf(playerId);
      if (direction === 'up' && idx > 0) {
        const next = [...prev];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        return next;
      }
      if (direction === 'down' && idx < prev.length - 1) {
        const next = [...prev];
        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
        return next;
      }
      return prev;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size < 2) return;

    let placement = 1;
    const gamePlayers = finalOrder.map((playerId, idx) => {
      if (idx > 0) {
        const prevId = finalOrder[idx - 1];
        const prevTotal = playerForms[prevId]?.scores.total ?? 0;
        const currTotal = playerForms[playerId]?.scores.total ?? 0;
        if (currTotal < prevTotal) {
          placement = idx + 1;
        }
      }
      const form = playerForms[playerId] ?? { playerId, scores: { ...EMPTY_SCORES } };
      return { playerId, placement, scores: form.scores };
    });

    const game: GameEntry = {
      id: `game-${gameCount + 1}`,
      date: new Date().toISOString().split('T')[0],
      players: gamePlayers,
    };

    onSubmit(game);
    setSelected(new Set());
    setPlayerForms({});
    setFinalOrder([]);
  }

  const selectedPlayers = players.filter((p) => selected.has(p.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-3">
          Select Players
        </label>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlayer(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selected.has(p.id)
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {selectedPlayers.length >= 2 && (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowScores(!showScores)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
            >
              {showScores ? 'Hide detailed scores' : 'Enter detailed scores'}
            </button>
          </div>

          {!showScores ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-400">
                Enter total scores
              </label>
              {selectedPlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-zinc-300 w-12 text-sm font-medium">{p.name}</span>
                  <input
                    type="number"
                    min={0}
                    value={playerForms[p.id]?.scores.total || ''}
                    onChange={(e) =>
                      updateScore(p.id, 'total', parseInt(e.target.value) || 0)
                    }
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Total score"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-4"
                >
                  <p className="text-sm font-semibold text-zinc-300 mb-3">
                    {p.name}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SCORE_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-zinc-500 mb-1">
                          {label}
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={playerForms[p.id]?.scores[key] || ''}
                          onChange={(e) =>
                            updateScore(
                              p.id,
                              key,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-100 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-right text-xs text-zinc-500 mt-2">
                    Total:{' '}
                    <span className="text-zinc-300 font-mono font-semibold">
                      {playerForms[p.id]?.scores.total ?? 0}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {finalOrder.length >= 2 && (() => {
            const hasTies = finalOrder.some((id, idx) => {
              if (idx === 0) return false;
              const prevId = finalOrder[idx - 1];
              return (playerForms[id]?.scores.total ?? 0) === (playerForms[prevId]?.scores.total ?? 0);
            });
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-400">Final Standings</label>
                  {hasTies && (
                    <span className="text-xs text-amber-400">Tie detected — adjust order to set tiebreak</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {finalOrder.map((id, idx) => {
                    const player = players.find((p) => p.id === id);
                    const total = playerForms[id]?.scores.total ?? 0;
                    const prevTotal = idx > 0 ? (playerForms[finalOrder[idx - 1]]?.scores.total ?? 0) : null;
                    const nextTotal = idx < finalOrder.length - 1 ? (playerForms[finalOrder[idx + 1]]?.scores.total ?? 0) : null;
                    const tiedWithPrev = prevTotal !== null && total === prevTotal;
                    const tiedWithNext = nextTotal !== null && total === nextTotal;
                    const isTied = tiedWithPrev || tiedWithNext;
                    let placement = 1;
                    for (let i = 0; i < idx; i++) {
                      const prevId = finalOrder[i];
                      if ((playerForms[prevId]?.scores.total ?? 0) > total) {
                        placement = i + 2;
                      }
                    }
                    return (
                      <div
                        key={id}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isTied ? 'bg-amber-950/30 border border-amber-800/40' : 'bg-zinc-900/50 border border-zinc-800'}`}
                      >
                        <span className="text-xs font-mono text-zinc-500 w-5 text-right shrink-0">
                          {placement}
                        </span>
                        <span className="flex-1 text-sm text-zinc-200 font-medium">{player?.name}</span>
                        <span className="text-xs font-mono text-zinc-400 shrink-0">{total} pts</span>
                        {isTied && (
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => movePlayer(id, 'up')}
                              disabled={idx === 0}
                              className="text-zinc-400 hover:text-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
                              aria-label="Move up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => movePlayer(id, 'down')}
                              disabled={idx === finalOrder.length - 1}
                              className="text-zinc-400 hover:text-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
                              aria-label="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            Record Game
          </button>
        </>
      )}
    </form>
  );
}
