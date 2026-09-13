import { describe, expect, it } from "vitest";
import { questions, skills } from "@/content/bank";
import { selectSession, SESSION_SIZE, type PastAttempt } from "./select-session";

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const conventionCodes = new Set(skills.filter((s) => s.isConvention).map((s) => s.code));
const isConvention = (id: string) => questions.find((q) => q.id === id)!.skills.some((c) => conventionCodes.has(c));
const band = (id: string) => questions.find((q) => q.id === id)!.difficulty.band;

describe("selectSession", () => {
  it("picks a full session of distinct questions", () => {
    const plan = selectSession(questions, skills, [], seeded(1));
    expect(plan.questionIds).toHaveLength(SESSION_SIZE);
    expect(new Set(plan.questionIds).size).toBe(SESSION_SIZE);
  });

  it("always includes at least 3 applied-convention questions", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const plan = selectSession(questions, skills, [], seeded(seed));
      expect(plan.questionIds.filter(isConvention).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("orders easier bands first", () => {
    const bands = selectSession(questions, skills, [], seeded(7)).questionIds.map(band);
    expect(bands).toEqual([...bands].sort((a, b) => a - b));
  });

  it("prefers new questions over ones already answered correctly", () => {
    // A fixed pool of 20 keeps this independent of how many questions the bank holds.
    const pool = questions.slice(0, 20);
    const answeredAt = new Date("2026-09-01");
    const history: PastAttempt[] = pool.slice(0, 13).map((q) => ({ questionId: q.id, isCorrect: true, answeredAt }));
    const plan = selectSession(pool, skills, history, seeded(3));
    const fresh = new Set(pool.slice(13).map((q) => q.id));
    const convention = pool.filter((q) => isConvention(q.id));
    // Every new question is picked unless the convention quota had to pull in a review instead.
    expect(plan.questionIds.filter((id) => fresh.has(id)).length).toBeGreaterThanOrEqual(Math.min(7, SESSION_SIZE - Math.max(0, 3 - convention.filter((q) => fresh.has(q.id)).length)));
    for (const id of plan.questionIds) expect(plan.reasons[id]).toBe(fresh.has(id) ? "new" : "review");
  });

  it("brings back a wrong answer before correct reviews, using the latest attempt per question", () => {
    const all = questions.map((q) => ({ questionId: q.id, isCorrect: true, answeredAt: new Date("2026-09-01") }));
    const target = questions.find((q) => !isConvention(q.id))!.id;
    const history = [...all, { questionId: target, isCorrect: false, answeredAt: new Date("2026-09-02") }];
    const plan = selectSession(questions, skills, history, seeded(5));
    expect(plan.questionIds).toContain(target);
    expect(plan.reasons[target]).toBe("try again");
  });

  it("returns what exists when the pool is smaller than a session", () => {
    const plan = selectSession(questions.slice(0, 2), skills, [], seeded(2));
    expect(plan.questionIds).toHaveLength(2);
  });
});
