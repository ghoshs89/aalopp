import { describe, expect, it } from "vitest";
import { barChartTicks, clockHandAngles, pointOnDial } from "./geometry";

describe("clockHandAngles", () => {
  it("points both hands up at 12:00", () => {
    expect(clockHandAngles(12, 0)).toEqual({ hour: 0, minute: 0 });
  });

  it("puts the hour hand halfway between 4 and 5 at 4:30", () => {
    expect(clockHandAngles(4, 30)).toEqual({ hour: 135, minute: 180 });
  });

  it("puts the minute hand on the 3 at quarter past", () => {
    expect(clockHandAngles(2, 15).minute).toBe(90);
  });
});

describe("pointOnDial", () => {
  it("measures clockwise from 12 in screen coordinates", () => {
    const p = pointOnDial(100, 100, 50, 90);
    expect(p.x).toBeCloseTo(150);
    expect(p.y).toBeCloseTo(100);
  });
});

describe("barChartTicks", () => {
  it("counts by ones for small values", () => {
    expect(barChartTicks([5, 3, 7, 4])).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("counts by twos above 10 and ends at or above the tallest bar", () => {
    expect(barChartTicks([11, 4])).toEqual([0, 2, 4, 6, 8, 10, 12]);
  });
});
