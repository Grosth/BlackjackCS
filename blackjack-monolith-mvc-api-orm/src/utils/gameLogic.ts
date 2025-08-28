import { Card, Player, GameState } from '../types/game';

export const createDeck = (): Card[] => {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      let value = 0;
      if (rank === 'A') value = 11;
      else if (['J', 'Q', 'K'].includes(rank)) value = 10;
      else value = parseInt(rank);

      deck.push({ suit, rank, value });
    });
  });

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const calculateScore = (hand: Card[]): number => {
  let score = 0;
  let aces = 0;

  hand.forEach(card => {
    if (card.rank === 'A') {
      aces += 1;
      score += 11;
    } else {
      score += card.value;
    }
  });

  // Adjust for aces
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
};

export const isBlackjack = (hand: Card[]): boolean => {
  return hand.length === 2 && calculateScore(hand) === 21;
};

export const dealInitialCards = (players: Player[], deck: Card[]): { updatedPlayers: Player[], updatedDeck: Card[] } => {
  const newDeck = [...deck];
  const updatedPlayers = players.map(player => {
    const hand = [newDeck.pop()!, newDeck.pop()!];
    const score = calculateScore(hand);
    const status = isBlackjack(hand) ? 'blackjack' : 'playing';
    
    return {
      ...player,
      hand,
      score,
      status: status as Player['status']
    };
  });

  return { updatedPlayers, updatedDeck: newDeck };
};

export const determineWinners = (players: Player[]): Player[] => {
  const validPlayers = players.filter(p => p.status !== 'busted');
  
  if (validPlayers.length === 0) return [];
  
  // Check for blackjacks first
  const blackjackPlayers = validPlayers.filter(p => p.status === 'blackjack');
  if (blackjackPlayers.length > 0) {
    return blackjackPlayers;
  }
  
  // Find highest score under or equal to 21
  const maxScore = Math.max(...validPlayers.map(p => p.score));
  return validPlayers.filter(p => p.score === maxScore);
};

export const makeAIDecision = (player: Player, otherPlayers: Player[]): 'hit' | 'stand' => {
  const score = player.score;
  
  // Basic AI strategy
  if (score < 12) return 'hit';
  if (score >= 17) return 'stand';
  
  // Between 12-16, consider other players' visible scores
  const otherScores = otherPlayers
    .filter(p => p.status === 'standing' || p.status === 'blackjack')
    .map(p => p.score);
  
  const highestOtherScore = Math.max(...otherScores, 0);
  
  if (score < highestOtherScore && score < 17) {
    return Math.random() > 0.3 ? 'hit' : 'stand';
  }
  
  return score < 15 ? 'hit' : 'stand';
};

export const getCardSymbol = (suit: Card['suit']): string => {
  const symbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[suit];
};

export const getCardColor = (suit: Card['suit']): string => {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800';
};