import type { AppState, Player, GameEntry } from '../types';
import { recomputeAllElo } from './elo';
import { SEED_PLAYERS, SEED_GAMES, SEED_VERSION } from './seedData';

const STORAGE_KEY = 'wingspan-elo-data';
const VERSION_KEY = 'wingspan-elo-version';

function loadRaw(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

function save(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
}

function isSeedCurrent(): boolean {
  const v = localStorage.getItem(VERSION_KEY);
  return v != null && Number(v) >= SEED_VERSION;
}

export function loadState(): AppState {
  const existing = loadRaw();
  if (existing && existing.games.length > 0 && isSeedCurrent()) {
    return existing;
  }

  const { updatedPlayers, eloHistory } = recomputeAllElo(SEED_PLAYERS, SEED_GAMES);
  const state: AppState = {
    players: updatedPlayers,
    games: SEED_GAMES,
    eloHistory,
  };
  save(state);
  return state;
}

export function saveState(state: AppState): void {
  save(state);
}

export function addGame(
  state: AppState,
  game: GameEntry
): AppState {
  const games = [...state.games, game];
  const { updatedPlayers, eloHistory } = recomputeAllElo(state.players, games);
  const newState: AppState = { players: updatedPlayers, games, eloHistory };
  save(newState);
  return newState;
}

export function addPlayer(state: AppState, name: string): AppState {
  const id = name.toUpperCase().replace(/\s+/g, '');
  const newPlayer: Player = { id, name, currentElo: 1000 };
  const players = [...state.players, newPlayer];
  const { updatedPlayers, eloHistory } = recomputeAllElo(players, state.games);
  const newState: AppState = { players: updatedPlayers, games: state.games, eloHistory };
  save(newState);
  return newState;
}

export function resetData(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return loadState();
}
