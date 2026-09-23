"use client";

import { ChatMessage } from "../lib/types";

const decisionBadge: Record<string, { bg: string; text: string; label: string }> = {
  AUTHORIZED: { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-300", label: "AUTHORIZED" },
  NEEDS_CONFIRMATION: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-300", label: "CONFIRM" },
  NEEDS_CLARIFICATION: { bg: "bg-sky-500/15 border-sky-500/30", text: "text-sky-300", label: "CLARIFY" },
  BLOCKED: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-300", label: "BLOCKED" },
};

export default function ConversationHistory({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-5">
      {messages.map((msg) => {
        const gate = msg.outcome?.gate;
        const badge = gate ? decisionBadge[gate.decision] : null;
        const toolResult = msg.outcome?.tool_result;
        const toolOk = toolResult && (toolResult.status === "COMPLETED" || toolResult.status === "SUCCESS");

        if (msg.role === "user") {
          return (
            <div key={msg.id} className="flex justify-end animate-fade-up">
              <div className="max-w-[75%] rounded-2xl rounded-br-lg bg-blue-600 px-4 py-2.5 text-[14px] text-white shadow-lg shadow-blue-600/20 whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex justify-start animate-fade-up">
            <div className="max-w-[85%] rounded-2xl rounded-bl-lg bg-white/[0.05] border border-white/[0.06] px-4 py-3">
              {/* Badge row */}
              {badge && (
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  {gate?.action && (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {gate.action}
                    </span>
                  )}
                </div>
              )}

              {/* Reply text */}
              <p className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </p>

              {/* Tool result inline */}
              {toolResult && (
                <div
                  className={`mt-3 rounded-lg border px-3 py-2 ${
                    toolOk
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  <p className={`text-[12px] font-medium ${toolOk ? "text-emerald-300" : "text-red-300"}`}>
                    {toolOk ? "Tool executed (simulated)" : `Tool failed: ${toolResult.status}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
