import { describe, expect, it } from "vitest";
import { strokeWidth } from "./Scratchpad";

describe("strokeWidth", () => {
  it("gives fingers and mice a steady line", () => {
    expect(strokeWidth(0, "touch")).toBe(4);
    expect(strokeWidth(1, "mouse")).toBe(4);
  });

  it("follows stylus pressure, clamped to a sensible range", () => {
    expect(strokeWidth(0, "pen")).toBe(2);
    expect(strokeWidth(1, "pen")).toBe(7);
    expect(strokeWidth(3, "pen")).toBe(7);
  });
});
