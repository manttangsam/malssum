import React from 'react';
import { Mic, Sun, Moon, Sparkles, BarChart3, Flame } from './Icons';
import { BIBLE_BOOKS } from '../data/bibleData';
import { ThemeMode } from '../types/bible';

interface HeaderProps {
  selectedBookId: string;
  selectedChapter: number;
  onSelectBook: (bookId: string) => void;
  onSelectChapter: (chapter: number) => void;
  theme: ThemeMode;
  onToggleTheme: (theme: ThemeMode) => void;
  streak: number;
  todayVersesRead: number;
  targetVerses: number;
  onOpenStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedBookId,
  selectedChapter,
  onSelectBook,
  onSelectChapter,
  theme,
  onToggleTheme,
  streak,
  todayVersesRead,
  targetVerses,
  onOpenStats
}) => {
  const currentBook = BIBLE_BOOKS.find(b => b.id === selectedBookId) || BIBLE_BOOKS[0];
  const progressPercent = Math.min(100, Math.round((todayVersesRead / targetVerses) * 100));

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-300 header-bg border-custom">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm flex items-center justify-center">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5 font-sans">
              성경 소리내기 <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">Voice Reader</span>
            </h1>
            <p className="text-xs opacity-75">소리 내어 읽은 구절만 자동으로 체크합니다</p>
          </div>
        </div>

        {/* Book & Chapter Selector Controls */}
        <div className="flex items-center space-x-2">
          {/* Book Select */}
          <select
            value={selectedBookId}
            onChange={(e) => onSelectBook(e.target.value)}
            className="px-3 py-1.5 rounded-lg border text-sm font-medium bg-custom cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-sm"
          >
            {BIBLE_BOOKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.testament === 'OT' ? '구약' : '신약'})
              </option>
            ))}
          </select>

          {/* Chapter Select */}
          <select
            value={selectedChapter}
            onChange={(e) => onSelectChapter(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border text-sm font-medium bg-custom cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-sm"
          >
            {Array.from({ length: currentBook.totalChapters }, (_, i) => i + 1).map((ch) => (
              <option key={ch} value={ch}>
                {ch}장
              </option>
            ))}
          </select>
        </div>

        {/* Status Pill & Theme Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Streak Badge */}
          <div 
            onClick={onOpenStats}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 cursor-pointer hover:scale-105 transition-transform"
            title="연속 성경 낭독 일수"
          >
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>{streak}일 연속</span>
          </div>

          {/* Today Goal Progress Bar Mini */}
          <button
            onClick={onOpenStats}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-custom hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="오늘의 낭독 달성도"
          >
            <div className="w-12 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="font-semibold">{todayVersesRead}/{targetVerses}절</span>
          </button>

          {/* Theme Selector Toggle */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 p-1 rounded-lg border border-custom">
            <button
              onClick={() => onToggleTheme('sepia')}
              className={`p-1.5 rounded-md text-xs font-semibold transition ${
                theme === 'sepia'
                  ? 'bg-amber-100 text-amber-900 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="따뜻한 세피아 모드"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleTheme('light')}
              className={`p-1.5 rounded-md text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="라이트 모드"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleTheme('dark')}
              className={`p-1.5 rounded-md text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="다크 모드"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="p-2 rounded-lg border bg-custom hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="상세 통계 및 캘린더"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
