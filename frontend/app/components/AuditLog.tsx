"use client";

import { useMemo } from "react";
import { AuditEntry } from "../lib/types";

const decisionConfig: Record<string, { dot: string; text: string }> = {
  AUTHORIZED: { dot: "bg-emerald-400", text: "text-emerald-300" },
  BLOCKED: { dot: "bg-red-400", text: "text-red-300" },
  NEEDS_CLARIFICATION: { dot: "bg-sky-400", text: "text-sky-300" },
  NEEDS_CONFIRMATION: { dot: "bg-amber-400", text: "text-amber-300" },
  CANCELLED: { dot: "bg-zinc-500", text: "text-zinc-400" },
};

const fallback = { dot: "bg-zinc-500", text: "text-zinc-400" };

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

export default function AuditLog({ entries, error }: { entries: AuditEntry[]; error?: boolean }) {
  const reversed = useMemo(() => [...entries].reverse(), [entries]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 overflow-hidden">
      <div className="px-5 h-12 flex items-center justify-between border-b border-white/[0.06]">
        <span className="text-[13px] font-medium text-zinc-300">Audit Trail</span>
        <span className="text-[11px] text-zinc-600 font-mono">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div
        className="divide-y divide-white/[0.04] max-h-[350px] overflow-y-auto"
        tabIndex={0}
        aria-label="Audit entries"
      >
        {error ? (
          <div className="px-5 py-8 text-center text-[13px] text-red-400">
            Failed to load audit log
          </div>
        ) : entries.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-zinc-600">
            No audit entries yet
          </div>
        ) : (
          reversed.map((entry, i) => {
            const dc = decisionConfig[entry.decision] ?? fallback;
            const executed = entry.tool_result &&
              (entry.tool_result.status === "COMPLETED" || entry.tool_result.status === "SUCCESS");
            return (
              <div key={`${entry.timestamp}-${entry.action}-${i}`} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dc.dot}`} />
                    <span className="text-[12px] font-mono text-zinc-300 truncate">
                      {entry.action}
                    </span>
                  </div>
                  <span className={`text-[11px] font-semibold flex-shrink-0 ml-3 ${dc.text}`}>
                    {entry.decision.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600 pl-3.5">
                  <span className={entry.risk === "HIGH" ? "text-red-400/70 font-medium" : ""}>
                    {entry.risk}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className="font-mono">{formatTime(entry.timestamp)}</span>
                  {entry.tool_result && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className={executed ? "text-emerald-400/70" : "text-red-400/70"}>
                        {executed ? "executed" : entry.tool_result.status}
                      </span>
                    </>
                  )}
                </div>
                {entry.reason && (
                  <p className="text-[11px] text-zinc-600 italic mt-1 pl-3.5">
                    {entry.reason}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
