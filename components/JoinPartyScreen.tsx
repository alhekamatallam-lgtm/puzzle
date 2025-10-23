import React, { useState } from 'react';
import { TargetIcon } from './icons/TargetIcon';

interface JoinPartyScreenProps {
  onJoin: (name: string, code: string) => void;
}

export const JoinPartyScreen: React.FC<JoinPartyScreenProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim()) {
      onJoin(name.trim(), code.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-cairo-black text-slate-100">الانضمام لغرفة لعب</h1>
        <p className="text-slate-300 mt-2 text-sm sm:text-base">أدخل اسمك ورمز الغرفة الذي حصلت عليه من المضيف.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="playerName" className="block mb-2 text-sm font-medium text-slate-300">اسمك</label>
          <input
            type="text"
            id="playerName"
            className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 placeholder-slate-400"
            placeholder="اللاعب"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={15}
          />
        </div>
        <div>
          <label htmlFor="gameCode" className="block mb-2 text-sm font-medium text-slate-300">رمز الغرفة</label>
          <input
            type="text"
            id="gameCode"
            className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 placeholder-slate-400 text-center"
            placeholder="1234"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            maxLength={4}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || !code.trim()}
          className="w-full flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <TargetIcon className="w-6 h-6" />
          انضم للعبة
        </button>
      </form>
    </div>
  );
};
