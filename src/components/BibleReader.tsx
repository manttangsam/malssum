import React, { useRef, useEffect } from 'react';
import { CheckCircle2, Mic, Plus, Minus, ArrowRight } from './Icons';
import { Chapter, Verse } from '../types/bible';

interface BibleReaderProps {
  chapter: Chapter;
  activeVerseIndex: number;
  matchedVerseIds: Set<string>;
  isListening: boolean;
  matchPercentage: number;
  onVerseClick: (index: number) => void;
  onManualVerseComplete: (verseId: string) => void;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const BibleReader: React.FC<BibleReaderProps> = ({
  chapter,
  activeVerseIndex,
  matchedVerseIds,
  isListening,
  matchPercentage,
  onVerseClick,
  onManualVerseComplete,
  fontSize,
  setFontSize,
  onNextChapter,
  onPrevChapter
}) => {
  const verseRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto scroll active verse into viewport center smoothly
  useEffect(() => {
    if (activeVerseIndex >= 0 && verseRefs.current[activeVerseIndex]) {
      verseRefs.current[activeVerseIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeVerseIndex]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-36 font-serif leading-relaxed">
      {/* Chapter Title Bar */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-custom">
        <div>
          <h2 className="text-2xl font-bold font-sans tracking-tight">
            {chapter.bookName} {chapter.chapter}장
          </h2>
          <p className="text-xs opacity-70 font-sans mt-0.5">
            총 {chapter.verses.length}절 · 음성 인식 낭독 모드
          </p>
        </div>

        {/* Font Size Adjusters */}
        <div className="flex items-center space-x-1 font-sans text-xs bg-custom p-1 rounded-lg border border-custom">
          <button
            onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="글자 크기 축소"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-semibold">{fontSize}px</span>
          <button
            onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="글자 크기 확대"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Verses List */}
      <div className="space-y-4">
        {chapter.verses.map((verse: Verse, idx: number) => {
          const isCompleted = matchedVerseIds.has(verse.id);
          const isActive = idx === activeVerseIndex;

          return (
            <div
              key={verse.id}
              ref={el => (verseRefs.current[idx] = el)}
              onClick={() => onVerseClick(idx)}
              className={`relative group p-4 rounded-xl transition-all duration-300 border cursor-pointer ${
                isActive
                  ? 'ring-2 ring-amber-500/70 bg-amber-500/10 shadow-md border-amber-500/30'
                  : isCompleted
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Verse Number & Status Icon */}
                <div className="flex-shrink-0 flex items-center justify-center pt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isActive ? (
                    <div className="relative">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold font-sans flex items-center justify-center">
                        {verse.verse}
                      </span>
                      {isListening && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-sans font-bold opacity-40 px-1">
                      {verse.verse}
                    </span>
                  )}
                </div>

                {/* Verse Text */}
                <div className="flex-grow">
                  <p
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
                    className={`${
                      isCompleted ? 'opacity-90 font-medium' : 'font-normal'
                    }`}
                  >
                    {verse.text}
                  </p>

                  {/* Active Verse Speech Match Feedback Bar */}
                  {isActive && (
                    <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between font-sans text-xs">
                      <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 font-semibold">
                        <Mic className="w-3.5 h-3.5 animate-pulse" />
                        <span>소리 내어 읽어주세요...</span>
                        {matchPercentage > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
                            인식률 {matchPercentage}%
                          </span>
                        )}
                      </div>

                      {/* Manual Complete Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onManualVerseComplete(verse.id);
                        }}
                        className="px-2 py-1 rounded bg-amber-500 text-white font-semibold text-[11px] hover:bg-amber-600 transition shadow-sm"
                      >
                        읽기 완료 처리
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chapter Completion Next Navigation */}
      <div className="mt-10 pt-6 border-t border-custom flex items-center justify-between font-sans">
        {onPrevChapter ? (
          <button
            onClick={onPrevChapter}
            className="px-4 py-2 rounded-xl border font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            이전 장
          </button>
        ) : <div />}

        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition shadow-md flex items-center space-x-1.5"
          >
            <span>다음 장 읽기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </main>
  );
};
