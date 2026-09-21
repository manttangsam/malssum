import { useState, useEffect, useRef, useCallback } from 'react';
import { Verse } from '../types/bible';
import { cleanVerseText } from '../data/bibleData';

interface UseSpeechToTextProps {
  currentChapterVerses: Verse[];
  onVerseCompleted: (verseId: string) => void;
  onChapterCompleted?: () => void;
}

// Window declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechToText({
  currentChapterVerses,
  onVerseCompleted,
  onChapterCompleted,
}: UseSpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeVerseIndex, setActiveVerseIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [matchedVerseIds, setMatchedVerseIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [matchPercentage, setMatchPercentage] = useState(0);

  const recognitionRef = useRef<any>(null);
  const simulationIntervalRef = useRef<any>(null);

  // Helper: check similarity between spoken speech and target verse text
  const calculateMatchScore = (spokenText: string, targetVerseText: string): number => {
    const cleanSpoken = cleanVerseText(spokenText);
    const cleanTarget = cleanVerseText(targetVerseText);

    if (!cleanSpoken || !cleanTarget) return 0;

    const targetWords = cleanTarget.split(' ').filter(Boolean);
    const spokenWords = cleanSpoken.split(' ').filter(Boolean);

    if (targetWords.length === 0) return 0;

    let matchedCount = 0;
    for (const tw of targetWords) {
      // Direct word match or partial word match (since Korean speech can have particles like -이, -가)
      if (spokenWords.some(sw => sw.includes(tw) || tw.includes(sw))) {
        matchedCount++;
      }
    }

    // Direct substring match boost (e.g. "하나님이 천지를 창조하시니라")
    let substringBoost = 0;
    const minLen = Math.min(cleanSpoken.length, cleanTarget.length);
    if (minLen >= 4 && (cleanTarget.includes(cleanSpoken.slice(-8)) || cleanSpoken.includes(cleanTarget.slice(0, 8)))) {
      substringBoost = 0.3;
    }

    const ratio = (matchedCount / targetWords.length) + substringBoost;
    return Math.min(1.0, ratio);
  };

  // Start web speech recognition
  const startListening = useCallback(() => {
    setError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('이 브라우저는 음성 인식을 직접 지원하지 않습니다. 아래 [시뮬레이션 낭독] 모드로 테스트해 보세요.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('마이크 접근 권한이 거부되었습니다. 브라우저 주소창 왼쪽 마이크 권한을 허용해 주세요.');
          setIsListening(false);
        } else if (event.error !== 'no-speech') {
          setError(`음성 인식 오류: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto restart if active and not stopped intentionally
        if (isListening && !isSimulating) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            currentFinal += res[0].transcript + ' ';
          } else {
            currentInterim += res[0].transcript;
          }
        }

        const fullText = (transcript + ' ' + currentFinal + ' ' + currentInterim).trim();
        setInterimTranscript(currentInterim);
        if (currentFinal) {
          setTranscript(prev => (prev + ' ' + currentFinal).slice(-150));
        }

        // Compare against active target verse
        if (activeVerseIndex < currentChapterVerses.length) {
          const currentVerse = currentChapterVerses[activeVerseIndex];
          const score = calculateMatchScore(fullText, currentVerse.text);
          setMatchPercentage(Math.round(score * 100));

          // If match score >= 50% or 3 key words spoken, mark verse completed!
          if (score >= 0.45) {
            markVerseComplete(currentVerse.id);
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      setError(`음성 인식 시작 실패: ${err.message || '알 수 없는 오류'}`);
      setIsListening(false);
    }
  }, [transcript, activeVerseIndex, currentChapterVerses, isListening, isSimulating]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      setIsSimulating(false);
    }
  }, []);

  // Mark a verse as completed and advance active index
  const markVerseComplete = useCallback((verseId: string) => {
    setMatchedVerseIds(prev => {
      const next = new Set(prev);
      if (!next.has(verseId)) {
        next.add(verseId);
        onVerseCompleted(verseId);

        // Move cursor to next verse
        setActiveVerseIndex(currentIdx => {
          const nextIdx = currentIdx + 1;
          if (nextIdx >= currentChapterVerses.length && onChapterCompleted) {
            onChapterCompleted();
          }
          return Math.min(nextIdx, currentChapterVerses.length - 1);
        });
      }
      return next;
    });
    setMatchPercentage(0);
    setTranscript('');
    setInterimTranscript('');
  }, [currentChapterVerses.length, onVerseCompleted, onChapterCompleted]);

  // Toggle demo/simulation mode for testing audio reading without mic
  const startSimulation = useCallback(() => {
    if (isSimulating) {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      setIsSimulating(false);
      return;
    }

    stopListening();
    setIsSimulating(true);
    setError(null);

    let currentIndex = activeVerseIndex;

    simulationIntervalRef.current = setInterval(() => {
      if (currentIndex < currentChapterVerses.length) {
        const verse = currentChapterVerses[currentIndex];
        setTranscript(verse.text);
        setMatchPercentage(100);

        markVerseComplete(verse.id);
        currentIndex++;
      } else {
        clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
      }
    }, 2800); // Advances a verse every 2.8 seconds in simulation
  }, [isSimulating, activeVerseIndex, currentChapterVerses, stopListening, markVerseComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  return {
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
  };
}
