export interface PlayerScores {
  birds: number;
  bonusCards: number;
  endOfRoundGoals: number;
  eggs: number;
  foodOnCards: number;
  tuckedCards: number;
  total: number;
}

export interface GamePlayer {
  playerId: string;
  placement: number;
  scores: PlayerScores;
}

export interface GameEntry {
  id: string;
  date: string;
  players: GamePlayer[];
}

export interface Player {
  id: string;
  name: string;
  currentElo: number;
}

export interface EloSnapshot {
  gameId: string;
  ratings: Record<string, number>;
}

export interface AppState {
  players: Player[];
  games: GameEntry[];
  eloHistory: EloSnapshot[];
}
