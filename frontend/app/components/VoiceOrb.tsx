"use client";

import { useEffect, useRef } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "blocked" | "authorized";

const stateConfig: Record<OrbState, { primary: string; glow: string; ring: string; label: string }> = {
  idle:       { primary: "#6366f1", glow: "rgba(99,102,241,0.3)",  ring: "rgba(99,102,241,0.15)", label: "Tap to speak" },
  listening:  { primary: "#3b82f6", glow: "rgba(59,130,246,0.5)",  ring: "rgba(59,130,246,0.2)",  label: "Listening..." },
  thinking:   { primary: "#8b5cf6", glow: "rgba(139,92,246,0.5)",  ring: "rgba(139,92,246,0.2)",  label: "Analyzing..." },
  speaking:   { primary: "#06b6d4", glow: "rgba(6,182,212,0.5)",   ring: "rgba(6,182,212,0.2)",   label: "Responding..." },
  blocked:    { primary: "#ef4444", glow: "rgba(239,68,68,0.5)",   ring: "rgba(239,68,68,0.2)",   label: "Blocked" },
  authorized: { primary: "#10b981", glow: "rgba(16,185,129,0.5)",  ring: "rgba(16,185,129,0.2)",  label: "Authorized" },
};

export default function VoiceOrb({
  state,
  onClick,
  size = 200,
}: {
  state: OrbState;
  onClick?: () => void;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const cfg = stateConfig[state];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = devicePixelRatio;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const center = (size * dpr) / 2;
    const baseRadius = (size * dpr) / 2 - 20 * dpr;

    let time = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      const isAnimated = state !== "idle";

      // Outer glow rings
      for (let ring = 3; ring >= 0; ring--) {
        const ringRadius = baseRadius + (ring + 1) * 8 * dpr;
        const pulse = isAnimated
          ? Math.sin(time * 1.5 + ring * 0.5) * 4 * dpr
          : Math.sin(time * 0.5) * 2 * dpr;
        const alpha = (0.15 - ring * 0.03) * (isAnimated ? 1 : 0.5);

        ctx.beginPath();
        ctx.arc(center, center, ringRadius + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = stateConfig[state].ring.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }

      // Audio-reactive wave ring
      const points = 128;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noise = isAnimated
          ? Math.sin(angle * 6 + time * 3) * Math.sin(angle * 3 + time * 2) * 8 * dpr
          : Math.sin(angle * 4 + time) * 3 * dpr;
        const r = baseRadius + noise;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(center, center, 0, center, center, baseRadius);
      grad.addColorStop(0, `${cfg.primary}40`);
      grad.addColorStop(0.6, `${cfg.primary}20`);
      grad.addColorStop(1, `${cfg.primary}08`);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = `${cfg.primary}80`;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Inner solid core
      const coreRadius = baseRadius * 0.55;
      const coreGrad = ctx.createRadialGradient(
        center - coreRadius * 0.3,
        center - coreRadius * 0.3,
        0,
        center,
        center,
        coreRadius
      );
      coreGrad.addColorStop(0, `${cfg.primary}`);
      coreGrad.addColorStop(1, `${cfg.primary}cc`);

      ctx.beginPath();
      ctx.arc(center, center, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Core highlight
      ctx.beginPath();
      ctx.arc(center - coreRadius * 0.2, center - coreRadius * 0.2, coreRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fill();

      // Center icon
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = `bold ${28 * dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (state === "listening") {
        // Mic icon
        drawMic(ctx, center, center, dpr);
      } else if (state === "thinking") {
        // Dots
        const dots = "...";
        const offset = Math.floor(time * 3) % 3;
        ctx.fillText(dots.slice(0, offset + 1), center, center);
      } else if (state === "blocked") {
        ctx.fillText("✕", center, center);
      } else if (state === "authorized") {
        ctx.fillText("✓", center, center);
      } else if (state === "speaking") {
        // Sound waves
        drawSoundWaves(ctx, center, center, time, dpr);
      } else {
        drawMic(ctx, center, center, dpr);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [state, size, cfg]);

  return (
    <button
      onClick={onClick}
      className="relative group focus:outline-none"
      aria-label={`Voice orb: ${cfg.label}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient glow behind */}
      <div
        className="absolute inset-0 rounded-full blur-3xl transition-all duration-500 opacity-60 group-hover:opacity-90"
        style={{ background: cfg.glow }}
      />
      <canvas
        ref={canvasRef}
        className="relative w-full h-full transition-transform duration-200 group-hover:scale-[1.03] active:scale-[0.97]"
        style={{ width: size, height: size }}
      />
      {/* Label below */}
      <span
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[13px] font-medium whitespace-nowrap transition-colors duration-300"
        style={{ color: cfg.primary }}
      >
        {cfg.label}
      </span>
    </button>
  );
}

function drawMic(ctx: CanvasRenderingContext2D, cx: number, cy: number, dpr: number) {
  const s = 1.2 * dpr;
  ctx.save();
  ctx.translate(cx, cy);

  // Mic body
  ctx.beginPath();
  ctx.roundRect(-6 * s, -14 * s, 12 * s, 18 * s, 6 * s);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();

  // Mic arc
  ctx.beginPath();
  ctx.arc(0, 4 * s, 12 * s, 0, Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = "round";
  ctx.stroke();

  // Mic stand
  ctx.beginPath();
  ctx.moveTo(0, 16 * s);
  ctx.lineTo(0, 22 * s);
  ctx.stroke();

  ctx.restore();
}

function drawSoundWaves(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number, dpr: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2 * dpr;
  ctx.lineCap = "round";

  for (let i = 0; i < 3; i++) {
    const offset = i * 0.4;
    const scale = ((time * 2 + offset) % 2);
    const alpha = Math.max(0, 1 - scale);
    ctx.globalAlpha = alpha * 0.7;
    ctx.beginPath();
    const r = (10 + scale * 16) * dpr;
    ctx.arc(cx, cy, r, -0.6, 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI - 0.6, Math.PI + 0.6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
