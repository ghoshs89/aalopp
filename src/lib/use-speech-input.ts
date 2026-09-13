"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

const noSubscribe = () => () => {};
const recognitionClass = (): RecognitionConstructor | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/**
 * Experimental speech input. Browsers send the audio to their own speech service, so it needs a connection, and
 * recognition of young children's speech is unreliable. Tapping an answer always stays available.
 */
export function useSpeechInput() {
  const supported = useSyncExternalStore(noSubscribe, () => recognitionClass() !== undefined, () => false);
  const [listening, setListening] = useState(false);
  const active = useRef<Recognition | null>(null);

  const listen = useCallback((lang: string, onHeard: (alternatives: string[]) => void) => {
    const Rec = recognitionClass();
    if (!Rec) return;
    active.current?.abort();
    const rec = new Rec();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.onresult = (e) => {
      const first = e.results[0];
      onHeard(Array.from({ length: first.length }, (_, i) => first[i].transcript));
    };
    rec.onerror = () => onHeard([]);
    rec.onend = () => setListening(false);
    active.current = rec;
    setListening(true);
    rec.start();
  }, []);

  const cancel = useCallback(() => {
    active.current?.abort();
    setListening(false);
  }, []);

  return { supported, listening, listen, cancel };
}
