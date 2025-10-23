import React from 'react';
import { ReplayIcon } from './icons/ReplayIcon';
import { TimeUpIcon } from './icons/TimeUpIcon';

interface GameOverScreenProps {
    onPlayAgain: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ onPlayAgain }) => {
    return (
        <div className="w-full max-w-md mx-auto p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 text-center">
            <TimeUpIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-cairo-black text-slate-100 mb-2">انتهى الوقت!</h1>
            <p className="text-slate-300 mb-8">
                حظاً أوفر في المرة القادمة. هل تريد المحاولة مرة أخرى؟
            </p>
            
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