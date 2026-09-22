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

describe("everyday-skills quota under many histories", () => {
  it("keeps at least 3 everyday-skill questions in every session across 10 simulated learners", () => {
    const reviewed = questions.filter((q) => q.reviewStatus === "reviewed");
    const skillByCode = new Map(skills.map((s) => [s.code, s]));
    for (let learner = 1; learner <= 10; learner++) {
      const random = seeded(learner * 97);
      const attempts: AttemptRecord[] = [];
      let tick = 0;
      for (let d = 0; d < 25; d++) {
        const day = addDays("2026-09-14", d);
        const plan = selectSession(reviewed, skills, attempts, day, random);
        const everyday = plan.picks.filter((p) => questionsById.get(p.questionId)!.skills.some((c) => skillByCode.get(c)!.isConvention));
        expect(everyday.length, `learner ${learner}, day ${day}`).toBeGreaterThanOrEqual(3);
        expect(plan.picks).toHaveLength(8);
        for (const { questionId } of plan.picks) {
          attempts.push({ questionId, isCorrect: random() < 0.7, localDate: day, answeredAt: new Date(Date.parse(`${day}T16:00:00Z`) + tick++ * 1000) });
        }
      }
    }
  });
});

/**
 * The review queue has to stay servable. A session can serve at most MAX_REVIEWS reviews, so if settled skills come
 * due faster than that the due queue grows without bound and new material never gets a slot. This runs long enough
 * for the first cohort of skills to climb all five boxes and settle, which is where the old 14 day top box failed.
 */
describe("the review queue stays servable over 180 days", () => {
  const reviewed = questions.filter((q) => q.reviewStatus === "reviewed");
  // Skills whose questions are all still drafts cannot be served at all, so they are not what these assertions are
  // about. Knowledge content ships as `draft` until its facts have been checked.
  const servable = skills.filter((s) => reviewed.some((q) => q.skills.includes(s.code)));

  for (const accuracy of [0.7, 0.85]) {
    it(`keeps the due queue bounded and masters nearly everything at ${accuracy * 100}% accuracy`, () => {
      const random = seeded(Math.round(accuracy * 1000));
      const attempts: AttemptRecord[] = [];
      const dueEachDay: number[] = [];
      let tick = 0;

      for (let d = 0; d < 180; d++) {
        const day = addDays("2026-09-14", d);
        const states = computeSkillStates(skills, questionsById, attempts, day);
        dueEachDay.push([...states.values()].filter((s) => s.status === "review-due").length);
        for (const { questionId } of selectSession(reviewed, skills, attempts, day, random).picks) {
          attempts.push({ questionId, isCorrect: random() < accuracy, localDate: day, answeredAt: new Date(Date.parse(`${day}T16:00:00Z`) + tick++ * 1000) });
        }
      }

      // The queue humps while skills climb the boxes, then levels off. At a lower accuracy it settles at a steady
      // level rather than emptying, which is fine: he is genuinely getting things wrong. What must not happen is
      // unbounded growth. The last 60 days are compared against days 60 to 120, both past the transient. Sixty day
      // windows because a settled queue still swings by several skills from month to month at a low accuracy, and a
      // shorter window reads that noise as a trend. A queue that is genuinely still growing ends up far larger.
      const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      expect(Math.max(...dueEachDay)).toBeLessThanOrEqual(servable.length / 2);
      expect(mean(dueEachDay.slice(-60))).toBeLessThanOrEqual(mean(dueEachDay.slice(60, 120)) * 1.3);

      // How much can master depends on how often he is right, so the bar moves with the accuracy. Mastery needs 4 of
      // the last 5 right: at 70% only about half of any five answers even qualify, so demanding the same share as at
      // 85% would be asking the engine to certify skills he has not actually learned.
      const finalStates = computeSkillStates(skills, questionsById, attempts, addDays("2026-09-14", 180));
      const settled = [...finalStates.values()].filter((s) => s.status === "mastered").length;
      expect(settled).toBeGreaterThanOrEqual(servable.length * (accuracy - 0.12));
    });
  }

  it("serves every skill at least once, so no strand is starved", () => {
    const random = seeded(7);
    const attempts: AttemptRecord[] = [];
    let tick = 0;
    for (let d = 0; d < 60; d++) {
      const day = addDays("2026-09-14", d);
      for (const { questionId } of selectSession(reviewed, skills, attempts, day, random).picks) {
        attempts.push({ questionId, isCorrect: random() < 0.8, localDate: day, answeredAt: new Date(Date.parse(`${day}T16:00:00Z`) + tick++ * 1000) });
      }
    }
    const states = computeSkillStates(skills, questionsById, attempts, addDays("2026-09-14", 60));
    const servableCodes = new Set(servable.map((s) => s.code));
    const untouched = [...states.values()].filter((s) => s.attempts === 0 && servableCodes.has(s.code)).map((s) => s.code);
    expect(untouched, `never served: ${untouched.join(", ")}`).toHaveLength(0);
  });
});
