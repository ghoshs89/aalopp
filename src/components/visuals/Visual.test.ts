import { describe, expect, it } from "vitest";
import { barColor } from "./Visual";

describe("barColor", () => {
  it("draws color-named bars in their own color, ignoring case", () => {
    expect(barColor("White", 0)).toBe("#ffffff");
    expect(barColor(" black ", 3)).toBe("#26282b");
  });

  it("falls back to the palette for other labels", () => {
    expect(barColor("Lightning", 0)).toBe("#d84957");
    expect(barColor("Comet", 6)).toBe("#2878e3");
  });
});
