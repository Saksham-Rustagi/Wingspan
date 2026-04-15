import { useState, useCallback } from 'react';
import type { AppState, GameEntry } from './types';
import { loadState, addGame, addPlayer } from './lib/storage';
import Leaderboard from './components/Leaderboard';
import EloChart from './components/EloChart';
import GameDetail from './components/GameDetail';
import AddGame from './components/AddGame';
import AddPlayer from './components/AddPlayer';
import GameHistory from './components/GameHistory';
import PlayerStats from './components/PlayerStats';

type Tab = 'leaderboard' | 'history' | 'stats' | 'addGame' | 'addPlayer';

const TABS: { id: Tab; label: string }[] = [
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'history', label: 'History' },
  { id: 'stats', label: 'Stats' },
  { id: 'addGame', label: '+ Game' },
  { id: 'addPlayer', label: '+ Player' },
];

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);

  const handleAddGame = useCallback(
    (game: GameEntry) => {
      setState((prev) => addGame(prev, game));
      setActiveTab('leaderboard');
    },
    []
  );

  const handleAddPlayer = useCallback(
    (name: string) => {
      setState((prev) => addPlayer(prev, name));
      setActiveTab('leaderboard');
    },
    []
  );

  const selectedGame = selectedGameIndex != null ? state.games[selectedGameIndex] : null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Wingspan
            <span className="text-violet-400 ml-1.5">Elo</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Multiplayer rating tracker
          </p>
        </div>
      </header>

      <nav className="border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-sm sticky top-[85px] z-40">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'leaderboard') setSelectedGameIndex(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'leaderboard' && (
          <div className="space-y-8">
            <section>
              <SectionHeader
                title="Rankings"
                subtitle="Current Elo standings"
              />
              <Leaderboard
                players={state.players}
                eloHistory={state.eloHistory}
              />
            </section>

            <section>
              <SectionHeader
                title="Elo Over Time"
                subtitle="Click a game point to see details"
              />
              <EloChart
                players={state.players}
                eloHistory={state.eloHistory}
                totalGames={state.games.length}
                selectedGameIndex={selectedGameIndex}
                onSelectGame={setSelectedGameIndex}
              />

              {selectedGame && selectedGameIndex != null && (
                <div className="mt-4 rounded-xl bg-zinc-900 border border-violet-500/30 overflow-hidden animate-in">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/80">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-violet-400">
                        #{selectedGameIndex + 1}
                      </span>
                      <span className="text-zinc-100 font-semibold text-sm">
                        Game {selectedGameIndex + 1}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {selectedGame.date}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedGameIndex(null)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <GameDetail
                      game={selectedGame}
                      gameIndex={selectedGameIndex}
                      players={state.players}
                      eloHistory={state.eloHistory}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'addGame' && (
          <section>
            <SectionHeader
              title="Record Game"
              subtitle="Add a completed Wingspan game"
            />
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
              <AddGame
                players={state.players}
                gameCount={state.games.length}
                onSubmit={handleAddGame}
              />
            </div>
          </section>
        )}

        {activeTab === 'addPlayer' && (
          <section>
            <SectionHeader
              title="New Player"
              subtitle="Add someone to the tracker"
            />
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 max-w-sm">
              <AddPlayer
                existingPlayers={state.players}
                onAdd={handleAddPlayer}
              />
            </div>
          </section>
        )}

        {activeTab === 'history' && (
          <section>
            <SectionHeader
              title="Game History"
              subtitle={`${state.games.length} games recorded`}
            />
            <GameHistory
              games={state.games}
              players={state.players}
              eloHistory={state.eloHistory}
            />
          </section>
        )}

        {activeTab === 'stats' && (
          <section>
            <SectionHeader
              title="Player Stats"
              subtitle="Performance breakdown and head-to-head"
            />
            <PlayerStats players={state.players} games={state.games} />
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-800 py-6 mt-12">
        <p className="text-center text-zinc-600 text-xs">
          Wingspan Elo Tracker &middot; K-factor 32 &middot; Pairwise multiplayer Elo
        </p>
      </footer>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
      <p className="text-zinc-500 text-sm">{subtitle}</p>
    </div>
  );
}
