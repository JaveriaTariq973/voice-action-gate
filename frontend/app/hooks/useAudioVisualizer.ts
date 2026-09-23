"use client";

import { useEffect, useRef, useCallback } from "react";

export function useAudioVisualizer(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const start = useCallback(async () => {
    if (audioContextRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // mic denied or unavailable
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (active) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [active, start, stop]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      const w = (canvas.width = canvas.offsetWidth * devicePixelRatio);
      const h = (canvas.height = canvas.offsetHeight * devicePixelRatio);

      ctx.clearRect(0, 0, w, h);

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const barCount = 64;
        const barWidth = (w / barCount) * 0.7;
        const gap = (w / barCount) * 0.3;

        for (let i = 0; i < barCount; i++) {
          const idx = Math.floor((i / barCount) * dataArray.length);
          const value = dataArray[idx];
          const barHeight = Math.max(2 * devicePixelRatio, (value / 255) * h * 0.9);
          const x = i * (barWidth + gap);
          const y = h - barHeight;

          const gradient = ctx.createLinearGradient(x, y, x, h);
          gradient.addColorStop(0, `rgba(99, 102, 241, ${0.4 + (value / 255) * 0.6})`);
          gradient.addColorStop(1, `rgba(59, 130, 246, ${0.15 + (value / 255) * 0.3})`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2 * devicePixelRatio);
          ctx.fill();
        }
      } else {
        // Idle animated bars
        const time = Date.now() / 1000;
        const barCount = 64;
        const barWidth = (w / barCount) * 0.7;
        const gap = (w / barCount) * 0.3;

        for (let i = 0; i < barCount; i++) {
          const val = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
          const barHeight = Math.max(2 * devicePixelRatio, val * h * 0.15);
          const x = i * (barWidth + gap);
          const y = h - barHeight;

          ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2 * devicePixelRatio);
          ctx.fill();
        }
      }
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [active]);

  return { canvasRef, active };
}
