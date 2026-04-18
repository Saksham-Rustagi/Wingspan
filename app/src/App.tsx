import { useState, useCallback, useEffect, useMemo } from 'react';
import type { AppState, GameEntry } from './types';
import { loadState, addGame, addPlayer, updatePlayerColor } from './lib/storage';
import {
  MIN_GAMES_ACTIVE,
  getGameCounts,
  filterActivePlayers,
} from './lib/playerFilters';
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
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadState()
      .then((s) => {
        setState(s);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load from Firebase:', err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  const handleAddGame = useCallback(
    async (game: GameEntry) => {
      if (!state) return;
      const newState = await addGame(state, game);
      setState(newState);
      setActiveTab('leaderboard');
    },
    [state]
  );

  const handleAddPlayer = useCallback(
    async (name: string) => {
      if (!state) return;
      const newState = await addPlayer(state, name);
      setState(newState);
      setActiveTab('leaderboard');
    },
    [state]
  );

  const handleChangePlayerColor = useCallback(
    async (playerId: string, color: string) => {
      if (!state) return;
      const newState = await updatePlayerColor(state, playerId, color);
      setState(newState);
    },
    [state]
  );

  const gameCounts = useMemo(
    () => (state ? getGameCounts(state.games) : {}),
    [state]
  );

  const hasInactivePlayers = useMemo(() => {
    if (!state) return false;
    return state.players.some(
      (p) => (gameCounts[p.id] ?? 0) < MIN_GAMES_ACTIVE
    );
  }, [state, gameCounts]);

  const visiblePlayers = useMemo(() => {
    if (!state) return [];
    return showInactive
      ? state.players
      : filterActivePlayers(state.players, state.games);
  }, [state, showInactive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-400 text-lg font-semibold mb-2">Failed to connect to Firebase</p>
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <p className="text-zinc-600 text-xs">
            Make sure Firestore is enabled in your Firebase Console and security rules allow reads/writes.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            {hasInactivePlayers && (
              <div className="flex items-center justify-between rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-zinc-300 text-sm font-medium">
                    Show occasional players
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Hides players with fewer than {MIN_GAMES_ACTIVE} games
                  </p>
                </div>
                <button
                  onClick={() => setShowInactive((v) => !v)}
                  role="switch"
                  aria-checked={showInactive}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    showInactive ? 'bg-violet-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      showInactive ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            )}

            <section>
              <SectionHeader
                title="Rankings"
                subtitle="Current Elo standings"
              />
              <Leaderboard
                players={visiblePlayers}
                eloHistory={state.eloHistory}
                onChangeColor={handleChangePlayerColor}
              />
            </section>

            <section>
              <SectionHeader
                title="Elo Over Time"
                subtitle="Click a game point to see details"
              />
              <EloChart
                players={visiblePlayers}
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
