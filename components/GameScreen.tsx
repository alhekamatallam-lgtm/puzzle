import React, { useState, useEffect, useRef } from 'react';
import type { Puzzle, OrderingPuzzle, VisualPuzzle } from '../types';
import { TimerIcon } from './icons/TimerIcon';
import { IdeaIcon } from './icons/IdeaIcon';
import { GrowthIcon } from './icons/GrowthIcon';
import { CollaborationIcon } from './icons/CollaborationIcon';
import { DataIcon } from './icons/DataIcon';
import { TargetIcon } from './icons/TargetIcon';

interface GameScreenProps {
  puzzles: Puzzle[];
  onGameFinish: (time: number) => void;
  onGameOver: () => void;
}

const TOTAL_TIME = 120 * 1000; // 2 minutes for all puzzles

const iconMap: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  IdeaIcon,
  GrowthIcon,
  CollaborationIcon,
  DataIcon,
  TargetIcon,
};

export const GameScreen: React.FC<GameScreenProps> = ({ puzzles, onGameFinish, onGameOver }) => {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [isWrong, setIsWrong] = useState(false);

  // State for Ordering Puzzle
  const [orderedSteps, setOrderedSteps] = useState<string[]>([]);
  
  // State for Visual Puzzle
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const gameTimerRef = useRef<number | null>(null);
  
  const currentPuzzle = puzzles[currentPuzzleIndex];

  useEffect(() => {
    if (currentPuzzle?.type === 'ordering') {
      setOrderedSteps(currentPuzzle.shuffled);
    } else {
        setSelectedIcon(null);
        setIsCorrect(null);
    }
  }, [currentPuzzleIndex, currentPuzzle]);
  

  useEffect(() => {
    gameTimerRef.current = window.setInterval(() => {
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onGameOver, startTime]);

  const goToNextPuzzle = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
      setIsWrong(false);
    } else {
      const endTime = Date.now();
      onGameFinish(endTime - startTime);
    }
  };

  // --- Ordering Puzzle Logic ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('draggedIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    const draggedIndex = parseInt(e.dataTransfer.getData('draggedIndex'), 10);
    const newSteps = [...orderedSteps];
    const [draggedItem] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(dropIndex, 0, draggedItem);
    setOrderedSteps(newSteps);
  };

  const handleSubmitOrder = () => {
    const correctOrder = (currentPuzzle as OrderingPuzzle).steps;
    if (JSON.stringify(orderedSteps) === JSON.stringify(correctOrder)) {
      goToNextPuzzle();
    } else {
      setIsWrong(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setIsWrong(false), 500);
    }
  };
  
  // --- Visual Puzzle Logic ---
  const handleIconClick = (iconName: string) => {
    if (selectedIcon) return;

    const puzzle = currentPuzzle as VisualPuzzle;
    setSelectedIcon(iconName);
    const correct = iconName === puzzle.answer;
    setIsCorrect(correct);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (correct) {
        goToNextPuzzle();
      } else {
        setSelectedIcon(null);
        setIsCorrect(null);
      }
    }, 1000);
  };

  const getIconClass = (iconName: string) => {
    if (!selectedIcon) return 'bg-slate-700 hover:bg-slate-600';
    if (iconName === selectedIcon) {
        return isCorrect ? 'bg-green-500 scale-110' : 'bg-red-500 animate-shake';
    }
    if (iconName === (currentPuzzle as VisualPuzzle).answer) {
        return 'bg-green-500';
    }
    return 'bg-slate-700 opacity-50';
  }


  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  if (!puzzles || puzzles.length === 0 || !currentPuzzle) {
    return <div className="text-center text-white">Loading puzzles...</div>;
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <div className="text-base sm:text-xl font-bold text-slate-200">
          السؤال {currentPuzzleIndex + 1} / {puzzles.length}
        </div>
        <div className={`flex items-center gap-2 text-xl sm:text-2xl font-bold ${timeRemaining < 10000 ? 'text-red-500' : 'text-orange-400'}`} style={{fontFamily: "'Orbitron', sans-serif"}}>
          <TimerIcon className="w-6 h-6" />
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      {currentPuzzle.type === 'ordering' && (
        <div>
          <div className="bg-slate-900/50 p-4 sm:p-6 rounded-lg mb-8">
            <p className="text-xl sm:text-2xl text-center font-cairo-bold text-slate-100 leading-relaxed">رتب الخطوات التالية بالترتيب الصحيح:<br/> <span className="text-teal-400">{currentPuzzle.title}</span></p>
          </div>
          <div className="space-y-3">
            {orderedSteps.map((step, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
                className={`p-3 text-base sm:p-4 sm:text-lg rounded-lg text-white font-medium text-center cursor-grab active:cursor-grabbing bg-slate-700 flex items-center justify-center transition-transform duration-300 ${isWrong ? 'animate-shake' : ''}`}
              >
                {step}
              </div>
            ))}
          </div>
          <button onClick={handleSubmitOrder} className="mt-8 w-full text-white bg-orange-600 hover:bg-orange-700 font-bold rounded-lg text-lg px-5 py-3 text-center">
            تحقق من الترتيب
          </button>
        </div>
      )}

      {currentPuzzle.type === 'visual' && (
        <div>
          <div className="bg-slate-900/50 p-4 sm:p-6 rounded-lg mb-8">
            <p className="text-xl sm:text-2xl text-center font-cairo-bold text-slate-100 leading-relaxed">{currentPuzzle.question}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentPuzzle.options.map((iconName) => {
                const Icon = iconMap[iconName];
                return (
                    <button
                        key={iconName}
                        onClick={() => handleIconClick(iconName)}
                        disabled={!!selectedIcon}
                        className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-300 ${getIconClass(iconName)}`}
                    >
                        {Icon && <Icon className="w-14 h-14 sm:w-16 sm:h-16 text-white" />}
                    </button>
                )
            })}
          </div>
        </div>
      )}
    </div>
  );
};
