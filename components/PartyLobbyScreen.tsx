import React, { useState, useEffect } from 'react';
import { TargetIcon } from './icons/TargetIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { getLobbyPlayers } from '../services/apiService';
import { UsersIcon } from './icons/UsersIcon';

interface PartyLobbyScreenProps {
  gameCode: string;
  isHost: boolean;
  onStart: () => void;
}

export const PartyLobbyScreen: React.FC<PartyLobbyScreenProps> = ({ gameCode, isHost, onStart }) => {
    const [copied, setCopied] = useState(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const fetchedPlayers = await getLobbyPlayers(gameCode);
                setPlayers(fetchedPlayers);
            } catch (error) {
                console.error("Failed to fetch players:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlayers();
        const intervalId = setInterval(fetchPlayers, 3000);
        return () => clearInterval(intervalId);
    }, [gameCode]);

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
            شارك الرمز التالي مع المتنافسين، وانتظر انضمامهم لبدء التحدي!
        </p>

        <div className="mb-6">
            <p className="text-sm text-slate-400 mb-2">رمز الغرفة</p>
            <div className="flex items-center justify-center gap-2">
                <p 
                    className="text-3xl sm:text-4xl font-bold tracking-widest text-orange-400 p-3 bg-slate-900 rounded-lg"
                    style={{fontFamily: "'Orbitron', sans-serif"}}
                >
                    {gameCode}
                </p>
                <button onClick={handleCopyCode} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    {copied ? 'تم النسخ!' : '📋'}
                </button>
            </div>
        </div>

        <div className="mb-8 w-full">
            <h2 className="text-lg font-bold text-slate-300 mb-3 text-center flex items-center justify-center gap-2">
                <UsersIcon className="w-6 h-6" />
                المتنافسون ({players.length})
            </h2>
            <div className="bg-slate-900/50 rounded-lg p-3 min-h-[100px] max-h-40 overflow-y-auto">
                {isLoading ? (
                    <p className="text-slate-400 text-center pt-5">...جاري البحث عن لاعبين</p>
                ) : players.length > 0 ? (
                    <ul className="space-y-2">
                        {players.map((player, index) => (
                            <li key={index} className="text-white text-center bg-slate-700/50 p-2 rounded-md font-medium">{player}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 text-center pt-5">في انتظار انضمام اللاعبين...</p>
                )}
            </div>
        </div>
        
        <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300 transform hover:scale-105"
        >
            <TargetIcon className="w-6 h-6"/>
            {isHost ? 'ابدأ اللعبة للجميع' : 'ابدأ التحدي'}
        </button>
        <p className="text-xs text-slate-500 mt-2 px-4">
            {isHost ? 'عند الضغط على البدء، يجب على جميع اللاعبين الضغط على زر البدء أيضًا.' : 'انتظر إشارة المضيف ثم اضغط على زر البدء.'}
        </p>
    </div>
  );
};