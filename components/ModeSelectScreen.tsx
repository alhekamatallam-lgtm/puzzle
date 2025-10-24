import React from 'react';
import type { GameMode } from '../types';
import { CollaborationIcon } from './icons/CollaborationIcon';
import { TargetIcon } from './icons/TargetIcon';
import { TrophyIcon } from './icons/TrophyIcon';

interface ModeSelectScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onViewDatabase: () => void;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({ onSelectMode, onViewDatabase }) => {
  return (
    <div className="w-full max-w-lg mx-auto p-6 sm:p-8 text-center">
      <div className="mx-auto mb-6 bg-white rounded-full p-3 w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center drop-shadow-[0_8px_16px_rgba(245,130,32,0.2)]">
        <img
          src="https://www.maathn.org.sa/rafed/uploads/website_partners/63184cff833ab.png"
          alt="شعار"
          className="w-full h-auto"
        />
      </div>
      <h1 className="text-3xl sm:text-4xl font-cairo-black text-slate-100 leading-tight">
        تحدي الألغاز<br /><span className="text-orange-400">الابتكارية</span>
      </h1>
      <p className="text-base sm:text-lg text-slate-300 mt-4 mb-10">اختر وضع اللعب الذي تفضله.</p>
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <button
          onClick={() => onSelectMode('solo')}
          className="w-full flex items-center justify-center gap-3 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 sm:py-4 text-center transition-all duration-300 transform hover:scale-105"
        >
          <TargetIcon className="w-7 h-7" />
          <span>لعب فردي</span>
        </button>
        <button
          onClick={() => onSelectMode('party')}
          className="w-full flex items-center justify-center gap-3 text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:outline-none focus:ring-teal-800 font-bold rounded-lg text-lg px-5 py-3 sm:py-4 text-center transition-all duration-300 transform hover:scale-105"
        >
          <CollaborationIcon className="w-7 h-7" />
          <span>لعب جماعي</span>
        </button>
         <button
          onClick={onViewDatabase}
          className="w-full flex items-center justify-center gap-3 text-white bg-slate-600 hover:bg-slate-700 focus:ring-4 focus:outline-none focus:ring-slate-800 font-bold rounded-lg text-lg px-5 py-3 sm:py-4 text-center transition-all duration-300 transform hover:scale-105 mt-4"
        >
          <TrophyIcon className="w-7 h-7" />
          <span>عرض كل النتائج</span>
        </button>
      </div>
    </div>
  );
};