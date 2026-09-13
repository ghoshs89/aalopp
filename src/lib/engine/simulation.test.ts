import { describe, expect, it } from "vitest";
import { questions, questionsById, skills } from "@/content/bank";
import { addDays, daysBetween } from "./dates";
import { selectSession } from "./select-session";
import { computeSkillStates, type AttemptRecord } from "./skill-state";

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/**
 * A pretend learner, one session a day for 30 days. Chance of a right answer rises with practice on that skill and
 * falls for harder bands. The point is not realism; it checks that the loop behaves: skills get mastered, reviews
 * come back, questions do not repeat too soon, and every session keeps its everyday-skills mix.
 */
describe("30 days of practice", () => {
  const random = seeded(2026);
  const reviewed = questions.filter((q) => q.reviewStatus === "reviewed");
  const skillByCode = new Map(skills.map((s) => [s.code, s]));
  const practice = new Map<string, number>();
  const attempts: AttemptRecord[] = [];
  const sessions: { day: string; ids: string[]; reasons: string[] }[] = [];
  let tick = 0;

  for (let d = 0; d < 30; d++) {
    const day = addDays("2026-09-14", d);
    const plan = selectSession(reviewed, skills, attempts, day, random);
    sessions.push({ day, ids: plan.picks.map((p) => p.questionId), reasons: plan.picks.map((p) => p.reason) });
    for (const { questionId } of plan.picks) {
      const q = questionsById.get(questionId)!;
      const seen = Math.max(...q.skills.map((c) => practice.get(c) ?? 0));
      const chance = Math.min(0.95, 0.55 + seen * 0.08 - (q.difficulty.band - 2) * 0.08);
      attempts.push({ questionId, isCorrect: random() < chance, localDate: day, answeredAt: new Date(Date.parse(`${day}T16:00:00Z`) + tick++ * 1000) });
      for (const c of q.skills) practice.set(c, (practice.get(c) ?? 0) + 1);
    }
  }
  const finalStates = computeSkillStates(skills, questionsById, attempts, addDays("2026-09-14", 30));

  it("fills every session and keeps at least 3 everyday-skill questions in each", () => {
    for (const s of sessions) {
      expect(s.ids).toHaveLength(8);
      const everyday = s.ids.filter((id) => questionsById.get(id)!.skills.some((c) => skillByCode.get(c)!.isConvention));
      expect(everyday.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("masters a good share of skills within a month", () => {
    const done = [...finalStates.values()].filter((s) => s.status === "mastered" || s.status === "review-due").length;
    expect(done).toBeGreaterThanOrEqual(8);
  });

  it("schedules reviews and actually brings them back", () => {
    expect(sessions.flatMap((s) => s.reasons).some((r) => r.startsWith("Review:"))).toBe(true);
    expect([...finalStates.values()].some((s) => s.box >= 2)).toBe(true);
  });

  it("never repeats a question it got right within 14 days", () => {
    const lastRight = new Map<string, string>();
    for (const a of attempts) {
      const prev = lastRight.get(a.questionId);
      if (prev) expect(daysBetween(prev, a.localDate)).toBeGreaterThanOrEqual(14);
      if (a.isCorrect) lastRight.set(a.questionId, a.localDate);
    }
  });

  it("touches most skills and reaches harder bands", () => {
    const practiced = [...finalStates.values()].filter((s) => s.attempts > 0).length;
    expect(practiced).toBeGreaterThanOrEqual(30);
    const maxBand = Math.max(...attempts.map((a) => questionsById.get(a.questionId)!.difficulty.band));
    expect(maxBand).toBeGreaterThanOrEqual(4);
  });
});
