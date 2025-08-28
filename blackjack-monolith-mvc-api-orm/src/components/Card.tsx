import React from 'react';
import { Card as CardType } from '../types/game';
import { getCardSymbol, getCardColor } from '../utils/gameLogic';

interface CardProps {
  card: CardType;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, className = '' }) => {
  return (
    <div className={`bg-white border-2 border-black rounded-lg p-3 shadow-lg min-w-[60px] min-h-[80px] flex flex-col justify-between ${className}`}>
      <div className={`text-sm font-bold ${getCardColor(card.suit)}`}>
        {card.rank}
      </div>
      <div className={`text-xl ${getCardColor(card.suit)} self-center`}>
        {getCardSymbol(card.suit)}
      </div>
      <div className={`text-sm font-bold ${getCardColor(card.suit)} self-end rotate-180`}>
        {card.rank}
      </div>
    </div>
  );
};

export default Card;