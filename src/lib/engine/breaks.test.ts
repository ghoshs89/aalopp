import { describe, expect, it } from "vitest";
import { shouldSuggestBreak } from "./breaks";

describe("shouldSuggestBreak", () => {
  it("suggests a break after 3 wrong answers in a row", () => {
    expect(shouldSuggestBreak([true, false, false, false], false)).toBe(true);
  });

  it("does not suggest one for scattered mistakes, too few answers, or twice in a session", () => {
    expect(shouldSuggestBreak([false, false, true, false], false)).toBe(false);
    expect(shouldSuggestBreak([false, false], false)).toBe(false);
    expect(shouldSuggestBreak([false, false, false], true)).toBe(false);
  });
});
