import type { Question, Skill } from "@/content/schema";
import { addDays, daysBetween, type LocalDate } from "./dates";

export type InsightAttempt = {
  questionId: string;
  isCorrect: boolean;
  answeredAt: Date;
  localDate: LocalDate;
  confidence: "LOW" | "MEDIUM" | "HIGH" | null;
  scratchpad: "NONE" | "DIGITAL" | "PAPER" | null;
  totalMs: number;
};

export type Tally = { answered: number; correct: number };

const tally = (items: { isCorrect: boolean }[]): Tally => ({ answered: items.length, correct: items.filter((a) => a.isCorrect).length });

/** Share right as a whole percent, or null when there is nothing to measure. */
export function percent(t: Tally): number | null {
  return t.answered === 0 ? null : Math.round((100 * t.correct) / t.answered);
}

/** One row per calendar day, oldest first, ending today. Days with no practice are included as zeros. */
export function dailyActivity(attempts: InsightAttempt[], today: LocalDate, days = 14): ({ date: LocalDate; minutes: number } & Tally)[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    const onDay = attempts.filter((a) => a.localDate === date);
    return { date, ...tally(onDay), minutes: Math.round(onDay.reduce((m, a) => m + a.totalMs, 0) / 60000) };
  });
}

/** Accuracy per 7-day week ending today, oldest first. Week 0 is the most recent 7 days. */
export function weeklyAccuracy(attempts: InsightAttempt[], today: LocalDate, weeks = 8): ({ start: LocalDate; end: LocalDate } & Tally)[] {
  return Array.from({ length: weeks }, (_, i) => {
    const w = weeks - 1 - i;
    const end = addDays(today, -7 * w);
    const start = addDays(end, -6);
    return { start, end, ...tally(attempts.filter((a) => a.localDate >= start && a.localDate <= end)) };
  });
}

/** Accuracy by the strand of each question's first skill, in a fixed strand order. */
export function accuracyByStrand(attempts: InsightAttempt[], questionsById: Map<string, Question>, skills: Skill[]): ({ strand: Skill["strand"] } & Tally)[] {
  const strandOf = new Map(skills.map((s) => [s.code, s.strand]));
  const order: Skill["strand"][] = ["MEASUREMENT_DATA", "OPERATIONS_ALGEBRA", "NUMBER_BASE_TEN", "GEOMETRY_SPATIAL", "LOGIC_CS", "LANGUAGE"];
  return order
    .map((strand) => ({
      strand,
      ...tally(attempts.filter((a) => {
        const q = questionsById.get(a.questionId);
        return q !== undefined && strandOf.get(q.skills[0]) === strand;
      })),
    }))
    .filter((row) => row.answered > 0 || row.strand !== "LANGUAGE");
}

/** Everyday convention skills (time, money, measuring, graphs) against everything else. */
export function everydayVsReasoning(attempts: InsightAttempt[], questionsById: Map<string, Question>, skills: Skill[]): { everyday: Tally; reasoning: Tally } {
  const convention = new Set(skills.filter((s) => s.isConvention).map((s) => s.code));
  const isEveryday = (a: InsightAttempt) => questionsById.get(a.questionId)?.skills.some((c) => convention.has(c)) ?? false;
  return { everyday: tally(attempts.filter(isEveryday)), reasoning: tally(attempts.filter((a) => questionsById.has(a.questionId) && !isEveryday(a))) };
}

/** How often each confidence face turned out right. Well calibrated: "Very sure" is right most of the time. */
export function confidenceCalibration(attempts: InsightAttempt[]): ({ level: "LOW" | "MEDIUM" | "HIGH" } & Tally)[] {
  return (["LOW", "MEDIUM", "HIGH"] as const).map((level) => ({ level, ...tally(attempts.filter((a) => a.confidence === level)) }));
}

export type Summary = {
  lastWeek: Tally;
  practiceDaysLast14: number;
  scratchpadShare: number | null;
  sureButWrongLastWeek: number;
};

export function summarize(attempts: InsightAttempt[], today: LocalDate): Summary {
  const week = attempts.filter((a) => daysBetween(a.localDate, today) >= 0 && daysBetween(a.localDate, today) < 7);
  const fortnightDays = new Set(attempts.filter((a) => daysBetween(a.localDate, today) >= 0 && daysBetween(a.localDate, today) < 14).map((a) => a.localDate));
  const recorded = attempts.filter((a) => a.scratchpad !== null);
  return {
    lastWeek: tally(week),
    practiceDaysLast14: fortnightDays.size,
    scratchpadShare: recorded.length === 0 ? null : Math.round((100 * recorded.filter((a) => a.scratchpad !== "NONE").length) / recorded.length),
    sureButWrongLastWeek: week.filter((a) => a.confidence === "HIGH" && !a.isCorrect).length,
  };
}

export type MapNode = { code: string; name: string; layer: number; row: number; strand: Skill["strand"] };

/**
 * Lays the skill graph out left to right: a skill's column is one more than its deepest prerequisite, so every arrow
 * points right. Within a column, skills are grouped by strand so related skills sit together.
 */
export function skillMapLayout(skills: Skill[]): { nodes: MapNode[]; edges: { from: string; to: string }[]; layers: number; rows: number } {
  const byCode = new Map(skills.map((s) => [s.code, s]));
  const depth = new Map<string, number>();
  const depthOf = (code: string, seen = new Set<string>()): number => {
    if (depth.has(code)) return depth.get(code)!;
    if (seen.has(code)) throw new Error(`Prerequisite cycle at ${code}`);
    seen.add(code);
    const prereqs = byCode.get(code)?.prerequisites.filter((p) => byCode.has(p)) ?? [];
    const d = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map((p) => depthOf(p, seen)));
    depth.set(code, d);
    return d;
  };
  const strandOrder = ["MEASUREMENT_DATA", "OPERATIONS_ALGEBRA", "NUMBER_BASE_TEN", "GEOMETRY_SPATIAL", "LOGIC_CS", "LANGUAGE"];
  const layers = new Map<number, Skill[]>();
  for (const s of skills) {
    const d = depthOf(s.code);
    layers.set(d, [...(layers.get(d) ?? []), s]);
  }
  const nodes: MapNode[] = [];
  for (const [layer, list] of layers) {
    list
      .sort((a, b) => strandOrder.indexOf(a.strand) - strandOrder.indexOf(b.strand) || a.name.localeCompare(b.name))
      .forEach((s, row) => nodes.push({ code: s.code, name: s.name, layer, row, strand: s.strand }));
  }
  const edges = skills.flatMap((s) => s.prerequisites.filter((p) => byCode.has(p)).map((p) => ({ from: p, to: s.code })));
  return { nodes, edges, layers: layers.size, rows: Math.max(...[...layers.values()].map((l) => l.length)) };
}
