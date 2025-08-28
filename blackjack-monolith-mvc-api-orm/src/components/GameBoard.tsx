import React, { useState, useEffect } from 'react';
import { GameState, Player } from '../types/game';
import { 
  createDeck, 
  dealInitialCards, 
  calculateScore, 
  determineWinners,
  makeAIDecision
} from '../utils/gameLogic';
import PlayerHand from './PlayerHand';
import { Users, RotateCcw, Trophy, Play, Bot } from 'lucide-react';

const GameBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    deck: [],
    currentPlayerIndex: 0,
    gamePhase: 'setup',
    winner: null,
    winners: [],
    currentRound: 1,
    totalRounds: 1,
    targetPoints: 10
  });

  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [targetPoints, setTargetPoints] = useState(10);
  const [includeAI, setIncludeAI] = useState(false);

  useEffect(() => {
    setPlayerNames(Array.from({ length: numPlayers }, (_, i) => `Player ${i + 1}`));
  }, [numPlayers]);

  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.players[gameState.currentPlayerIndex]?.isAI) {
      const timer = setTimeout(() => {
        handleAITurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayerIndex, gameState.gamePhase]);

  const initializeGame = () => {
    const players: Player[] = Array.from({ length: numPlayers }, (_, i) => {
      const isAI = includeAI && i === numPlayers - 1;
      return {
      id: i + 1,
      name: isAI ? 'AI Player' : playerNames[i],
      hand: [],
      score: 0,
      totalPoints: 0,
      status: 'playing',
      isActive: i === 0,
      isAI
      };
    });

    const deck = createDeck();
    const { updatedPlayers, updatedDeck } = dealInitialCards(players, deck);

    setGameState({
      players: updatedPlayers,
      deck: updatedDeck,
      currentPlayerIndex: 0,
      gamePhase: 'playing',
      winner: null,
      winners: [],
      currentRound: 1,
      totalRounds: Math.ceil(targetPoints / 10),
      targetPoints
    });
  };

  const handleAITurn = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer?.isAI || currentPlayer.status !== 'playing') return;

    const otherPlayers = gameState.players.filter((_, i) => i !== gameState.currentPlayerIndex);
    const decision = makeAIDecision(currentPlayer, otherPlayers);

    if (decision === 'hit') {
      handleHit();
    } else {
      handleStand();
    }
  };

  const handleHit = () => {
    if (gameState.gamePhase !== 'playing') return;

    const newDeck = [...gameState.deck];
    const newPlayers = [...gameState.players];
    const currentPlayer = newPlayers[gameState.currentPlayerIndex];

    if (newDeck.length === 0 || currentPlayer.status !== 'playing') return;

    const newCard = newDeck.pop()!;
    currentPlayer.hand.push(newCard);
    currentPlayer.score = calculateScore(currentPlayer.hand);

    if (currentPlayer.score > 21) {
      currentPlayer.status = 'busted';
      nextPlayer(newPlayers);
    }

    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      deck: newDeck
    }));
  };

  const handleStand = () => {
    if (gameState.gamePhase !== 'playing') return;

    const newPlayers = [...gameState.players];
    newPlayers[gameState.currentPlayerIndex].status = 'standing';
    
    nextPlayer(newPlayers);

    setGameState(prev => ({
      ...prev,
      players: newPlayers
    }));
  };

  const nextPlayer = (players: Player[]) => {
    let nextIndex = gameState.currentPlayerIndex + 1;
    
    // Find next player who can still play
    while (nextIndex < players.length) {
      if (players[nextIndex].status === 'playing') {
        players.forEach((p, i) => p.isActive = i === nextIndex);
        setGameState(prev => ({ ...prev, currentPlayerIndex: nextIndex }));
        return;
      }
      nextIndex++;
    }

    // No more players can play, end game
    endGame(players);
  };

  const endGame = (players: Player[]) => {
    const winners = determineWinners(players);
    players.forEach(p => p.isActive = false);
    
    // Update points
    const updatedPlayers = players.map(player => {
      const isWinner = winners.some(w => w.id === player.id);
      const pointChange = isWinner ? 10 : -5;
      return {
        ...player,
        totalPoints: Math.max(0, player.totalPoints + pointChange)
      };
    });

    // Check if game should continue or end
    const hasWinner = updatedPlayers.some(p => p.totalPoints >= targetPoints);
    const maxRounds = Math.ceil(targetPoints / 5); // Maximum possible rounds
    const isMaxRounds = gameState.currentRound >= maxRounds;
    
    setGameState(prev => ({
      ...prev,
      gamePhase: hasWinner || isMaxRounds ? 'gameFinished' : 'roundFinished',
      winners,
      players: updatedPlayers
    }));
  };

  const nextRound = () => {
    const players: Player[] = gameState.players.map(player => ({
      ...player,
      hand: [],
      score: 0,
      status: 'playing',
      isActive: player.id === 1
    }));

    const deck = createDeck();
    const { updatedPlayers, updatedDeck } = dealInitialCards(players, deck);

    setGameState(prev => ({
      ...prev,
      players: updatedPlayers,
      deck: updatedDeck,
      currentPlayerIndex: 0,
      gamePhase: 'playing',
      currentRound: prev.currentRound + 1,
      winners: []
    }));
  };

  const resetGame = () => {
    setGameState({
      players: [],
      deck: [],
      currentPlayerIndex: 0,
      gamePhase: 'setup',
      winner: null,
      winners: [],
      currentRound: 1,
      totalRounds: Math.ceil(targetPoints / 10),
      targetPoints: 10
    });
    setTargetPoints(10);
    setPlayerNames(Array.from({ length: numPlayers }, (_, i) => `Player ${i + 1}`));
  };

  const getGameWinner = () => {
    const maxPoints = Math.max(...gameState.players.map(p => p.totalPoints));
    return gameState.players.filter(p => p.totalPoints === maxPoints);
  };

  if (gameState.gamePhase === 'setup') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full border-2 border-red-600">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">♠ BLACKJACK ♥</h1>
            <p className="text-red-600 font-semibold">Multiplayer Competition</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-black mb-3">
              Number of Players
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setNumPlayers(num)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 ${
                    numPlayers === num
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-black mb-3">
              Points to Win
            </label>
            <div className="flex gap-2">
              {[10, 20, 30, 40, 50].map(num => (
                <button
                  key={num}
                  onClick={() => setTargetPoints(num)}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                    targetPoints === num
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-red-600 mt-2">
              Win: +10 points, Lose: -5 points
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-semibold text-black flex items-center gap-2">
                <Bot size={16} className="text-red-600" />
                Include AI Player
              </span>
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-black mb-3">
              Player Names
            </label>
            <div className="space-y-2">
              {playerNames.map((name, index) => {
                const isAI = includeAI && index === numPlayers - 1;
                return (
                  <input
                    key={index}
                    type="text"
                    value={isAI ? 'AI Player' : name}
                    onChange={(e) => {
                      if (!isAI) {
                        const newNames = [...playerNames];
                        newNames[index] = e.target.value;
                        setPlayerNames(newNames);
                      }
                    }}
                    disabled={isAI}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isAI ? 'bg-red-50 text-red-700' : ''
                    }`}
                    placeholder={`Player ${index + 1} name`}
                  />
                );
              })}
            </div>
          </div>

          <button
            onClick={initializeGame}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <Play size={20} />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">♠ BLACKJACK ♥</h1>
          <div className="flex items-center justify-center gap-6 text-white">
            <span className="flex items-center gap-2">
              Round {gameState.currentRound} of {gameState.totalRounds}
            </span>
            <span className="flex items-center gap-2">
              <Users size={20} />
              {gameState.players.length} Players
            </span>
            <span className="text-sm">
              Target: {targetPoints} points
            </span>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <RotateCcw size={16} />
              New Game
            </button>
          </div>
        </div>

        {gameState.gamePhase === 'roundFinished' && gameState.winners.length > 0 && (
          <div className="bg-gradient-to-r from-red-100 to-red-200 border border-red-300 rounded-xl p-6 mb-8">
            <div className="text-center">
              <Trophy className="mx-auto mb-3 text-red-600" size={32} />
              <h2 className="text-2xl font-bold text-red-800 mb-2">
                Round {gameState.currentRound} Winner{gameState.winners.length > 1 ? 's' : ''}!
              </h2>
              <div className="text-lg text-red-700 mb-4">
                {gameState.winners.map(winner => winner.name).join(', ')}
                {gameState.winners.length === 1 
                  ? ` wins with ${gameState.winners[0].score}! (+10 points)`
                  : ` tie with ${gameState.winners[0].score}! (+10 points each)`
                }
              </div>
              <button
                onClick={nextRound}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Next Round
              </button>
            </div>
          </div>
        )}

        {gameState.gamePhase === 'gameFinished' && (
          <div className="bg-gradient-to-r from-red-100 to-white border border-red-300 rounded-xl p-6 mb-8">
            <div className="text-center">
              <Trophy className="mx-auto mb-3 text-red-600" size={32} />
              <h2 className="text-2xl font-bold text-black mb-2">
                Game Over! {getGameWinner().length === 1 ? 'Champion!' : 'Champions!'}
              </h2>
              <div className="text-lg text-red-700">
                {getGameWinner().map(winner => winner.name).join(', ')}
                {getGameWinner().length === 1 
                  ? ` wins with ${getGameWinner()[0].totalPoints} points!`
                  : ` tie with ${getGameWinner()[0].totalPoints} points!`
                }
              </div>
              <button
                onClick={resetGame}
                className="mt-4 bg-black hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${
          gameState.players.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
          gameState.players.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          gameState.players.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {gameState.players.map((player, index) => (
            <PlayerHand
              key={player.id}
              player={player}
              isActive={player.isActive && gameState.gamePhase === 'playing'}
              canHit={gameState.gamePhase === 'playing' && player.status === 'playing'}
              canStand={gameState.gamePhase === 'playing' && player.status === 'playing'}
              onHit={handleHit}
              onStand={handleStand}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;