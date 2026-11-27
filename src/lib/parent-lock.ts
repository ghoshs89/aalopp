import { createHmac, timingSafeEqual } from "node:crypto";

// A 4-digit PIN keeps curious kids out of the grown-up page on a signed-in device. Google sign-in is the real gate.
export const PARENT_COOKIE_PATH = "/parent";
export const PRACTICE_HISTORY_PATH = `${PARENT_COOKIE_PATH}/practice-history`;
export const PARENT_COOKIE = "parent_unlock";
export const PIN_TRIES_COOKIE = "parent_pin_tries";
export const UNLOCK_MINUTES = 30;
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_MINUTES = 5;

/**
 * Combines the PIN with a high-entropy server secret when available, so changing the PIN still invalidates old
 * cookies while the HMAC key does not depend on 4 digits alone.
 */
export function signingSecret(pin: string | undefined, pepper = process.env.PARENT_LOCK_SECRET ?? process.env.CRON_SECRET ?? ""): string {
  if (!pin) return "";
  return pepper ? `${pepper}:${pin}` : pin;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function sigEquals(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex);
  const actual = Buffer.from(actualHex);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createUnlockToken(secret: string, now = Date.now()): string {
  const expiresAt = now + UNLOCK_MINUTES * 60_000;
  return `${expiresAt}.${signature(`parent-unlock:${expiresAt}`, secret)}`;
}

export function isValidUnlockToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token || !secret) return false;
  const [expires, sig] = token.split(".");
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < now || !sig) return false;
  return sigEquals(signature(`parent-unlock:${expiresAt}`, secret), sig);
}

export type PinLockout = { failures: number; lockedUntil: number };

export function readPinLockout(token: string | undefined, secret: string, now = Date.now()): PinLockout {
  if (!token || !secret) return { failures: 0, lockedUntil: 0 };
  const [failuresRaw, lockedRaw, sig] = token.split(".");
  const failures = Number(failuresRaw);
  const lockedUntil = Number(lockedRaw);
  if (!Number.isInteger(failures) || failures < 0 || !Number.isFinite(lockedUntil) || !sig) {
    return { failures: 0, lockedUntil: 0 };
  }
  if (!sigEquals(signature(`pin-tries:${failures}:${lockedUntil}`, secret), sig)) {
    return { failures: 0, lockedUntil: 0 };
  }
  if (lockedUntil > 0 && lockedUntil <= now) return { failures: 0, lockedUntil: 0 };
  return { failures, lockedUntil };
}

export function recordPinFailure(token: string | undefined, secret: string, now = Date.now()): { token: string; locked: boolean } {
  const current = readPinLockout(token, secret, now);
  const failures = current.failures + 1;
  const locked = failures >= PIN_MAX_ATTEMPTS;
  const lockedUntil = locked ? now + PIN_LOCKOUT_MINUTES * 60_000 : 0;
  return { token: `${failures}.${lockedUntil}.${signature(`pin-tries:${failures}:${lockedUntil}`, secret)}`, locked };
}

export function isPinLockedOut(token: string | undefined, secret: string, now = Date.now()): boolean {
  return readPinLockout(token, secret, now).lockedUntil > now;
}

export function pinMatches(input: string, pin: string | undefined): boolean {
  if (!pin) return false;
  const a = Buffer.from(input.padEnd(16).slice(0, 16));
  const b = Buffer.from(pin.padEnd(16).slice(0, 16));
  return timingSafeEqual(a, b) && input.length === pin.length;
}
