"use client";

import { useEffect } from "react";
import { startBackgroundSync } from "@/lib/outbox";

/** Keeps offline answers syncing across every page, not only while a puzzle session is open. */
export function BackgroundSync() {
  useEffect(() => startBackgroundSync(), []);
  return null;
}
