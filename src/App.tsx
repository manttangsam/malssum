import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BibleReader } from './components/BibleReader';
import { ControlBar } from './components/ControlBar';
import { StatsModal } from './components/StatsModal';
import { useSpeechToText } from './hooks/useSpeechToText';
import { useBibleTracker } from './hooks/useBibleTracker';
import { getChapterData, BIBLE_BOOKS } from './data/bibleData';
import { ThemeMode } from './types/bible';

export function App() {
  const [selectedBookId, setSelectedBookId] = useState<string>('gen');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('bible_audio_theme') as ThemeMode) || 'sepia';
  });
  const [fontSize, setFontSize] = useState<number>(19);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Load current chapter content
  const currentChapterData = getChapterData(selectedBookId, selectedChapter);

  // Sync theme class to body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('bible_audio_theme', theme);
  }, [theme]);

  // Speech to Text hook
  const {
    isListening,
    isSimulating,
    transcript,
    interimTranscript,
    activeVerseIndex,
    setActiveVerseIndex,
    matchedVerseIds,
    matchPercentage,
    error,
    startListening,
    stopListening,
    startSimulation,
    markVerseComplete
  } = useSpeechToText({
    currentChapterVerses: currentChapterData.verses,
    onVerseCompleted: () => {
      recordVerseRead();
    },
    onChapterCompleted: () => {
      recordChapterCompleted(`${selectedBookId}_${selectedChapter}`);
    }
  });

  // Reading Tracker hook
  const {
    todayRecord,
    records,
    goals,
    streak,
    recordVerseRead,
    recordChapterCompleted,
    updateGoals
  } = useBibleTracker(isListening || isSimulating);

  // Toggle Microphone Listening
  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Chapter Navigation
  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setSelectedChapter(1);
    setActiveVerseIndex(0);
  };

  const handleSelectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setActiveVerseIndex(0);
  };

  const handleNextChapter = useCallback(() => {
    const book = BIBLE_BOOKS.find(b => b.id === selectedBookId);
    if (!book) return;

    if (selectedChapter < book.totalChapters) {
      setSelectedChapter(prev => prev + 1);
      setActiveVerseIndex(0);
    } else {
      // Find next book
      const currentBookIdx = BIBLE_BOOKS.findIndex(b => b.id === selectedBookId);
      if (currentBookIdx < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentBookIdx + 1];
        setSelectedBookId(nextBook.id);
        setSelectedChapter(1);
        setActiveVerseIndex(0);
      }
    }
  }, [selectedBookId, selectedChapter, setActiveVerseIndex]);

  const handlePrevChapter = useCallback(() => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
      setActiveVerseIndex(0);
    } else {
      const currentBookIdx = BIBLE_BOOKS.findIndex(b => b.id === selectedBookId);
      if (currentBookIdx > 0) {
        const prevBook = BIBLE_BOOKS[currentBookIdx - 1];
        setSelectedBookId(prevBook.id);
        setSelectedChapter(prevBook.totalChapters);
        setActiveVerseIndex(0);
      }
    }
  }, [selectedBookId, selectedChapter, setActiveVerseIndex]);

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Header Bar */}
      <Header
        selectedBookId={selectedBookId}
        selectedChapter={selectedChapter}
        onSelectBook={handleSelectBook}
        onSelectChapter={handleSelectChapter}
        theme={theme}
        onToggleTheme={setTheme}
        streak={streak}
        todayVersesRead={todayRecord.versesReadCount}
        targetVerses={goals.targetVerses}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Main Bible Reader View */}
      <BibleReader
        chapter={currentChapterData}
        activeVerseIndex={activeVerseIndex}
        matchedVerseIds={matchedVerseIds}
        isListening={isListening}
        matchPercentage={matchPercentage}
        onVerseClick={(idx) => setActiveVerseIndex(idx)}
        onManualVerseComplete={(verseId) => markVerseComplete(verseId)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onNextChapter={handleNextChapter}
        onPrevChapter={selectedChapter > 1 ? handlePrevChapter : undefined}
      />

      {/* Floating Bottom Control Bar */}
      <ControlBar
        isListening={isListening}
        isSimulating={isSimulating}
        transcript={transcript}
        interimTranscript={interimTranscript}
        error={error}
        onToggleListening={handleToggleListening}
        onToggleSimulation={startSimulation}
        onSkipVerse={() => {
          if (activeVerseIndex < currentChapterData.verses.length) {
            markVerseComplete(currentChapterData.verses[activeVerseIndex].id);
          }
        }}
        theme={theme}
      />

      {/* Statistics Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        todayRecord={todayRecord}
        records={records}
        goals={goals}
        streak={streak}
        onUpdateGoals={updateGoals}
      />
    </div>
  );
}

export default App;
