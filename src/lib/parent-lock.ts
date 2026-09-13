import { createHmac, timingSafeEqual } from "node:crypto";

// A 4-digit PIN keeps curious kids out of the grown-up page on a signed-in device. Google sign-in is the real gate.
export const PARENT_COOKIE = "parent_unlock";
export const UNLOCK_MINUTES = 30;

function signature(expiresAt: number, secret: string) {
  return createHmac("sha256", secret).update(`parent-unlock:${expiresAt}`).digest("hex");
}

export function createUnlockToken(secret: string, now = Date.now()): string {
  const expiresAt = now + UNLOCK_MINUTES * 60_000;
  return `${expiresAt}.${signature(expiresAt, secret)}`;
}

export function isValidUnlockToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token || !secret) return false;
  const [expires, sig] = token.split(".");
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < now || !sig) return false;
  const expected = Buffer.from(signature(expiresAt, secret));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function pinMatches(input: string, pin: string | undefined): boolean {
  if (!pin) return false;
  const a = Buffer.from(input.padEnd(16).slice(0, 16));
  const b = Buffer.from(pin.padEnd(16).slice(0, 16));
  return timingSafeEqual(a, b) && input.length === pin.length;
}
