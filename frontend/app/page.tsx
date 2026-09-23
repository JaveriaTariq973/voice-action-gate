"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChatMessage, AuditEntry, GateResult } from "./lib/types";
import { sendTurn, getAuditLog, healthCheck } from "./lib/api";
import VoiceOrb, { OrbState } from "./components/VoiceOrb";
import GateOverlay from "./components/GateOverlay";
import AudioBars from "./components/AudioBars";
import ConversationHistory from "./components/ConversationHistory";
import ParameterTable from "./components/ParameterTable";
import GatePanel from "./components/GatePanel";
import AuditLog from "./components/AuditLog";
import ToolResult from "./components/ToolResult";
import ChatInput from "./components/ChatInput";
import VoiceInput from "./components/VoiceInput";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";

type InputMode = "text" | "voice";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [speakReplies, setSpeakReplies] = useState(true);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [activeOverlay, setActiveOverlay] = useState<GateResult | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const auditFetchIdRef = useRef(0);
  const mountedRef = useRef(true);

  const { speak, stop: stopSpeak, isSupported: ttsSupported } = useSpeechSynthesis();

  const speech = useSpeechRecognition({ continuous: true, interimResults: true });

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    healthCheck()
      .then(() => { if (mountedRef.current) setConnected(true); })
      .catch(() => { if (mountedRef.current) setConnected(false); });
  }, []);

  const fetchAudit = useCallback(() => {
    const fetchId = ++auditFetchIdRef.current;
    getAuditLog()
      .then((entries) => {
        if (mountedRef.current && fetchId === auditFetchIdRef.current) {
          setAuditEntries(entries);
          setAuditError(false);
        }
      })
      .catch(() => {
        if (mountedRef.current && fetchId === auditFetchIdRef.current) setAuditError(true);
      });
  }, []);

  useEffect(() => { fetchAudit(); }, [messages.length, fetchAudit]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const latestOutcome = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].outcome) return messages[i].outcome;
    }
    return undefined;
  }, [messages]);

  const handleSend = async (text: string) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    const userMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);
    try {
      if (ttsSupported) stopSpeak();
      const outcome = await sendTurn(sessionId, text);
      if (!mountedRef.current) return;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "agent", text: outcome.reply, outcome }]);
      if (outcome.gate) setActiveOverlay(outcome.gate);
      if (speakReplies && ttsSupported) speak(outcome.reply);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (mountedRef.current) {
        setError(`Failed to send: ${msg}`);
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
      }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (speech.isListening) {
      speech.stopListening();
      // Give recognition a moment to flush final results, then auto-send
      setTimeout(() => {
        const text = speech.transcript.trim();
        if (text && !loading) {
          speech.resetTranscript();
          handleSend(text);
        }
      }, 300);
    } else {
      speech.resetTranscript();
      speech.startListening();
    }
  };

  const handleStopAndSend = () => {
    speech.stopListening();
    setTimeout(() => {
      const text = speech.transcript.trim();
      if (text && !loading) {
        speech.resetTranscript();
        handleSend(text);
      }
    }, 300);
  };

  const handleReset = () => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setAuditEntries([]);
    setError(null);
    setAuditError(false);
    setActiveOverlay(null);
    stopSpeak();
  };

  const orbState: OrbState = loading
    ? "thinking"
    : speech.isListening
    ? "listening"
    : latestOutcome?.tool_result
    ? "authorized"
    : latestOutcome?.gate?.decision === "BLOCKED"
    ? "blocked"
    : latestOutcome?.gate?.decision === "AUTHORIZED"
    ? "authorized"
    : ttsSupported && speakReplies && latestOutcome
    ? "speaking"
    : "idle";

  return (
    <div className="min-h-dvh bg-zinc-950 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-purple-600/[0.03] blur-[100px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Gate overlay */}
      {activeOverlay && (
        <GateOverlay gate={activeOverlay} onDismiss={() => setActiveOverlay(null)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-white tracking-tight leading-none">Voice Action Gate</h1>
              <p className="text-[11px] text-zinc-600 mt-0.5 leading-none">Speak. Verify. Authorize.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ttsSupported && (
              <button
                onClick={() => setSpeakReplies(!speakReplies)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all border ${
                  speakReplies
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                    : "bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-zinc-300"
                }`}
                aria-pressed={speakReplies}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                {speakReplies ? "Voice on" : "Voice off"}
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              New Session
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-white/[0.06]">
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse-dot" : "bg-red-400"}`} />
              <span className="text-[11px] text-zinc-600">{connected ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main: Voice-first layout */}
      <main className="relative z-10">
        {/* HERO: Voice Orb */}
        <section className="flex flex-col items-center justify-center pt-16 pb-12 px-5">
          <VoiceOrb state={orbState} onClick={handleVoiceToggle} size={220} />

          {/* Audio bars */}
          <div className="mt-14 w-full max-w-xl">
            <AudioBars active={speech.isListening || loading} />
          </div>

          {/* Live transcript */}
          {(speech.transcript || speech.interimTranscript) && (
            <div className="mt-6 max-w-xl text-center animate-fade-up">
              <p className="text-lg text-white">
                {speech.transcript}
                <span className="text-zinc-500 italic">{speech.interimTranscript}</span>
              </p>
            </div>
          )}

          {/* Speech error */}
          {speech.error && (
            <div role="alert" className="mt-4 max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-300 text-center">
              {speech.error}
            </div>
          )}

          {/* Primary voice control button */}
          <div className="mt-8">
            {!speech.isListening ? (
              <button
                onClick={handleVoiceToggle}
                disabled={loading || !speech.isSupported}
                className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-[15px] font-semibold text-white shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {loading ? "Processing..." : speech.isSupported ? "Start Listening" : "Voice not supported"}
              </button>
            ) : (
              <button
                onClick={handleStopAndSend}
                disabled={!speech.transcript.trim()}
                className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-8 py-4 text-[15px] font-semibold text-white shadow-xl shadow-red-600/25 hover:shadow-red-600/40 hover:from-red-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute h-3 w-3 rounded-full bg-white opacity-75" />
                  <span className="relative rounded-full h-3 w-3 bg-white" />
                </span>
                Stop &amp; Send
              </button>
            )}
          </div>

          {/* Listening hint */}
          {speech.isListening && !speech.transcript && !speech.interimTranscript && (
            <p className="mt-4 text-[13px] text-zinc-500 animate-pulse">
              Go ahead, I&apos;m listening...
            </p>
          )}

          {/* Input mode toggle */}
          <div className="mt-10 flex rounded-full bg-white/[0.04] border border-white/[0.06] p-1" role="tablist" aria-label="Input mode">
            <button
              role="tab"
              aria-selected={inputMode === "voice"}
              onClick={() => setInputMode("voice")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
                inputMode === "voice" ? "bg-white/[0.1] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice
            </button>
            <button
              role="tab"
              aria-selected={inputMode === "text"}
              onClick={() => setInputMode("text")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
                inputMode === "text" ? "bg-white/[0.1] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Text
            </button>
          </div>

          {/* Quick demo */}
          {messages.length === 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
              {[
                { label: "Delete DB", text: "Delete the customer database.", color: "rose" },
                { label: "Deploy", text: "Deploy payments-service version 4.8.2 to production.", color: "amber" },
                { label: "Transfer", text: "Transfer 5000 USD to Acme Corp.", color: "violet" },
                { label: "Probably prod", text: "It's probably production.", color: "sky" },
              ].map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleSend(qa.text)}
                  disabled={loading}
                  className={`rounded-full border px-4 py-1.5 text-[12px] font-medium transition-all disabled:opacity-40 ${
                    qa.color === "rose" ? "border-rose-500/25 text-rose-300/80 hover:bg-rose-500/10 hover:border-rose-500/50" :
                    qa.color === "amber" ? "border-amber-500/25 text-amber-300/80 hover:bg-amber-500/10 hover:border-amber-500/50" :
                    qa.color === "violet" ? "border-violet-500/25 text-violet-300/80 hover:bg-violet-500/10 hover:border-violet-500/50" :
                    "border-sky-500/25 text-sky-300/80 hover:bg-sky-500/10 hover:border-sky-500/50"
                  }`}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-6 max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300 animate-fade-up">
              {error}
            </div>
          )}
        </section>

        {/* Conversation + Details */}
        {(messages.length > 0 || inputMode === "text") && (
          <section className="mx-auto max-w-[1600px] px-5 pb-16">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6">
              {/* Conversation */}
              <div className="space-y-6 min-w-0">
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
                  <div className="px-5 h-11 flex items-center border-b border-white/[0.06]">
                    <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">Conversation</span>
                  </div>
                  <div
                    className="min-h-[200px] max-h-[45vh] overflow-y-auto px-5 py-5"
                    role="log"
                    aria-live="polite"
                    aria-label="Conversation history"
                    tabIndex={0}
                  >
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-[160px] text-zinc-600 text-[13px]">
                        Your conversation will appear here
                      </div>
                    ) : (
                      <ConversationHistory messages={messages} />
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="px-5 py-4 border-t border-white/[0.06]">
                    {inputMode === "text" ? (
                      <ChatInput onSend={handleSend} disabled={loading} />
                    ) : (
                      <VoiceInput onSend={handleSend} disabled={loading} />
                    )}
                  </div>
                </div>

                {latestOutcome?.tool_result && (
                  <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm p-5 animate-fade-up">
                    <h2 className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-4">Tool Execution</h2>
                    <ToolResult result={latestOutcome.tool_result} />
                  </div>
                )}
              </div>

              {/* Right rail */}
              <div className="space-y-6 min-w-0">
                {latestOutcome?.gate ? (
                  <GatePanel gate={latestOutcome.gate} />
                ) : (
                  <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm p-8 text-center">
                    <p className="text-[13px] text-zinc-600">Gate panel will appear after your first command</p>
                  </div>
                )}

                {latestOutcome?.gate?.evidence && latestOutcome.gate.evidence.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm p-5 animate-fade-up">
                    <h2 className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-4">Parameter Evidence</h2>
                    <ParameterTable evidence={latestOutcome.gate.evidence} />
                  </div>
                )}

                <AuditLog entries={auditEntries} error={auditError} />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
