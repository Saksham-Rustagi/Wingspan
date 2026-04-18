import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppState, Player, GameEntry } from '../types';
import { recomputeAllElo } from './elo';
import { SEED_PLAYERS, SEED_GAMES } from './seedData';

const playersCol = collection(db, 'players');
const gamesCol = collection(db, 'games');

async function fetchPlayers(): Promise<Player[]> {
  const snap = await getDocs(playersCol);
  return snap.docs.map((d) => d.data() as Player);
}

async function fetchGames(): Promise<GameEntry[]> {
  const snap = await getDocs(gamesCol);
  const games = snap.docs.map((d) => d.data() as GameEntry);
  return games.sort((a, b) => a.date.localeCompare(b.date));
}

async function seedFirestore(): Promise<void> {
  const batch = writeBatch(db);
  for (const p of SEED_PLAYERS) {
    batch.set(doc(playersCol, p.id), p);
  }
  for (const g of SEED_GAMES) {
    batch.set(doc(gamesCol, g.id), g);
  }
  await batch.commit();
}

export async function loadState(): Promise<AppState> {
  let players = await fetchPlayers();
  let games = await fetchGames();

  if (players.length === 0 && games.length === 0) {
    await seedFirestore();
    players = SEED_PLAYERS;
    games = SEED_GAMES;
  }

  const { updatedPlayers, eloHistory } = recomputeAllElo(players, games);
  return { players: updatedPlayers, games, eloHistory };
}

export async function addGame(
  state: AppState,
  game: GameEntry,
): Promise<AppState> {
  await setDoc(doc(gamesCol, game.id), game);

  const games = [...state.games, game];
  const { updatedPlayers, eloHistory } = recomputeAllElo(state.players, games);

  const batch = writeBatch(db);
  for (const p of updatedPlayers) {
    batch.set(doc(playersCol, p.id), p);
  }
  await batch.commit();

  return { players: updatedPlayers, games, eloHistory };
}

export async function addPlayer(
  state: AppState,
  name: string,
): Promise<AppState> {
  const id = name.toUpperCase().replace(/\s+/g, '');
  const newPlayer: Player = { id, name, currentElo: 1000 };
  await setDoc(doc(playersCol, id), newPlayer);

  const players = [...state.players, newPlayer];
  const { updatedPlayers, eloHistory } = recomputeAllElo(players, state.games);
  return { players: updatedPlayers, games: state.games, eloHistory };
}

export async function updatePlayerColor(
  state: AppState,
  playerId: string,
  color: string,
): Promise<AppState> {
  const target = state.players.find((p) => p.id === playerId);
  if (!target) return state;

  const updated: Player = { ...target, color };
  await setDoc(doc(playersCol, playerId), updated);

  const players = state.players.map((p) =>
    p.id === playerId ? updated : p,
  );
  return { ...state, players };
}
