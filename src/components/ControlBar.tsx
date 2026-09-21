import React from 'react';
import { Mic, MicOff, Play, Square, SkipForward, AlertCircle } from './Icons';
import { AudioVisualizer } from './AudioVisualizer';
import { ThemeMode } from '../types/bible';

interface ControlBarProps {
  isListening: boolean;
  isSimulating: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  onToggleListening: () => void;
  onToggleSimulation: () => void;
  onSkipVerse: () => void;
  theme: ThemeMode;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isListening,
  isSimulating,
  transcript,
  interimTranscript,
  error,
  onToggleListening,
  onToggleSimulation,
  onSkipVerse,
  theme
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
      <div className="max-w-xl mx-auto rounded-2xl backdrop-blur-xl border shadow-2xl p-4 transition-all duration-300 floating-bar-bg border-custom">
        {/* Error Alert Banner if any */}
        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-sans flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Speech Transcript Preview */}
        {(isListening || isSimulating || interimTranscript) && (
          <div className="mb-3 p-2 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-sans text-center truncate opacity-90">
            <span className="font-semibold text-amber-600 dark:text-amber-400 mr-1.5">
              [인식된 음성]
            </span>
            <span className="italic">
              "{interimTranscript || transcript || '말씀을 낭독하고 계십니다...'}"
            </span>
          </div>
        )}

        {/* Main Control Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Audio Waveform Canvas */}
          <div className="flex-1 min-w-0">
            <AudioVisualizer isListening={isListening || isSimulating} theme={theme} />
          </div>

          {/* Primary Microphone Toggle Button */}
          <button
            onClick={onToggleListening}
            className={`px-6 py-3 rounded-xl font-bold text-sm font-sans flex items-center space-x-2 transition shadow-lg transform active:scale-95 cursor-pointer ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>낭독 일시정지</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>마이크 켜기 (낭독 시작)</span>
              </>
            )}
          </button>

          {/* Secondary Options (Skip & Demo Simulation) */}
          <div className="flex items-center space-x-1.5">
            {/* Demo Simulation Toggle */}
            <button
              onClick={onToggleSimulation}
              className={`p-2.5 rounded-xl border text-xs font-sans font-semibold cursor-pointer transition ${
                isSimulating
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-custom hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={isSimulating ? '시뮬레이션 중지' : '테스트용 자동 낭독 시뮬레이션'}
            >
              {isSimulating ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>

            {/* Skip Active Verse */}
            <button
              onClick={onSkipVerse}
              className="p-2.5 rounded-xl border bg-custom hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              title="다음 구절로 강제 이동"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
