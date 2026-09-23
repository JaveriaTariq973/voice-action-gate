"use client";

export default function ToolResult({
  result,
}: {
  result: { status: string; result: Record<string, unknown> };
}) {
  const isSuccess = result.status === "COMPLETED" || result.status === "SUCCESS" || result.status === "OK";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isSuccess
          ? "border-emerald-500/20 bg-emerald-500/[0.06]"
          : "border-red-500/20 bg-red-500/[0.06]"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
            isSuccess
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {isSuccess ? "✓" : "✕"}
        </span>
        <div>
          <span className={`text-[14px] font-semibold ${isSuccess ? "text-emerald-300" : "text-red-300"}`}>
            {isSuccess ? "Tool Executed (Simulated)" : `Tool Failed: ${result.status}`}
          </span>
        </div>
      </div>
      <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
        <pre className="text-[12px] text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono">
          {JSON.stringify(result.result, null, 2) ?? "null"}
        </pre>
      </div>
      <p className={`mt-2 text-[11px] ${isSuccess ? "text-emerald-500/60" : "text-red-500/60"}`}>
        Simulated execution — no real systems were affected.
      </p>
    </div>
  );
}
