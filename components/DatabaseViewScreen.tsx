import React, { useState, useEffect } from 'react';
import { getAllScores } from '../services/apiService';
import type { PlayerScore } from '../types';
import { ReplayIcon } from './icons/ReplayIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrophyIcon } from './icons/TrophyIcon';

interface DatabaseViewScreenProps {
  onBack: () => void;
}

export const DatabaseViewScreen: React.FC<DatabaseViewScreenProps> = ({ onBack }) => {
  const [records, setRecords] = useState<PlayerScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const fetchedRecords = await getAllScores();
        setRecords(fetchedRecords);
      } catch (error) {
        console.error("Failed to fetch database records:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const formatTime = (ms: number) => {
    if (ms === Infinity || isNaN(ms)) return 'لم يكمل';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-cairo-black text-slate-100 flex items-center justify-center gap-3">
          <TrophyIcon className="w-8 h-8 text-amber-400" />
          سجل النتائج الكامل
        </h1>
        <p className="text-slate-400 mt-2">عرض جميع المحاولات المسجلة في قاعدة البيانات.</p>
      </div>

      <div className="mb-8 min-h-[300px] max-h-[50vh] overflow-auto rounded-lg border border-slate-700">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 h-full">
            <SparklesIcon className="w-8 h-8 animate-pulse mb-2" />
            <span>...جاري جلب السجلات</span>
          </div>
        ) : (
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-200 uppercase bg-slate-700/50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">رمز الغرفة</th>
                <th scope="col" className="px-6 py-3">اسم اللاعب</th>
                <th scope="col" className="px-6 py-3">الوقت</th>
                <th scope="col" className="px-6 py-3">المركز</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record, index) => (
                  <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-mono text-orange-400">{record.gaming || '-'}</td>
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{record.name}</td>
                    <td className="px-6 py-4 font-mono">{formatTime(record.time)}</td>
                    <td className="px-6 py-4">{record.place || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">لم يتم العثور على سجلات.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-800 font-bold rounded-lg text-lg px-5 py-3 text-center transition-all duration-300"
      >
        <ReplayIcon className="w-6 h-6 transform -scale-x-100" />
        العودة للقائمة الرئيسية
      </button>
    </div>
  );
};
