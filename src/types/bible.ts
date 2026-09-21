export type ThemeMode = 'sepia' | 'dark' | 'light';

export interface Verse {
  id: string; // e.g. "gen_1_1"
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  cleanText: string; // Normalized text without punctuation for STT matching
}

export interface Chapter {
  bookId: string;
  bookName: string;
  chapter: number;
  verses: Verse[];
}

export interface Book {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
  totalChapters: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  versesReadCount: number;
  completedChapters: string[]; // e.g. ["gen_1", "ps_23"]
  readingSeconds: number;
}

export interface GoalSettings {
  targetVerses: number;
  targetChapters: number;
}

export interface SpeechMatchStatus {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  currentVerseId: string | null;
  matchedVerseIds: Set<string>;
  error: string | null;
  confidence: number;
}
