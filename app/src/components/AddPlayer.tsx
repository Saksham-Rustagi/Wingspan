import { useState } from 'react';
import type { Player } from '../types';

interface Props {
  existingPlayers: Player[];
  onAdd: (name: string) => void;
}

export default function AddPlayer({ existingPlayers, onAdd }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const id = trimmed.toUpperCase().replace(/\s+/g, '');
    if (existingPlayers.some((p) => p.id === id)) {
      setError('Player already exists');
      return;
    }

    onAdd(trimmed);
    setName('');
    setError('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          Player Name / Initials
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="e.g. JD"
          maxLength={10}
        />
        {error && (
          <p className="text-rose-400 text-xs mt-1">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
      >
        Add Player
      </button>
    </form>
  );
}
