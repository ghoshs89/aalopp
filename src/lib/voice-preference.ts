"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "puzzle-quest-voice";
const EVENT = "puzzle-quest-voice-change";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Whether questions and feedback are read aloud automatically on this device. Off unless someone turns it on;
 * the choice is remembered per device. Server rendering always sees "off".
 */
export function useVoicePreference(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => false);
  const set = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      // Private browsing can block storage; the switch still works for this visit.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [on, set];
}
