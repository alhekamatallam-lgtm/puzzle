import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { LoginIcon } from './icons/LoginIcon';

interface PartyModeSelectScreenProps {
  onCreate: () => void;
  onJoin: () => void;
}

export const PartyModeSelectScreen: React.FC<PartyModeSelectScreenProps> = ({ onCreate, onJoin }) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-cairo-black text-slate-100">وضع اللعب الجماعي</h1>
        <p className="text-slate-300 mt-2 text-sm sm:text-base">أنشئ غرفة جديدة وادعُ أصدقاءك، أو انضم إلى غرفة موجودة.</p>
      </div>
      <div className="flex flex-col gap-4">
        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-3 text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:outline-none focus:ring-teal-800 font-bold rounded-lg text-lg px-5 py-3 sm:py-4 text-center transition-all duration-300 transform hover:scale-105"
        >
            <SparklesIcon className="w-7 h-7" />
            <span>إنشاء غرفة</span>
        </button>
        <button
          onClick={onJoin}
          className="w-full flex items-center justify-center gap-3 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 sm:py-4 text-center transition-all duration-300 transform hover:scale-105"
        >
            <LoginIcon className="w-7 h-7" />
            <span>الانضمام لغرفة</span>
        </button>
      </div>
    </div>
  );
};
