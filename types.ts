export type GameState = 'mode-select' | 'party-mode-select' | 'create-party' | 'join-party' | 'lobby' | 'playing' | 'finished' | 'gameOver' | 'solo-name-entry';
export type GameMode = 'solo' | 'party';

export interface Puzzle {
  clue: string;
  answer: string;
  options: string[];
}

export interface PlayerScore {
  name: string;
  time: number;
}
