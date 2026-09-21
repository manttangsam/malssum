import { useState, useEffect, useCallback } from 'react';
import { DailyRecord, GoalSettings } from '../types/bible';
import { fireConfetti } from '../utils/confetti';

const STORAGE_KEY_RECORDS = 'bible_audio_records_v1';
const STORAGE_KEY_GOALS = 'bible_audio_goals_v1';
const STORAGE_KEY_STREAK = 'bible_audio_streak_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Play pleasant web audio chime sound on completion
function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const now = ctx.currentTime;
    
    // Note 1: E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Note 2: G#5
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(830.61, now + 0.15);
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 1.2);

    // Note 3: B5
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.frequency.setValueAtTime(987.77, now + 0.35);
    gain3.gain.setValueAtTime(0.25, now + 0.35);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.35);
    osc3.stop(now + 1.6);
  } catch (e) {
    // Audio context might be restricted before user interaction
  }
}

export function useBibleTracker(isActiveTimer: boolean = false) {
  const todayStr = getTodayDateString();

  const [records, setRecords] = useState<Record<string, DailyRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [goals, setGoals] = useState<GoalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOALS);
      return saved ? JSON.parse(saved) : { targetVerses: 15, targetChapters: 2 };
    } catch {
      return { targetVerses: 15, targetChapters: 2 };
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STREAK);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);

  // Today's record object
  const todayRecord: DailyRecord = records[todayStr] || {
    date: todayStr,
    versesReadCount: 0,
    completedChapters: [],
    readingSeconds: 0
  };

  // Timer tick for active reading time
  useEffect(() => {
    if (!isActiveTimer) return;

    const interval = setInterval(() => {
      setRecords(prev => {
        const current = prev[todayStr] || {
          date: todayStr,
          versesReadCount: 0,
          completedChapters: [],
          readingSeconds: 0
        };

        const updated: DailyRecord = {
          ...current,
          readingSeconds: current.readingSeconds + 1
        };

        const newRecords = { ...prev, [todayStr]: updated };
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
        return newRecords;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActiveTimer, todayStr]);

  // Record a verse completion
  const recordVerseRead = useCallback(() => {
    setRecords(prev => {
      const current = prev[todayStr] || {
        date: todayStr,
        versesReadCount: 0,
        completedChapters: [],
        readingSeconds: 0
      };

      const updated: DailyRecord = {
        ...current,
        versesReadCount: current.versesReadCount + 1
      };

      const newRecords = { ...prev, [todayStr]: updated };
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
      return newRecords;
    });
  }, [todayStr]);

  // Record a chapter completion
  const recordChapterCompleted = useCallback((chapterKey: string) => {
    setRecords(prev => {
      const current = prev[todayStr] || {
        date: todayStr,
        versesReadCount: 0,
        completedChapters: [],
        readingSeconds: 0
      };

      if (!current.completedChapters.includes(chapterKey)) {
        const updated: DailyRecord = {
          ...current,
          completedChapters: [...current.completedChapters, chapterKey]
        };

        const newRecords = { ...prev, [todayStr]: updated };
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
        return newRecords;
      }
      return prev;
    });
  }, [todayStr]);

  // Check goal achievement and trigger celebration
  useEffect(() => {
    if (hasCelebratedToday) return;

    const isGoalAchieved = todayRecord.versesReadCount >= goals.targetVerses;
    if (isGoalAchieved && todayRecord.versesReadCount > 0) {
      setHasCelebratedToday(true);
      playCompletionChime();
      fireConfetti();
    }
  }, [todayRecord.versesReadCount, goals.targetVerses, hasCelebratedToday]);

  // Update goals
  const updateGoals = (newGoals: GoalSettings) => {
    setGoals(newGoals);
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(newGoals));
  };

  return {
    todayRecord,
    records,
    goals,
    streak,
    recordVerseRead,
    recordChapterCompleted,
    updateGoals
  };
}
