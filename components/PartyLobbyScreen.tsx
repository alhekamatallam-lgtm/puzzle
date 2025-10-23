import React, { useState } from 'react';
import { TargetIcon } from './icons/TargetIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface PartyLobbyScreenProps {
  gameCode: string;
  isHost: boolean;
  onStart: () => void;
}

export const PartyLobbyScreen: React.FC<PartyLobbyScreenProps> = ({ gameCode, isHost, onStart }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(gameCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

  return (
    <div className="w-full max-w-lg mx-auto p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 text-center">
        <SparklesIcon className="w-12 h-12 text-teal-400 mx-auto mb-4" />
        <h1 className="text-2xl sm:text-3xl font-cairo-black text-slate-100 mb-2">ردهة الانتظار</h1>
        <p className="text-slate-300 mb-6 text-sm sm:text-base">
            {isHost ? 'شارك الرمز التالي مع المتنافسين الآخرين!' : 'أنت في الغرفة! انتظر إشارة المضيف لبدء اللعبة.'}
        </p>

        <div className="mb-8">
            <p className="text-sm text-slate-400 mb-2">رمز الغرفة</p>
            <div className="flex items-center justify-center gap-2">
                <p 
                    className="text-3xl sm:text-4xl font-bold tracking-widest text-orange-400 p-3 bg-slate-900 rounded-lg"
                    style={{fontFamily: "'Orbitron', sans-serif"}}
                >
                    {gameCode}
                </p>
                {isHost && (
                    <button onClick={handleCopyCode} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                       {copied ? 'تم النسخ!' : '📋'}
                    </button>
                )}
            </div>
        </div>
        
        <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300 transform hover:scale-105"
        >
            <TargetIcon className="w-6 h-6"/>
            {isHost ? 'ابدأ اللعبة (للمضيف)' : 'أنا مستعد!'}
        </button>
    </div>
  );
};
