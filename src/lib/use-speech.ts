"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pickVoice } from "./voices";

const noSubscribe = () => () => {};
const hasSpeech = () => typeof window !== "undefined" && "speechSynthesis" in window;

export type SpeechPart = { text: string; lang?: string };

/**
 * Browser text-to-speech. English uses a friendly voice; Spanish and French parts use a voice for that language when
 * the device has one. iPad Safari needs the first speak() inside a tap.
 */
export function useSpeech() {
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  // False during server rendering and hydration, then the real value, so markup matches on both sides.
  const supported = useSyncExternalStore(noSubscribe, hasSpeech, () => false);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      voices.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  /** Speaks one string, or several parts in order, each in its own language. */
  const speak = useCallback(
    (input: string | SpeechPart[]) => {
      const parts = (typeof input === "string" ? [{ text: input }] : input).filter((p) => p.text);
      if (!supported || parts.length === 0) return;
      window.speechSynthesis.cancel();
      parts.forEach((part, i) => {
        const lang = part.lang ?? "en-US";
        const utterance = new SpeechSynthesisUtterance(part.text);
        const voice = pickVoice(voices.current, lang);
        if (voice) utterance.voice = voice;
        utterance.lang = lang;
        utterance.rate = lang.startsWith("en") ? 0.9 : 0.8;
        if (i === 0) utterance.onstart = () => setSpeaking(true);
        if (i === parts.length - 1) utterance.onend = utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      });
    },
    [supported],
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}
