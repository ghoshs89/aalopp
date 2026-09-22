import { describe, expect, it } from "vitest";
import { questions, questionsById, skills } from "@/content/bank";
import type { AttemptRecord } from "./skill-state";
import { computeSkillStates } from "./skill-state";
import { computeWorkingBands, selectSession, SESSION_SIZE } from "./select-session";

const reviewed = questions.filter((q) => q.reviewStatus === "reviewed");
const skillByCode = new Map(skills.map((s) => [s.code, s]));
const isConvention = (id: string) => questionsById.get(id)!.skills.some((c) => skillByCode.get(c)!.isConvention);

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

let tick = 0;
const attempt = (questionId: string, isCorrect: boolean, localDate: string): AttemptRecord => ({
  questionId,
  isCorrect,
  localDate,
  answeredAt: new Date(Date.parse(`${localDate}T12:00:00Z`) + tick++ * 1000),
});
const idsFor = (skill: string) => reviewed.filter((q) => q.skills[0] === skill).map((q) => q.id);

describe("selectSession", () => {
  it("picks a full session of distinct questions, each with a reason", () => {
    const plan = selectSession(reviewed, skills, [], "2026-09-13", seeded(1));
    expect(plan.picks).toHaveLength(SESSION_SIZE);
    expect(new Set(plan.picks.map((p) => p.questionId)).size).toBe(SESSION_SIZE);
    for (const p of plan.picks) expect(p.reason.length).toBeGreaterThan(5);
  });

  it("always includes at least 3 applied-convention questions and at most 2 questions per skill", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const plan = selectSession(reviewed, skills, [], "2026-09-13", seeded(seed));
      expect(plan.picks.filter((p) => isConvention(p.questionId)).length).toBeGreaterThanOrEqual(3);
      const perSkill = new Map<string, number>();
      for (const p of plan.picks) for (const code of questionsById.get(p.questionId)!.skills) perSkill.set(code, (perSkill.get(code) ?? 0) + 1);
      expect(Math.max(...perSkill.values())).toBeLessThanOrEqual(2);
    }
  });

  it("puts a skill that is due for review into the session", () => {
    const coins = idsFor("MATH-MD-COINS");
    const history = [
      attempt(coins[0], true, "2026-09-01"),
      attempt(coins[1], true, "2026-09-01"),
      attempt(coins[2], true, "2026-09-02"),
      attempt(coins[3], true, "2026-09-02"),
      attempt(coins[4], true, "2026-09-02"),
    ];
    const states = computeSkillStates(skills, questionsById, history, "2026-09-10");
    expect(states.get("MATH-MD-COINS")!.status).toBe("review-due");
    const plan = selectSession(reviewed, skills, history, "2026-09-10", seeded(4));
    const review = plan.picks.find((p) => p.reason.startsWith("Review: Counting coins"));
    expect(review).toBeDefined();
  });

  it("brings back a question missed on an earlier day, but not one missed today", () => {
    const target = reviewed.find((q) => !isConvention(q.id) && q.difficulty.band === 2)!.id;
    const yesterday = selectSession(reviewed, skills, [attempt(target, false, "2026-09-12")], "2026-09-13", seeded(2));
    expect(yesterday.picks.find((p) => p.questionId === target)?.reason).toMatch(/^Try again/);
    const today = selectSession(reviewed, skills, [attempt(target, false, "2026-09-13")], "2026-09-13", seeded(2));
    expect(today.picks.map((p) => p.questionId)).not.toContain(target);
  });

  it("does not repeat a question answered right in the last 14 days while others are available", () => {
    const answered = reviewed.slice(0, 60).map((q) => attempt(q.id, true, "2026-09-05"));
    const plan = selectSession(reviewed, skills, answered, "2026-09-13", seeded(9));
    const recent = new Set(answered.map((a) => a.questionId));
    expect(plan.picks.filter((p) => recent.has(p.questionId))).toEqual([]);
  });

  it("gives stretch slots to questions one band above the working band and puts them last", () => {
    const plan = selectSession(reviewed, skills, [], "2026-09-13", seeded(5));
    const stretch = plan.picks.filter((p) => p.reason.includes("Stretch question"));
    expect(stretch.length).toBeGreaterThanOrEqual(1);
    expect(stretch.length).toBeLessThanOrEqual(2);
    expect(plan.picks.slice(-stretch.length)).toEqual(stretch);
    for (const p of stretch) {
      const q = questionsById.get(p.questionId)!;
      expect(q.difficulty.band).toBe(plan.workingBands[skillByCode.get(q.skills[0])!.strand] + 1);
    }
  });

  it("relaxes the repeat rule rather than returning a short session from a small pool", () => {
    const pool = reviewed.slice(0, 6);
    const plan = selectSession(pool, skills, pool.map((q) => attempt(q.id, true, "2026-09-13")), "2026-09-13", seeded(3), 4);
    expect(plan.picks).toHaveLength(4);
    expect(plan.picks.every((p) => p.reason.startsWith("Extra practice") || p.reason.includes(":"))).toBe(true);
  });

  it("still introduces a new skill when many skills are already in progress", () => {
    // Give him a scattered history across many skills, so every one of them sits in "learning" and outscores a new
    // skill. Before the new-skill slot existed this starved whole strands: 200 draws produced no new skill at all.
    let history: AttemptRecord[] = [];
    for (const skill of skills.slice(0, 24)) {
      const ids = idsFor(skill.code).slice(0, 2);
      history = history.concat(ids.map((id, i) => attempt(id, i === 0, "2026-09-05")));
    }
    const states = computeSkillStates(skills, questionsById, history, "2026-09-13");
    const learning = [...states.values()].filter((s) => s.status === "learning").length;
    expect(learning, "the history needs plenty of skills in progress for this to mean anything").toBeGreaterThanOrEqual(15);

    for (let seed = 1; seed <= 20; seed++) {
      const plan = selectSession(reviewed, skills, history, "2026-09-13", seeded(seed));
      const introduced = plan.picks.filter((p) => p.reason.startsWith("New skill:"));
      expect(introduced.length, `seed ${seed}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = selectSession(reviewed, skills, [], "2026-09-13", seeded(11));
    const b = selectSession(reviewed, skills, [], "2026-09-13", seeded(11));
    expect(a).toEqual(b);
  });
});

describe("computeWorkingBands", () => {
  it("starts at band 2 and moves up once a band is passed", () => {
    const bandTwoGeometry = reviewed.filter((q) => skillByCode.get(q.skills[0])!.strand === "GEOMETRY_SPATIAL" && q.difficulty.band === 2).slice(0, 3);
    expect(bandTwoGeometry).toHaveLength(3);
    const history = bandTwoGeometry.map((q, i) => attempt(q.id, i !== 0, "2026-09-10"));
    const bands = computeWorkingBands(reviewed, skillByCode, history);
    expect(bands.GEOMETRY_SPATIAL).toBe(3);
    expect(bands.LOGIC_CS).toBe(2);
  });

  it("does not move up with fewer than 2 in 3 right", () => {
    const qs = reviewed.filter((q) => skillByCode.get(q.skills[0])!.strand === "LOGIC_CS" && q.difficulty.band === 2).slice(0, 3);
    const history = qs.map((q, i) => attempt(q.id, i === 0, "2026-09-10"));
    expect(computeWorkingBands(reviewed, skillByCode, history).LOGIC_CS).toBe(2);
  });
});
