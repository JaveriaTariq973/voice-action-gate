"use client";

import { GateResult } from "../lib/types";

const checkLabels: Record<string, string> = {
  ACTION_KNOWN: "Action Recognized",
  MISSING_PARAMS: "Missing Parameters",
  AMBIGUITY: "Ambiguity Check",
  EXPLICITNESS: "Explicit Provenance",
  CONFIRMATION: "User Confirmation",
};

const decisionConfig: Record<string, { bg: string; border: string; text: string; icon: string; label: string }> = {
  AUTHORIZED: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    icon: "✓",
    label: "AUTHORIZED",
  },
  NEEDS_CONFIRMATION: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-300",
    icon: "?",
    label: "NEEDS CONFIRMATION",
  },
  NEEDS_CLARIFICATION: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-300",
    icon: "…",
    label: "NEEDS CLARIFICATION",
  },
  BLOCKED: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-300",
    icon: "✕",
    label: "BLOCKED",
  },
};

const fallbackConfig = {
  bg: "bg-zinc-500/10",
  border: "border-zinc-500/30",
  text: "text-zinc-300",
  icon: "?",
  label: "UNKNOWN",
};

const riskConfig: Record<string, { bg: string; text: string; label: string }> = {
  HIGH: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-300", label: "HIGH RISK" },
  MEDIUM: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-300", label: "MEDIUM RISK" },
  LOW: { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-300", label: "LOW RISK" },
};

export default function GatePanel({ gate }: { gate: GateResult }) {
  if (!gate || !gate.checks) return null;

  const dc = decisionConfig[gate.decision] ?? fallbackConfig;
  const rc = gate.risk ? riskConfig[gate.risk] : null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 overflow-hidden animate-fade-up">
      {/* Decision header */}
      <div className={`px-5 py-5 border-b border-white/[0.06] ${dc.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest">
            Gate Decision
          </span>
          {rc && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rc.bg} ${rc.text}`}>
              {rc.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg font-bold ${dc.bg} ${dc.border} ${dc.text}`}>
            {dc.icon}
          </span>
          <div>
            <span className={`text-lg font-bold tracking-wide ${dc.text}`}>
              {dc.label}
            </span>
            {gate.action && (
              <p className="text-[12px] text-zinc-500 font-mono mt-0.5">
                {gate.action}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checks */}
      <div className="p-5 space-y-2">
        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-3">
          Verification Checks
        </p>
        {gate.checks.map((c, idx) => (
          <div
            key={`${c.check}-${idx}`}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
              c.passed
                ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                : "border-red-500/20 bg-red-500/[0.06]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                c.passed
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {c.passed ? "✓" : "✕"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-zinc-200">
                {checkLabels[c.check] || c.check.replace(/_/g, " ")}
              </div>
              {c.detail && (
                <div className="text-[12px] text-zinc-500 mt-0.5">
                  {c.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reasons */}
      {gate.reasons && gate.reasons.length > 0 && (
        <div className="px-5 pb-5">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-2">
              Why?
            </p>
            <ul className="space-y-1.5">
              {gate.reasons.map((r, i) => (
                <li key={i} className="text-[13px] text-zinc-400 flex items-start gap-2">
                  <span className="text-zinc-600 mt-1">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Missing / Ambiguous */}
      {((gate.missing && gate.missing.length > 0) ||
        (gate.unverified && gate.unverified.length > 0)) && (
        <div className="px-5 pb-5 space-y-3">
          {gate.missing && gate.missing.length > 0 && (
            <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 px-4 py-3">
              <p className="text-[11px] font-medium text-amber-400 uppercase tracking-widest mb-1.5">
                Missing
              </p>
              <div className="flex flex-wrap gap-1.5">
                {gate.missing.map((m) => (
                  <span key={m} className="text-[12px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {gate.unverified && gate.unverified.length > 0 && (
            <div className="rounded-xl bg-red-500/[0.06] border border-red-500/20 px-4 py-3">
              <p className="text-[11px] font-medium text-red-400 uppercase tracking-widest mb-1.5">
                Unverified
              </p>
              <div className="flex flex-wrap gap-1.5">
                {gate.unverified.map((u) => (
                  <span key={u} className="text-[12px] font-mono text-red-300 bg-red-500/10 px-2 py-0.5 rounded-md">
                    {u}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
