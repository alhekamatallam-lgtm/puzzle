
import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, GameMode, Puzzle, PlayerScore } from './types';
import { fetchPuzzles } from './services/geminiService';
import { registerPlayer, postScore, registerHost } from './services/apiService';
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
const NUM_PUZZLES = 15;

/**
 * Sorts puzzles by alternating between 'ordering' and 'visual' types.
 * @param puzzles The array of puzzles to sort.
 * @returns A new array with puzzles interleaved by type.
 */
const sortPuzzlesAlternating = (puzzles: Puzzle[]): Puzzle[] => {
  const orderingPuzzles = puzzles.filter(p => p.type === 'ordering');
  const visualPuzzles = puzzles.filter(p => p.type === 'visual');
  const result: Puzzle[] = [];
  const maxLength = Math.max(orderingPuzzles.length, visualPuzzles.length);

  for (let i = 0; i < maxLength; i++) {
    if (orderingPuzzles[i]) {
      result.push(orderingPuzzles[i]);
    }
    if (visualPuzzles[i]) {
// FIX: Corrected typo from `visualPzzles` to `visualPuzzles`.
      result.push(visualPuzzles[i]);
    }
  }

  return result;
};


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('mode-select');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerPoints, setPlayerPoints] = useState(0);
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

  const updateLeaderboard = (name: string, points: number, time: number) => {
    const newScore: PlayerScore = { name, points, time };
    const newLeaderboard = [...leaderboard, newScore]
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points; // Higher points first
        }
        return a.time - b.time; // Lower time is better for tie-breaking
      })
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
    setPlayerPoints(0);
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
    try {
      const fetchedPuzzles = await fetchPuzzles(NUM_PUZZLES);
      setPuzzles(sortPuzzlesAlternating(fetchedPuzzles));
      setGameState('playing');
    } catch (error) {
       alert(`فشل بدء اللعبة: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: Replaced the `handleCreateParty` function which had a syntax error
  // (`.finally()` called on a `try-catch` block). The new version uses a
  // standard `try...catch...finally` block, which resolves the syntax error
  // and all subsequent scope-related errors.
  const handleCreateParty = async (name: string) => {
    setIsLoading(true);
    setPlayerName(name);
    setIsHost(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setPartyCode(code);
    try {
      // Register host in the central database. The lobby will pick up this record.
      await registerHost(name, code);
      // Use the party code as a seed for deterministic puzzles
      const fetchedPuzzles = await fetchPuzzles(NUM_PUZZLES, parseInt(code, 10));
      setPuzzles(sortPuzzlesAlternating(fetchedPuzzles));
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
        // Register the joining player in the central database.
        await registerPlayer(code, name);
        setPartyCode(code);
        const fetchedPuzzles = await fetchPuzzles(NUM_PUZZLES, parseInt(code, 10));
        setPuzzles(sortPuzzlesAlternating(fetchedPuzzles));
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

  const handleGameFinish = (points: number, time: number) => {
    setPlayerPoints(points);
    setPlayerTime(time);

    // Post score to the central database ONLY for party mode
    if (gameMode === 'party' && partyCode) {
      postScore(playerName, points, time, partyCode);
    }

    if (gameMode === 'solo') {
      updateLeaderboard(playerName, points, time);
      setGameState('finished');
    } else {
      // The results screen will poll the database directly.
      // No need to update local storage for party results anymore.
      setGameState('party-results');
    }
  };
  
  const handleGameOver = (points: number) => {
    setPlayerPoints(points);

    // When time runs out, the player's attempt is over. We record their score.
    // We use Infinity for time to indicate they did not finish within the limit.
    // This is consistent with how new players are registered before they post a final time.
    const finalTime = Infinity; 
    setPlayerTime(finalTime);

    // If in a party, post the final score and go to the live results screen.
    if (gameMode === 'party' && partyCode) {
      postScore(playerName, points, finalTime, partyCode);
      setGameState('party-results');
    } else {
      // In solo mode, just show the standard 'Game Over' screen.
      setGameState('gameOver');
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
        return <GameScreen puzzles={puzzles} onGameFinish={handleGameFinish} onGameOver={handleGameOver} />;
      case 'finished':
        return <LeaderboardScreen leaderboard={leaderboard} playerName={playerName} playerPoints={playerPoints} playerTime={playerTime} onPlayAgain={resetGame} gameMode={gameMode!} />;
      case 'party-results':
        return <PartyResultsScreen playerName={playerName} gameCode={partyCode} onPlayAgain={resetGame} />;
      case 'gameOver':
        return <GameOverScreen onPlayAgain={resetGame} playerPoints={playerPoints} />;
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
