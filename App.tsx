import React, { useState, useEffect, useCallback } from 'react';
import { fetchPuzzles } from './services/geminiService';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { GameOverScreen } from './components/GameOverScreen';
import type { Puzzle, PlayerScore, GameState, GameMode } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ModeSelectScreen } from './components/ModeSelectScreen';
import { PartyLobbyScreen } from './components/PartyLobbyScreen';
import { JoinPartyScreen } from './components/JoinPartyScreen';
import { PartyModeSelectScreen } from './components/PartyModeSelectScreen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('mode-select');
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerTime, setPlayerTime] = useState(0);
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>(() => {
    try {
      const savedLeaderboard = localStorage.getItem('leaderboard');
      return savedLeaderboard ? JSON.parse(savedLeaderboard) : [];
    } catch (error) {
      console.error("Could not load leaderboard from localStorage", error);
      return [];
    }
  });
  const [gameCode, setGameCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  useEffect(() => {
    if (gameMode === 'solo') {
        try {
            localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        } catch (error) {
            console.error("Could not save leaderboard to localStorage", error);
        }
    }
  }, [leaderboard, gameMode]);

  const loadPuzzles = useCallback(async (seed?: number) => {
    setIsLoading(true);
    try {
      const fetchedPuzzles = await fetchPuzzles(5, seed);
      if (fetchedPuzzles.length > 0) {
        setPuzzles(fetchedPuzzles);
        return fetchedPuzzles;
      } else {
        console.error("Failed to fetch puzzles.");
      }
    } catch (error) {
      console.error("Error fetching puzzles:", error);
    } finally {
        setIsLoading(false);
    }
    return [];
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'solo') {
      setGameState('solo-name-entry');
    } else {
      setGameState('party-mode-select');
    }
  };

  const handleSelectCreateParty = () => {
    setGameState('create-party');
  };

  const handleSelectJoinParty = () => {
    setGameState('join-party');
  };

  const handleCreateParty = (name: string) => {
    setPlayerName(name);
    setIsHost(true);
    const newGameCode = String(Math.floor(1000 + Math.random() * 9000));
    setGameCode(newGameCode);
    setGameState('lobby');
  };
  
  const handleJoinParty = (name: string, code: string) => {
      setPlayerName(name);
      setIsHost(false);
      setGameCode(code);
      setGameState('lobby');
  };

  const handleStartGame = async () => {
    const seed = gameMode === 'party' ? parseInt(gameCode, 10) : undefined;
    await loadPuzzles(seed);
    setGameState('playing');
  };
  
  const handleSoloStart = (name: string) => {
      setPlayerName(name);
      handleStartGame();
  };

  const handleGameFinish = (time: number) => {
    setPlayerTime(time);
    if (gameMode === 'solo') {
        const newScore: PlayerScore = { name: playerName, time };
        const newLeaderboard = [...leaderboard, newScore]
            .sort((a, b) => a.time - b.time)
            .slice(0, 10);
        setLeaderboard(newLeaderboard);
    }
    setGameState('finished');
  };

  const handleGameOver = () => {
    setGameState('gameOver');
  };
  
  const handlePlayAgain = useCallback(() => {
    setGameState('mode-select');
    setPlayerName('');
    setGameCode('');
    setPuzzles([]);
    setIsHost(false);
  }, []);

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="text-center text-white">
              <SparklesIcon className="w-16 h-16 animate-pulse mx-auto mb-4 text-orange-400" />
              <p className="text-2xl font-cairo-bold">...جاري تحضير الألغاز</p>
            </div>
        );
    }

    switch (gameState) {
      case 'mode-select':
        return <ModeSelectScreen onSelectMode={handleModeSelect} />;
      case 'party-mode-select':
        return <PartyModeSelectScreen onCreate={handleSelectCreateParty} onJoin={handleSelectJoinParty} />;
      case 'create-party':
          return <StartScreen onStartGame={handleCreateParty} isPartyMode={true} />;
      case 'join-party':
          return <JoinPartyScreen onJoin={handleJoinParty} />;
      case 'solo-name-entry':
          return <StartScreen onStartGame={handleSoloStart} isPartyMode={false} />;
      case 'lobby':
          return <PartyLobbyScreen gameCode={gameCode} isHost={isHost} onStart={handleStartGame} />;
      case 'playing':
        return <GameScreen puzzles={puzzles} onGameFinish={handleGameFinish} onGameOver={handleGameOver} />;
      case 'finished':
        return <LeaderboardScreen leaderboard={leaderboard} playerName={playerName} playerTime={playerTime} onPlayAgain={handlePlayAgain} gameMode={gameMode}/>;
      case 'gameOver':
          return <GameOverScreen onPlayAgain={handlePlayAgain} />;
      default:
        return null;
    }
  };

  return (
    <div 
        className="min-h-screen text-white font-cairo-regular flex flex-col items-center justify-center p-4" 
        dir="rtl"
        style={{ background: 'radial-gradient(ellipse at center, #113054 0%, #0A192F 80%)' }}
    >
      <main className="z-10 w-full">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
