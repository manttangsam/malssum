import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isListening: boolean;
  theme: 'sepia' | 'dark' | 'light';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isListening) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isSubscribed) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;

        renderWaveform();
      } catch (err) {
        console.warn('Microphone stream access not granted for visualizer', err);
      }
    }

    function renderWaveform() {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isSubscribed) return;
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Color based on theme
        let barColor = '#d97706'; // Sepia amber
        if (theme === 'dark') barColor = '#38bdf8'; // Sky blue
        if (theme === 'light') barColor = '#2563eb'; // Royal blue

        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;

          ctx.fillStyle = barColor;
          ctx.beginPath();
          ctx.roundRect(x, height / 2 - barHeight / 2, Math.max(3, barWidth - 2), Math.max(4, barHeight), 3);
          ctx.fill();

          x += barWidth + 3;
        }
      };

      draw();
    }

    initAudio();

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isListening, theme]);

  return (
    <div className="flex items-center justify-center h-8 px-2">
      {isListening ? (
        <canvas ref={canvasRef} width={180} height={30} className="w-44 h-7" />
      ) : (
        <div className="flex items-center space-x-1 opacity-40">
          <span className="w-1.5 h-3 rounded-full bg-current"></span>
          <span className="w-1.5 h-5 rounded-full bg-current"></span>
          <span className="w-1.5 h-2 rounded-full bg-current"></span>
          <span className="w-1.5 h-6 rounded-full bg-current"></span>
          <span className="w-1.5 h-3 rounded-full bg-current"></span>
        </div>
      )}
    </div>
  );
};
