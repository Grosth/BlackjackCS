export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  score: number;
  totalPoints: number;
  status: 'playing' | 'standing' | 'busted' | 'blackjack';
  isActive: boolean;
  isAI: boolean;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  gamePhase: 'setup' | 'playing' | 'roundFinished' | 'gameFinished';
  winner: Player | null;
  winners: Player[];
  currentRound: number;
  totalRounds: number;
  targetPoints: number;
}