import { describe, expect, it } from "vitest";
import { createUnlockToken, isValidUnlockToken, pinMatches, UNLOCK_MINUTES } from "./parent-lock";

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
});

describe("pinMatches", () => {
  it("requires an exact match and a configured PIN", () => {
    expect(pinMatches("1234", "1234")).toBe(true);
    expect(pinMatches("123", "1234")).toBe(false);
    expect(pinMatches("12345", "1234")).toBe(false);
    expect(pinMatches("1234", undefined)).toBe(false);
  });
});
