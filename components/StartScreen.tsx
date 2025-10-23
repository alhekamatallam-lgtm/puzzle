import React, { useState } from 'react';
import { TargetIcon } from './icons/TargetIcon';

interface StartScreenProps {
  onStartGame: (name: string) => void;
  isPartyMode: boolean;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, isPartyMode }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStartGame(name.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-cairo-black text-slate-100">
          {isPartyMode ? 'إنشاء غرفة لعب' : 'تحدي الألغاز الفردي'}
        </h1>
        <p className="text-slate-300 mt-2">
            {isPartyMode ? 'ستكون أنت المضيف لهذه الجولة.' : 'اختبر معلوماتك وسرعتك. هل أنت مستعد؟'}
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="playerName" className="block mb-2 text-sm font-medium text-slate-300">أدخل اسمك</label>
          <input
            type="text"
            id="playerName"
            className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5 placeholder-slate-400"
            placeholder="اللاعب"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={15}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <TargetIcon className="w-6 h-6" />
          {isPartyMode ? 'أنشئ الغرفة' : 'ابدأ التحدي'}
        </button>
      </form>
    </div>
  );
};