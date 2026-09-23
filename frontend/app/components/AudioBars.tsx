"use client";

import { useEffect, useRef } from "react";

export default function AudioBars({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = devicePixelRatio;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();

    const barCount = 80;
    let time = 0;
    const phases = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2);
    const speeds = Array.from({ length: barCount }, () => 0.8 + Math.random() * 1.2);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      resize();

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      const barWidth = (w / barCount) * 0.6;
      const gap = (w / barCount) * 0.4;

      for (let i = 0; i < barCount; i++) {
        let intensity: number;

        if (active) {
          // Active: tall animated bars
          intensity = Math.sin(time * speeds[i] * 3 + phases[i]) * 0.5 + 0.5;
          intensity = intensity * intensity; // square for more contrast
          intensity = Math.max(0.05, intensity);
        } else {
          // Idle: gentle breathing
          intensity = Math.sin(time * 0.8 + i * 0.15) * 0.5 + 0.5;
          intensity = 0.03 + intensity * 0.07;
        }

        const barHeight = intensity * h * 0.95;
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        if (active) {
          gradient.addColorStop(0, `rgba(99, 102, 241, ${0.3 + intensity * 0.7})`);
          gradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.2 + intensity * 0.5})`);
          gradient.addColorStop(1, `rgba(99, 102, 241, ${0.3 + intensity * 0.7})`);
        } else {
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.15)");
          gradient.addColorStop(1, "rgba(99, 102, 241, 0.05)");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(2 * dpr, barHeight), barWidth / 2);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16"
      aria-hidden="true"
    />
  );
}
