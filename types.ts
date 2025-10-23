export type GameState = 'mode-select' | 'party-mode-select' | 'create-party' | 'join-party' | 'lobby' | 'playing' | 'finished' | 'gameOver' | 'solo-name-entry' | 'party-results';
export type GameMode = 'solo' | 'party';

export interface OrderingPuzzle {
  type: 'ordering';
  title: string;
  steps: string[]; // Correct order
  shuffled: string[]; // Shuffled for the user
}

export interface VisualPuzzle {
  type: 'visual';
  question: string;
  options: string[]; // Icon names
  answer: string; // The correct icon name
}

export type Puzzle = OrderingPuzzle | VisualPuzzle;


export interface PlayerScore {
  name: string;
  time: number;
}