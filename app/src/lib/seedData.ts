import type { Player, GameEntry } from '../types';

const ZERO_SCORES = { birds: 0, bonusCards: 0, endOfRoundGoals: 0, eggs: 0, foodOnCards: 0, tuckedCards: 0, total: 0 };

export const SEED_VERSION = 3;

export const SEED_PLAYERS: Player[] = [
  { id: 'AS', name: 'AS', currentElo: 1000 },
  { id: 'NT', name: 'NT', currentElo: 1000 },
  { id: 'HS', name: 'HS', currentElo: 1000 },
  { id: 'SR', name: 'SR', currentElo: 1000 },
  { id: 'GM', name: 'GM', currentElo: 1000 },
];

export const SEED_GAMES: GameEntry[] = [
  {
    id: 'game-1',
    date: '',
    players: [
      { playerId: 'NT', placement: 1, scores: { ...ZERO_SCORES, total: 88 } },
      { playerId: 'SR', placement: 2, scores: { ...ZERO_SCORES, total: 86 } },
      { playerId: 'AS', placement: 3, scores: { ...ZERO_SCORES, total: 84 } },
      { playerId: 'HS', placement: 4, scores: { ...ZERO_SCORES, total: 69 } },
    ],
  },
  {
    id: 'game-2',
    date: '2025-01-01',
    players: [
      {
        playerId: 'AS',
        placement: 2,
        scores: { birds: 34, bonusCards: 9, endOfRoundGoals: 12, eggs: 11, foodOnCards: 3, tuckedCards: 0, total: 69 },
      },
      {
        playerId: 'NT',
        placement: 2,
        scores: { birds: 34, bonusCards: 11, endOfRoundGoals: 7, eggs: 12, foodOnCards: 0, tuckedCards: 5, total: 69 },
      },
      {
        playerId: 'HS',
        placement: 4,
        scores: { birds: 33, bonusCards: 5, endOfRoundGoals: 12, eggs: 11, foodOnCards: 2, tuckedCards: 3, total: 66 },
      },
      {
        playerId: 'SR',
        placement: 1,
        scores: { birds: 39, bonusCards: 4, endOfRoundGoals: 4, eggs: 25, foodOnCards: 0, tuckedCards: 19, total: 91 },
      },
    ],
  },
  {
    id: 'game-3',
    date: '2025-02-01',
    players: [
      {
        playerId: 'AS',
        placement: 2,
        scores: { birds: 37, bonusCards: 0, endOfRoundGoals: 13, eggs: 25, foodOnCards: 0, tuckedCards: 3, total: 78 },
      },
      {
        playerId: 'NT',
        placement: 4,
        scores: { birds: 31, bonusCards: 3, endOfRoundGoals: 4, eggs: 18, foodOnCards: 4, tuckedCards: 6, total: 66 },
      },
      {
        playerId: 'HS',
        placement: 3,
        scores: { birds: 30, bonusCards: 0, endOfRoundGoals: 7, eggs: 28, foodOnCards: 0, tuckedCards: 4, total: 69 },
      },
      {
        playerId: 'SR',
        placement: 1,
        scores: { birds: 28, bonusCards: 3, endOfRoundGoals: 11, eggs: 32, foodOnCards: 0, tuckedCards: 13, total: 87 },
      },
    ],
  },
  {
    id: 'game-4',
    date: '2025-03-01',
    players: [
      {
        playerId: 'AS',
        placement: 2,
        scores: { birds: 23, bonusCards: 5, endOfRoundGoals: 13, eggs: 16, foodOnCards: 0, tuckedCards: 21, total: 78 },
      },
      {
        playerId: 'HS',
        placement: 4,
        scores: { birds: 26, bonusCards: 3, endOfRoundGoals: 2, eggs: 13, foodOnCards: 0, tuckedCards: 20, total: 64 },
      },
      {
        playerId: 'SR',
        placement: 3,
        scores: { birds: 31, bonusCards: 4, endOfRoundGoals: 8, eggs: 18, foodOnCards: 4, tuckedCards: 6, total: 71 },
      },
      {
        playerId: 'GM',
        placement: 1,
        scores: { birds: 37, bonusCards: 4, endOfRoundGoals: 11, eggs: 21, foodOnCards: 0, tuckedCards: 5, total: 78 },
      },
    ],
  },
  {
    id: 'game-5',
    date: '2025-04-01',
    players: [
      {
        playerId: 'AS',
        placement: 5,
        scores: { birds: 37, bonusCards: 0, endOfRoundGoals: 1, eggs: 14, foodOnCards: 0, tuckedCards: 18, total: 70 },
      },
      {
        playerId: 'NT',
        placement: 1,
        scores: { birds: 43, bonusCards: 6, endOfRoundGoals: 8, eggs: 23, foodOnCards: 7, tuckedCards: 0, total: 87 },
      },
      {
        playerId: 'HS',
        placement: 4,
        scores: { birds: 49, bonusCards: 4, endOfRoundGoals: 7, eggs: 24, foodOnCards: 0, tuckedCards: 2, total: 86 },
      },
      {
        playerId: 'SR',
        placement: 2,
        scores: { birds: 30, bonusCards: 4, endOfRoundGoals: 8, eggs: 38, foodOnCards: 0, tuckedCards: 7, total: 87 },
      },
      {
        playerId: 'GM',
        placement: 3,
        scores: { birds: 35, bonusCards: 7, endOfRoundGoals: 11, eggs: 25, foodOnCards: 0, tuckedCards: 9, total: 87 },
      },
    ],
  },
  {
    id: 'game-6',
    date: '2025-05-01',
    players: [
      {
        playerId: 'AS',
        placement: 5,
        scores: { birds: 24, bonusCards: 0, endOfRoundGoals: 4, eggs: 26, foodOnCards: 0, tuckedCards: 15, total: 69 },
      },
      {
        playerId: 'NT',
        placement: 4,
        scores: { birds: 45, bonusCards: 3, endOfRoundGoals: 2, eggs: 24, foodOnCards: 0, tuckedCards: 0, total: 74 },
      },
      {
        playerId: 'HS',
        placement: 1,
        scores: { birds: 46, bonusCards: 10, endOfRoundGoals: 8, eggs: 33, foodOnCards: 0, tuckedCards: 1, total: 98 },
      },
      {
        playerId: 'SR',
        placement: 2,
        scores: { birds: 40, bonusCards: 5, endOfRoundGoals: 9, eggs: 20, foodOnCards: 0, tuckedCards: 18, total: 92 },
      },
      {
        playerId: 'GM',
        placement: 3,
        scores: { birds: 29, bonusCards: 9, endOfRoundGoals: 11, eggs: 23, foodOnCards: 0, tuckedCards: 12, total: 84 },
      },
    ],
  },
];
