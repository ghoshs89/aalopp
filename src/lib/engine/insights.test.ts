import { describe, expect, it } from "vitest";
import { questionsById, skills } from "@/content/bank";
import {
  accuracyByStrand,
  confidenceCalibration,
  dailyActivity,
  everydayVsReasoning,
  percent,
  skillMapLayout,
  summarize,
  weeklyAccuracy,
  type InsightAttempt,
} from "./insights";

const a = (questionId: string, isCorrect: boolean, localDate: string, extra: Partial<InsightAttempt> = {}): InsightAttempt => ({
  questionId,
  isCorrect,
  localDate,
  answeredAt: new Date(`${localDate}T15:00:00Z`),
  confidence: null,
  scratchpad: null,
  totalMs: 30_000,
  ...extra,
});

// md-car-wash-change is an everyday money question; kl12-castle-triangles is geometry reasoning.
const attempts = [
  a("md-car-wash-change", true, "2026-09-13", { confidence: "HIGH", scratchpad: "DIGITAL" }),
  a("md-car-wash-change", false, "2026-09-13", { confidence: "HIGH", scratchpad: "NONE" }),
  a("kl12-castle-triangles", true, "2026-09-10", { confidence: "LOW", scratchpad: "PAPER" }),
  a("kl12-castle-triangles", true, "2026-08-20", { confidence: "MEDIUM" }),
];

describe("insights", () => {
  it("percent is null with nothing to measure", () => {
    expect(percent({ answered: 0, correct: 0 })).toBeNull();
    expect(percent({ answered: 3, correct: 2 })).toBe(67);
  });

  it("dailyActivity fills empty days and counts minutes", () => {
    const days = dailyActivity(attempts, "2026-09-13", 7);
    expect(days.map((d) => d.date)).toEqual(["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"]);
    expect(days.at(-1)).toMatchObject({ answered: 2, correct: 1, minutes: 1 });
    expect(days[0]).toMatchObject({ answered: 0, correct: 0 });
  });

  it("weeklyAccuracy buckets by 7-day windows ending today", () => {
    const weeks = weeklyAccuracy(attempts, "2026-09-13", 4);
    expect(weeks.at(-1)).toMatchObject({ start: "2026-09-07", end: "2026-09-13", answered: 3, correct: 2 });
    expect(weeks[0]).toMatchObject({ start: "2026-08-17", end: "2026-08-23", answered: 1, correct: 1 });
  });

  it("splits everyday skills from reasoning and strands by first skill", () => {
    expect(everydayVsReasoning(attempts, questionsById, skills)).toEqual({ everyday: { answered: 2, correct: 1 }, reasoning: { answered: 2, correct: 2 } });
    const strands = accuracyByStrand(attempts, questionsById, skills);
    expect(strands.find((s) => s.strand === "MEASUREMENT_DATA")).toMatchObject({ answered: 2, correct: 1 });
    expect(strands.find((s) => s.strand === "GEOMETRY_SPATIAL")).toMatchObject({ answered: 2, correct: 2 });
  });

  it("calibration counts each confidence face", () => {
    expect(confidenceCalibration(attempts)).toEqual([
      { level: "LOW", answered: 1, correct: 1 },
      { level: "MEDIUM", answered: 1, correct: 1 },
      { level: "HIGH", answered: 2, correct: 1 },
    ]);
  });

  it("summarizes the last week and ignores answers saved before scratchpad tracking", () => {
    expect(summarize(attempts, "2026-09-13")).toEqual({
      lastWeek: { answered: 3, correct: 2 },
      practiceDaysLast14: 2,
      scratchpadShare: 67,
      sureButWrongLastWeek: 1,
    });
  });

  it("lays out the skill graph so every prerequisite is in an earlier column", () => {
    const { nodes, edges } = skillMapLayout(skills);
    expect(nodes).toHaveLength(skills.length);
    const layerOf = new Map(nodes.map((n) => [n.code, n.layer]));
    for (const e of edges) expect(layerOf.get(e.from)!).toBeLessThan(layerOf.get(e.to)!);
    const positions = new Set(nodes.map((n) => `${n.layer}:${n.row}`));
    expect(positions.size).toBe(nodes.length);
    const layerZero = nodes.filter((n) => n.layer === 0).sort((a, b) => a.row - b.row);
    const firstHumanities = layerZero.findIndex((n) => n.strand === "HUMANITIES");
    const lastCore = layerZero.findLastIndex((n) => n.strand !== "HUMANITIES");
    expect(firstHumanities).toBeGreaterThan(lastCore);
  });
});
