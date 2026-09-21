import React, { useState } from 'react';
import { X, Flame, Clock, Award, Calendar, Target, CheckCircle } from './Icons';
import { DailyRecord, GoalSettings } from '../types/bible';
import { getTodayDateString } from '../hooks/useBibleTracker';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayRecord: DailyRecord;
  records: Record<string, DailyRecord>;
  goals: GoalSettings;
  streak: number;
  onUpdateGoals: (newGoals: GoalSettings) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  todayRecord,
  records,
  goals,
  streak,
  onUpdateGoals
}) => {
  const [targetInput, setTargetInput] = useState(goals.targetVerses);

  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const handleSaveGoal = () => {
    onUpdateGoals({
      ...goals,
      targetVerses: targetInput
    });
  };

  // Generate last 28 days calendar grid
  const daysArray = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const rec = records[dateStr];
    return {
      dateStr,
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      versesCount: rec ? rec.versesReadCount : 0
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 bg-custom border-custom font-sans max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-custom">
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold tracking-tight">성경 낭독 통계 & 목표</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">
              <Target className="w-4 h-4" />
              <span>오늘 읽은 구절</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
              {todayRecord.versesReadCount} <span className="text-sm font-normal text-amber-700 dark:text-amber-300">/ {goals.targetVerses}절</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300 text-xs font-semibold mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>연속 낭독 기록</span>
            </div>
            <div className="text-2xl font-extrabold text-orange-900 dark:text-orange-100">
              {streak} <span className="text-sm font-normal text-orange-700 dark:text-orange-300">일 연속</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
              <Clock className="w-4 h-4" />
              <span>오늘 낭독 시간</span>
            </div>
            <div className="text-xl font-extrabold text-blue-900 dark:text-blue-100">
              {formatTime(todayRecord.readingSeconds)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>완료한 성경 장</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">
              {todayRecord.completedChapters.length} <span className="text-sm font-normal text-emerald-700 dark:text-emerald-300">장 완료</span>
            </div>
          </div>
        </div>

        {/* Goal Setting Box */}
        <div className="p-4 rounded-2xl border bg-black/5 dark:bg-white/5 border-custom mb-5">
          <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
            <span>하루 낭독 목표 설정</span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold">{targetInput}절</span>
          </h3>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={targetInput}
              onChange={(e) => setTargetInput(Number(e.target.value))}
              className="flex-grow accent-amber-500 cursor-pointer"
            />
            <button
              onClick={handleSaveGoal}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition cursor-pointer"
            >
              목표 저장
            </button>
          </div>
        </div>

        {/* 28-day Activity Calendar */}
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>최근 28일 성경 낭독 잔디 (Activity)</span>
          </h3>

          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((day) => {
              const hasActivity = day.versesCount > 0;
              return (
                <div
                  key={day.dateStr}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 border text-xs transition ${
                    day.isToday ? 'ring-2 ring-amber-500 font-bold' : ''
                  } ${
                    hasActivity
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 border-transparent opacity-60'
                  }`}
                  title={`${day.dateStr}: ${day.versesCount}절 낭독`}
                >
                  <span className="text-[10px] opacity-80">{day.dayNum}</span>
                  {hasActivity && (
                    <span className="text-[9px] font-bold mt-0.5">{day.versesCount}절</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
