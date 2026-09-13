import { describe, expect, it } from "vitest";
import { isAllowedEmail } from "./allowlist";

describe("isAllowedEmail", () => {
  const list = " Parent.One@gmail.com, parent2@gmail.com ,";

  it("matches ignoring case and spaces", () => {
    expect(isAllowedEmail("parent.one@GMAIL.com", list)).toBe(true);
    expect(isAllowedEmail("parent2@gmail.com", list)).toBe(true);
  });

  it("rejects anyone else, missing emails, and everything when the list is empty", () => {
    expect(isAllowedEmail("stranger@gmail.com", list)).toBe(false);
    expect(isAllowedEmail(undefined, list)).toBe(false);
    expect(isAllowedEmail("parent2@gmail.com", "")).toBe(false);
  });
});
