import { describe, expect, it } from "vitest";
import {
  createUnlockToken,
  isPinLockedOut,
  isValidUnlockToken,
  PIN_LOCKOUT_MINUTES,
  PIN_MAX_ATTEMPTS,
  pinMatches,
  recordPinFailure,
  signingSecret,
  UNLOCK_MINUTES,
} from "./parent-lock";

describe("parent unlock token", () => {
  const now = Date.parse("2026-09-13T10:00:00Z");

  it("is valid until it expires", () => {
    const token = createUnlockToken("1234", now);
    expect(isValidUnlockToken(token, "1234", now + 60_000)).toBe(true);
    expect(isValidUnlockToken(token, "1234", now + UNLOCK_MINUTES * 60_000 + 1)).toBe(false);
  });

  it("stops working when the PIN changes or the token is edited", () => {
    const token = createUnlockToken("1234", now);
    expect(isValidUnlockToken(token, "9999", now)).toBe(false);
    const [, sig] = token.split(".");
    expect(isValidUnlockToken(`${now + 999_999_999}.${sig}`, "1234", now)).toBe(false);
    expect(isValidUnlockToken(undefined, "1234", now)).toBe(false);
  });

  it("mixes a server pepper into the signing secret while still tying it to the PIN", () => {
    expect(signingSecret("1234", "server-secret")).toBe("server-secret:1234");
    expect(signingSecret("1234", "")).toBe("1234");
    expect(signingSecret(undefined, "server-secret")).toBe("");
  });
});

describe("pin lockout", () => {
  const now = Date.parse("2026-11-24T12:00:00Z");
  const secret = signingSecret("1234", "server-secret");

  it("locks out after repeated wrong guesses and clears after the cooldown", () => {
    let cookie: string | undefined;
    for (let i = 1; i < PIN_MAX_ATTEMPTS; i++) {
      const next = recordPinFailure(cookie, secret, now);
      expect(next.locked).toBe(false);
      cookie = next.token;
      expect(isPinLockedOut(cookie, secret, now)).toBe(false);
    }
    const final = recordPinFailure(cookie, secret, now);
    expect(final.locked).toBe(true);
    expect(isPinLockedOut(final.token, secret, now + 60_000)).toBe(true);
    expect(isPinLockedOut(final.token, secret, now + PIN_LOCKOUT_MINUTES * 60_000 + 1)).toBe(false);
  });

  it("ignores tampered lockout cookies", () => {
    const { token } = recordPinFailure(undefined, secret, now);
    expect(isPinLockedOut(`99.${now + 600_000}.${token.split(".")[2]}`, secret, now)).toBe(false);
  });
});

describe("pinMatches", () => {
  it("requires an exact match and a configured PIN", () => {
    expect(pinMatches("1234", "1234")).toBe(true);
    expect(pinMatches("123", "1234")).toBe(false);
    expect(pinMatches("12345", "1234")).toBe(false);
    expect(pinMatches("1234", undefined)).toBe(false);
  });
});
