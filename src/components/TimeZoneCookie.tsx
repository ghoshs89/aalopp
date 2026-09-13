"use client";

import { useEffect } from "react";

/** Tells the server the device's time zone, so "today" and "a different day" match the family's clock. */
export function TimeZoneCookie() {
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone) document.cookie = `tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  return null;
}
