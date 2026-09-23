"use client";

import { useMemo } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

const BAR_HEIGHTS = [14, 22, 10, 18, 12];

export default function VoiceInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ continuous: false, interimResults: true });

  const displayText = useMemo(
    () => (transcript || interimTranscript).trim(),
    [transcript, interimTranscript]
  );

  const handleToggle = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleSend = () => {
    if (disabled || !displayText) return;
    onSend(displayText);
    resetTranscript();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-300">
        Voice input is not supported in this browser. Use Chrome or Edge.
      </div>
    );
  }

  const hasText = displayText.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Mic button */}
        <button
          onClick={handleToggle}
          disabled={disabled}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl transition-all ${
            isListening
              ? "bg-red-500 shadow-lg shadow-red-500/30 text-white scale-105"
              : "bg-white/[0.06] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.15]"
          } disabled:opacity-40`}
        >
          {isListening ? (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          {isListening && (
            <span className="absolute inset-0 rounded-2xl border-2 border-red-400/50 animate-ping" aria-hidden="true" />
          )}
        </button>

        {/* Status */}
        <div className="flex-1 min-w-0">
          {isListening ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-red-400">Listening...</span>
              <span className="flex items-end gap-0.5 h-5" aria-hidden="true">
                {BAR_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-red-400 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
            </div>
          ) : hasText ? (
            <span className="text-[13px] text-zinc-500">
              Ready to send — or click mic to re-record
            </span>
          ) : (
            <span className="text-[13px] text-zinc-600">
              Click the mic and start speaking
            </span>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div
        className={`rounded-xl border px-4 py-3 min-h-[56px] max-h-[100px] overflow-y-auto transition-colors ${
          hasText
            ? "border-blue-500/30 bg-blue-500/[0.06] cursor-pointer"
            : "border-white/[0.06] bg-white/[0.02]"
        }`}
        onClick={hasText && !disabled ? handleSend : undefined}
        onKeyDown={hasText && !disabled ? handleKeyDown : undefined}
        tabIndex={hasText ? 0 : -1}
        role="log"
        aria-live="polite"
        aria-label="Transcribed speech"
      >
        <span className="text-[14px] text-white">{transcript}</span>
        {interimTranscript && (
          <span className="text-[14px] text-zinc-500 italic"> {interimTranscript}</span>
        )}
        {!hasText && (
          <span className="text-[13px] text-zinc-600 italic">Your speech will appear here...</span>
        )}
      </div>

      {/* Send */}
      {hasText && (
        <button
          onClick={handleSend}
          disabled={disabled}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-40 transition-all"
        >
          {disabled ? "Sending..." : `Send "${displayText.slice(0, 60)}${displayText.length > 60 ? "..." : ""}"`}
        </button>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
