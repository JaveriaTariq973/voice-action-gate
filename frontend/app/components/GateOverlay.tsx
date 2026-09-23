"use client";

import { useEffect, useState } from "react";
import { GateResult } from "../lib/types";

export default function GateOverlay({
  gate,
  onDismiss,
}: {
  gate: GateResult;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2800);
    return () => clearTimeout(timer);
  }, [gate, onDismiss]);

  const isAuthorized = gate.decision === "AUTHORIZED";
  const isBlocked = gate.decision === "BLOCKED";
  const color = isAuthorized ? "#10b981" : isBlocked ? "#ef4444" : "#f59e0b";
  const icon = isAuthorized ? "✓" : isBlocked ? "✕" : "?";
  const title = isAuthorized
    ? "AUTHORIZED"
    : isBlocked
    ? "BLOCKED"
    : gate.decision === "NEEDS_CONFIRMATION"
    ? "CONFIRM?"
    : "CLARIFY";
  const subtitle = gate.action || "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        background: visible
          ? `radial-gradient(circle at center, ${color}15 0%, rgba(0,0,0,0.92) 70%)`
          : "transparent",
        pointerEvents: visible ? "auto" : "none",
      }}
      onClick={() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }}
      role="alertdialog"
      aria-label={`Gate decision: ${title}`}
    >
      <div
        className="text-center transform transition-all duration-500"
        style={{
          transform: visible ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
        }}
      >
        {/* Big icon circle */}
        <div
          className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 text-6xl font-bold"
          style={{
            borderColor: `${color}60`,
            background: `${color}20`,
            color,
            boxShadow: `0 0 60px ${color}40, 0 0 120px ${color}20`,
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <h2
          className="text-5xl font-black tracking-widest mb-3"
          style={{ color, textShadow: `0 0 40px ${color}60` }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xl font-mono text-zinc-400 mb-6">{subtitle}</p>
        )}

        {/* Risk badge */}
        {gate.risk && (
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full border"
            style={{
              borderColor: `${gate.risk === "HIGH" ? "#ef4444" : gate.risk === "MEDIUM" ? "#f59e0b" : "#10b981"}60`,
              color: gate.risk === "HIGH" ? "#ef4444" : gate.risk === "MEDIUM" ? "#f59e0b" : "#10b981",
              background: `${gate.risk === "HIGH" ? "#ef4444" : gate.risk === "MEDIUM" ? "#f59e0b" : "#10b981"}15`,
            }}
          >
            {gate.risk} RISK
          </span>
        )}

        {/* Reasons */}
        {gate.reasons && gate.reasons.length > 0 && (
          <div className="mt-6 space-y-1">
            {gate.reasons.map((r, i) => (
              <p key={i} className="text-sm text-zinc-500">
                {r}
              </p>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-zinc-600">Click anywhere to dismiss</p>
      </div>

      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color}03 2px, ${color}03 4px)`,
        }}
      />
    </div>
  );
}
