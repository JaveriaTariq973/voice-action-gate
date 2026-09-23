"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface SpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

function isSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function useSpeechSynthesis(options?: SpeechSynthesisOptions) {
  const [isSupportedState] = useState(() => isSupported());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!isSupported()) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported()) return;

    window.speechSynthesis.cancel();

    const opts = optionsRef.current;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = opts?.lang ?? "en-US";
    utterance.rate = opts?.rate ?? 1;
    utterance.pitch = opts?.pitch ?? 1;
    utterance.volume = opts?.volume ?? 1;
    if (opts?.voice) utterance.voice = opts.voice;

    const thisUtterance = utterance;
    utterance.onstart = () => {
      if (currentUtteranceRef.current === thisUtterance) setIsSpeaking(true);
    };
    utterance.onend = () => {
      if (currentUtteranceRef.current === thisUtterance) {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      }
    };
    utterance.onerror = () => {
      if (currentUtteranceRef.current === thisUtterance) {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      }
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    isSupported: isSupportedState,
    voices,
    speak,
    stop,
  };
}
