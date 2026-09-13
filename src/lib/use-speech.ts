"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
const hasSpeech = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Browser text-to-speech with a friendly English voice. iPad Safari needs the first speak() inside a tap. */
export function useSpeech() {
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  // False during server rendering and hydration, then the real value, so markup matches on both sides.
  const supported = useSyncExternalStore(noSubscribe, hasSpeech, () => false);

  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      const preferred = ["Samantha", "Google US English", "Microsoft Aria", "Karen", "Daniel"];
      voice.current =
        preferred.map((name) => voices.find((v) => v.name.includes(name))).find(Boolean) ??
        voices.find((v) => v.lang === "en-US") ??
        voices[0] ??
        null;
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice.current) utterance.voice = voice.current;
      utterance.rate = 0.9;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}
