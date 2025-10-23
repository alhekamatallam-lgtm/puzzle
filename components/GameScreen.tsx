

import React, { useState, useEffect, useRef } from 'react';
import type { Puzzle } from '../types';
import { TimerIcon } from './icons/TimerIcon';

interface GameScreenProps {
  puzzles: Puzzle[];
  onGameFinish: (time: number) => void;
  onGameOver: () => void;
}

const TOTAL_TIME = 120 * 1000; // 2 minutes for all puzzles

export const GameScreen: React.FC<GameScreenProps> = ({ puzzles, onGameFinish, onGameOver }) => {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);

  // Fix: Use 'number' for timer IDs in the browser environment instead of 'NodeJS.Timeout'.
  const timerRef = useRef<number | null>(null);
  const gameTimerRef = useRef<number | null>(null);

  useEffect(() => {
    gameTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = TOTAL_TIME - elapsed;
      if (remaining <= 0) {
        setTimeRemaining(0);
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        onGameOver();
      } else {
        setTimeRemaining(remaining);
      }
    }, 100);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onGameOver, startTime]);


  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return; // Prevent multiple clicks

    setSelectedOption(option);
    const correct = option === puzzles[currentPuzzleIndex].answer;
    setIsCorrect(correct);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (correct) {
        if (currentPuzzleIndex < puzzles.length - 1) {
          setCurrentPuzzleIndex(currentPuzzleIndex + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        } else {
          const endTime = Date.now();
          onGameFinish(endTime - startTime);
        }
      } else {
        // Allow retry after a short delay
        setSelectedOption(null);
        setIsCorrect(null);
      }
    }, 1000);
  };
  
  const getButtonClass = (option: string) => {
    if (selectedOption === null) {
      return 'bg-slate-700 hover:bg-slate-600';
    }
    if (option === selectedOption) {
      return isCorrect ? 'bg-green-500' : 'bg-red-500 animate-shake';
    }
    if (option === puzzles[currentPuzzleIndex].answer) {
        return 'bg-green-500';
    }
    return 'bg-slate-700 opacity-50';
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  if (!puzzles || puzzles.length === 0) {
    return <div className="text-center text-white">Loading puzzles...</div>;
  }

  const currentPuzzle = puzzles[currentPuzzleIndex];

  return (
    <div className="w-full max-w-3xl mx-auto p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <div className="text-xl font-bold text-slate-200">
          السؤال {currentPuzzleIndex + 1} / {puzzles.length}
        </div>
        <div className="flex items-center gap-2 text-2xl font-bold text-orange-400" style={{fontFamily: "'Orbitron', sans-serif"}}>
          <TimerIcon className="w-6 h-6" />
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      <div className="bg-slate-900/50 p-6 rounded-lg mb-8">
        <p className="text-2xl text-center font-cairo-bold text-slate-100 leading-relaxed">{currentPuzzle.clue}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentPuzzle.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            disabled={selectedOption !== null}
            className={`p-4 rounded-lg text-lg text-white font-medium text-center transition-all duration-300 ${getButtonClass(option)} disabled:cursor-not-allowed`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};