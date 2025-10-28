import React, { useState, useMemo, useEffect } from 'react';
import type { PlayerScore } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';
import { ReplayIcon } from './icons/ReplayIcon';
import { getScores } from '../services/apiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface PartyResultsScreenProps {
  playerName: string;
  gameCode: string;
  onPlayAgain: () => void;
}

export const PartyResultsScreen: React.FC<PartyResultsScreenProps> = ({ playerName, gameCode, onPlayAgain }) => {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const fetchedScores = await getScores(gameCode);
        setScores(fetchedScores);
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores(); // Initial fetch

    const intervalId = setInterval(fetchScores, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [gameCode]);


  const sortedScores = useMemo(() => {
    return [...scores].sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points; // Higher points first
        }
        return a.time - b.time; // Lower time is better for tie-breaking
    });
  }, [scores]);

  const formatTime = (ms: number) => {
    if (ms === Infinity) return '-';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secondsValue = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secondsValue}`;
  };
  
  const getRankColor = (rank: number) => {
      switch(rank) {
          case 1: return 'text-amber-400';
          case 2: return 'text-slate-300';
          case 3: return 'text-amber-600';
          default: return 'text-slate-400';
      }
  }

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-cairo-black text-slate-100">النتائج المباشرة</h1>
        <p className="text-slate-400 mt-2">رمز اللعبة: <span className="font-bold text-orange-400">{gameCode}</span></p>
      </div>

      <div className="mb-6 min-h-[200px]">
        <h2 className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-cairo-bold text-center mb-4 text-slate-200">
          <TrophyIcon className="w-7 h-7 text-amber-400" />
          لوحة الصدارة
        </h2>
        {isLoading ? (
            <div className="flex flex-col items-center justify-center text-slate-400">
                <SparklesIcon className="w-8 h-8 animate-pulse mb-2"/>
                <span>...جاري جلب النتائج</span>
            </div>
        ) : scores.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
            {sortedScores.map((score, index) => {
                const isWinner = index === 0 && !isLoading;
                const rowClasses = `flex justify-between items-center p-3 rounded-lg opacity-0 animate-fade-in-up ${score.name === playerName ? 'bg-teal-600/50 border-teal-500 border' : 'bg-slate-700/50'} ${isWinner ? 'shadow-[0_0_15px_rgba(251,191,36,0.4)] border border-amber-400/50' : ''}`;
                return (
                    <div 
                        key={index} 
                        className={rowClasses}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 text-center text-lg font-bold flex items-center justify-center gap-1.5 ${getRankColor(index + 1)}`}>
                                {isWinner && <TrophyIcon className="w-5 h-5" />}
                                <span>{score.place || index + 1}</span>
                            </div>
                            <span className="text-lg font-medium text-slate-100">{score.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-lg font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                          <span className="text-teal-400 w-20 text-right">{score.points} pts</span>
                          <span className="text-slate-300 w-24 text-right">{formatTime(score.time)}</span>
                        </div>
                    </div>
                );
            })}
            </div>
        ) : (
            <p className="text-center text-slate-400 pt-8">في انتظار انتهاء بقية اللاعبين...</p>
        )}
      </div>

      <button
        onClick={onPlayAgain}
        className="w-full flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300 transform hover:scale-105 mt-8"
      >
        <ReplayIcon className="w-6 h-6"/>
        العب مجدداً
      </button>
    </div>
  );
};