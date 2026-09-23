"use client";

import { ParamEvidence, ParamSource } from "../lib/types";

const sourceConfig: Record<
  ParamSource,
  { icon: string; color: string; bg: string; border: string }
> = {
  USER_EXPLICIT: { icon: "✓", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  SYSTEM_CONTEXT: { icon: "ℹ", color: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  AI_INFERENCE: { icon: "✕", color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
  DEFAULT_VALUE: { icon: "✕", color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
  UNCERTAIN: { icon: "⚠", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  UNKNOWN: { icon: "?", color: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
};

const fallback = { icon: "?", color: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/20" };

export default function ParameterTable({ evidence }: { evidence: ParamEvidence[] }) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="space-y-2">
      {evidence.map((e, idx) => {
        const sc = sourceConfig[e.source] ?? fallback;
        return (
          <div
            key={`${e.name}-${idx}`}
            className={`rounded-xl border px-4 py-3 ${sc.bg} ${sc.border}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-semibold text-zinc-200 font-mono">
                {e.name}
              </span>
              <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${sc.color}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${sc.bg} border ${sc.border}`}>
                  {sc.icon}
                </span>
                {e.source.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] text-white font-medium">
                {e.value || "—"}
              </span>
              {e.quote && (
                <span className="text-[12px] text-zinc-500 italic truncate">
                  &quot;{e.quote}&quot;
                </span>
              )}
            </div>
            {e.candidates && e.candidates.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {e.candidates.map((c) => (
                  <span
                    key={c}
                    className="text-[11px] font-mono text-zinc-400 bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-md"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
