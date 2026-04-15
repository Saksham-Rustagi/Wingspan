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

export default function AddGame({ players, gameCount, onSubmit }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playerForms, setPlayerForms] = useState<Record<string, PlayerForm>>({});
  const [showScores, setShowScores] = useState(false);

  function togglePlayer(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
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
      return { ...prev, [playerId]: { ...form, scores } };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size < 2) return;

    const entries = Array.from(selected).map((id) => {
      const form = playerForms[id] ?? { playerId: id, scores: { ...EMPTY_SCORES } };
      return form;
    });

    entries.sort((a, b) => b.scores.total - a.scores.total);

    let placement = 1;
    const gamePlayers = entries.map((entry, idx) => {
      if (idx > 0 && entry.scores.total < entries[idx - 1].scores.total) {
        placement = idx + 1;
      }
      return {
        playerId: entry.playerId,
        placement,
        scores: entry.scores,
      };
    });

    const game: GameEntry = {
      id: `game-${gameCount + 1}`,
      date: new Date().toISOString().split('T')[0],
      players: gamePlayers,
    };

    onSubmit(game);
    setSelected(new Set());
    setPlayerForms({});
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
