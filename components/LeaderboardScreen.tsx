import React, { useState } from 'react';
import type { PlayerScore, GameMode } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';
import { ReplayIcon } from './icons/ReplayIcon';

interface LeaderboardScreenProps {
  leaderboard: PlayerScore[];
  playerName: string;
  playerTime: number;
  onPlayAgain: () => void;
  gameMode: GameMode;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ leaderboard, playerName, playerTime, onPlayAgain, gameMode }) => {
  const [copied, setCopied] = useState(false);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const getRankColor = (rank: number) => {
      switch(rank) {
          case 1: return 'text-amber-400';
          case 2: return 'text-slate-300';
          case 3: return 'text-amber-600';
          default: return 'text-slate-400';
      }
  }
  
  const handleShareScore = () => {
      const timeString = formatTime(playerTime);
      const textToCopy = `أنهيت تحدي الألغاز في ${timeString} ! 🎉 - ${playerName}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  }

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-cairo-black text-slate-100">اكتمل التحدي!</h1>
        <p className="text-slate-300 mt-2 text-base sm:text-lg">
          عمل رائع، <span className="font-bold text-orange-400">{playerName}</span>! وقتك النهائي هو:
        </p>
        <p className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-teal-500 my-4" style={{fontFamily: "'Orbitron', sans-serif"}}>
          {formatTime(playerTime)}
        </p>
      </div>

      {gameMode === 'solo' && (
        <div className="mb-8">
            <h2 className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-cairo-bold text-center mb-4 text-slate-200">
            <TrophyIcon className="w-7 h-7 text-amber-400" />
            لوحة الصدارة
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {leaderboard.map((score, index) => (
                    <div key={index} className={`flex justify-between items-center p-2 sm:p-3 rounded-lg ${score.name === playerName && score.time === playerTime ? 'bg-teal-600/50 border-teal-500 border' : 'bg-slate-700/50'}`}>
                        <div className="flex items-center gap-4">
                            <span className={`w-8 text-center text-lg sm:text-xl font-bold ${getRankColor(index + 1)}`}>{index + 1}</span>
                            <span className="text-base sm:text-lg font-medium text-slate-100">{score.name}</span>
                        </div>
                        <span className="text-base sm:text-lg font-bold text-slate-300" style={{fontFamily: "'Orbitron', sans-serif"}}>{formatTime(score.time)}</span>
                    </div>
                ))}
            </div>
        </div>
      )}
      
      {gameMode === 'party' && (
          <div className="mb-8">
              <button
                onClick={handleShareScore}
                className="w-full text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:outline-none focus:ring-teal-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300"
              >
                {copied ? 'تم النسخ!' : 'شارك نتيجتك'}
              </button>
          </div>
      )}
      
      <button
        onClick={onPlayAgain}
        className="w-full flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300 transform hover:scale-105"
      >
        <ReplayIcon className="w-6 h-6"/>
        العب مجدداً
      </button>
    </div>
  );
};