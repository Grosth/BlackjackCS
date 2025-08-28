import React from 'react';
import { Player } from '../types/game';
import Card from './Card';
import { User, Bot } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  isActive: boolean;
  canHit: boolean;
  canStand: boolean;
  onHit: () => void;
  onStand: () => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isActive,
  canHit,
  canStand,
  onHit,
  onStand
}) => {
  const getStatusColor = () => {
    switch (player.status) {
      case 'blackjack': return 'text-red-600';
      case 'busted': return 'text-red-600';
      case 'standing': return 'text-black';
      default: return 'text-black';
    }
  };

  const getStatusText = () => {
    switch (player.status) {
      case 'blackjack': return 'BLACKJACK!';
      case 'busted': return 'BUSTED';
      case 'standing': return 'STANDING';
      default: return isActive ? 'YOUR TURN' : 'WAITING';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-300 ${
      isActive ? 'border-red-600 shadow-xl' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-full">
            {player.isAI ? (
              <Bot size={20} className="text-red-600" />
            ) : (
              <User size={20} className="text-black" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black">{player.name}</h3>
            <p className="text-xs text-red-600 font-semibold">{player.totalPoints} points</p>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-black">{player.score}</div>
          <div className="text-sm text-red-600">Score</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {player.hand.map((card, index) => (
          <Card
            key={`${card.suit}-${card.rank}-${index}`}
            card={card}
            className="transform hover:scale-105 transition-transform duration-200"
          />
        ))}
      </div>

      {isActive && player.status === 'playing' && (
        <div className="flex gap-3">
          <button
            onClick={onHit}
            disabled={!canHit}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Hit
          </button>
          <button
            onClick={onStand}
            disabled={!canStand}
            className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Stand
          </button>
        </div>
      )}
      
      {player.isAI && isActive && player.status === 'playing' && (
        <div className="text-center text-sm text-red-600 font-medium">
          AI is thinking...
        </div>
      )}
    </div>
  );
};

export default PlayerHand;