import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, GameMode, Puzzle, PlayerScore } from './types';
import { fetchPuzzles } from './services/geminiService';
import { registerPlayer, updateScore } from './services/apiService';
import { ModeSelectScreen } from './components/ModeSelectScreen';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { PartyModeSelectScreen } from './components/PartyModeSelectScreen';
import { JoinPartyScreen } from './components/JoinPartyScreen';
import { PartyLobbyScreen } from './components/PartyLobbyScreen';
import { PartyResultsScreen } from './components/PartyResultsScreen';
import { DatabaseViewScreen } from './components/DatabaseViewScreen';


const SOLO_LEADERBOARD_KEY = 'soloLeaderboard';
const NUM_PUZZLES = 10;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('mode-select');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerTime, setPlayerTime] = useState(0);
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Party Mode State
  const [partyCode, setPartyCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  

  const loadLeaderboard = useCallback(() => {
    try {
      const storedLeaderboard = localStorage.getItem(SOLO_LEADERBOARD_KEY);
      if (storedLeaderboard) {
        setLeaderboard(JSON.parse(storedLeaderboard));
      }
    } catch (error) {
      console.error("Failed to load leaderboard from localStorage", error);
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const updateLeaderboard = (name: string, time: number) => {
    const newScore = { name, time };
    const newLeaderboard = [...leaderboard, newScore]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);
    setLeaderboard(newLeaderboard);
    try {
      localStorage.setItem(SOLO_LEADERBOARD_KEY, JSON.stringify(newLeaderboard));
    } catch (error) {
        console.error("Failed to save leaderboard to localStorage", error);
    }
  };
  
  const resetGame = () => {
    setGameState('mode-select');
    setGameMode(null);
    setPuzzles([]);
    setPlayerName('');
    setPlayerTime(0);
    setIsLoading(false);
    setPartyCode('');
    setIsHost(false);
  };
  
  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'solo') {
      setGameState('solo-name-entry');
    } else {
      setGameState('party-mode-select');
    }
  };

  const handleStartSoloGame = async (name: string) => {
    setIsLoading(true);
    setPlayerName(name);
    const fetchedPuzzles = await fetchPuzzles(NUM_PUZZLES);
    setPuzzles(fetchedPuzzles);
    setIsLoading(false);
    setGameState('playing');
  };

  const handleCreateParty = async (name: string) => {
    setIsLoading(true);
    setPlayerName(name);
    setIsHost(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setPartyCode(code);
    try {
      await registerPlayer(code, name);
      // Use the party code as a seed for deterministic puzzles
      const fetchedPuzzles = await fetchPuzzles(NUM_PUZZLES, parseInt(code, 10));
      setPuzzles(fetchedPuzzles);
      setGameState('lobby');
    } catch (error) {
       alert(`فشل إنشاء الغرفة: ${(error as Error).message}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleJoinParty = async (name: string, code: string) => {
    setIsLoading(true);
    setPlayerName(name);
    setIsHost(false);
    try {
        await registerPlayer(code, name);
        setPartyCode(code);
        const fetchedPuzzles = await fetchPuzzles(NUM_PUZZLES, parseInt(code, 10));
        setPuzzles(fetchedPuzzles);
        setGameState('lobby');
    } catch (error) {
        alert(`فشل الانضمام: ${(error as Error).message}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleStartPartyGame = () => {
      setGameState('playing');
  }

  const handleGameFinish = (time: number) => {
    setPlayerTime(time);
    if (gameMode === 'solo') {
      updateLeaderboard(playerName, time);
      setGameState('finished');
    } else {
      updateScore(partyCode, playerName, time);
      setGameState('party-results');
    }
  };

  const renderGameState = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <p className="text-xl animate-pulse">...جاري تحضير الألغاز</p>
        </div>
      );
    }
    
    switch (gameState) {
      case 'mode-select':
        return <ModeSelectScreen onSelectMode={handleSelectMode} onViewDatabase={() => setGameState('database-view')} />;
      case 'solo-name-entry':
        return <StartScreen onStartGame={handleStartSoloGame} isPartyMode={false} />;
      case 'party-mode-select':
          return <PartyModeSelectScreen onCreate={() => setGameState('create-party')} onJoin={() => setGameState('join-party')} />;
      case 'create-party':
          return <StartScreen onStartGame={handleCreateParty} isPartyMode={true} />;
      case 'join-party':
          return <JoinPartyScreen onJoin={handleJoinParty} />;
      case 'lobby':
          return <PartyLobbyScreen gameCode={partyCode} isHost={isHost} onStart={handleStartPartyGame} />;
      case 'playing':
        return <GameScreen puzzles={puzzles} onGameFinish={handleGameFinish} onGameOver={() => setGameState('gameOver')} />;
      case 'finished':
        return <LeaderboardScreen leaderboard={leaderboard} playerName={playerName} playerTime={playerTime} onPlayAgain={resetGame} gameMode={gameMode!} />;
      case 'party-results':
        return <PartyResultsScreen playerName={playerName} gameCode={partyCode} onPlayAgain={resetGame} />;
      case 'gameOver':
        return <GameOverScreen onPlayAgain={resetGame} />;
      case 'database-view':
        return <DatabaseViewScreen onBack={resetGame} />;
      default:
        return null;
    }
  };

  return (
    <div 
        className="min-h-screen text-white font-cairo-regular flex flex-col items-center justify-center p-4 sm:p-6" 
        dir="rtl"
        style={{ background: 'radial-gradient(ellipse at center, #113054 0%, #0A192F 80%)' }}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full bg-no-repeat bg-center" 
        style={{backgroundImage: "url('https://res.cloudinary.com/pro-com/image/upload/v1634571932/bg-star_o5ikcu.png')", opacity: 0.3}}
      ></div>
      <main className="z-10 w-full">
        {renderGameState()}
      </main>
    </div>
  );
};

export default App;