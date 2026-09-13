import { describe, expect, it } from "vitest";
import type { Question, Skill } from "@/content/schema";
import { addDays, daysBetween, localDateOf, safeTimeZone } from "./dates";
import { computeSkillStates, type AttemptRecord } from "./skill-state";

const skill = (code: string): Skill => ({ code, name: code, domain: "MATHEMATICS", strand: "OPERATIONS_ALGEBRA", tier: 1, isConvention: false, prerequisites: [] });
const question = (id: string, skills: string[]): Question => ({
  id,
  source: { kind: "original" },
  skills,
  language: "en",
  prompt: id,
  answer: { type: "numeric", value: 1 },
  explanation: "x",
  difficulty: { band: 1, basis: "author-estimate" },
  reviewStatus: "reviewed",
});

const skills = [skill("MATH-A"), skill("MATH-B")];
const questionsById = new Map([
  ["qa", question("qa", ["MATH-A"])],
  ["qab", question("qab", ["MATH-A", "MATH-B"])],
]);

let clock = 0;
/** One attempt per call, in order, on the given day. */
const on = (localDate: string, isCorrect: boolean, questionId = "qa"): AttemptRecord => ({ questionId, isCorrect, localDate, answeredAt: new Date(Date.parse(`${localDate}T10:00:00Z`) + clock++ * 1000) });
const state = (attempts: AttemptRecord[], today: string, code = "MATH-A") => computeSkillStates(skills, questionsById, attempts, today).get(code)!;

describe("dates", () => {
  it("does calendar math across months and years", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(daysBetween("2026-09-28", "2026-10-05")).toBe(7);
  });

  it("uses the household time zone for the local date", () => {
    const lateEvening = new Date("2026-09-14T01:30:00Z");
    expect(localDateOf(lateEvening, "America/Toronto")).toBe("2026-09-13");
    expect(localDateOf(lateEvening, "UTC")).toBe("2026-09-14");
    expect(safeTimeZone("Not/AZone")).toBe("UTC");
    expect(safeTimeZone(undefined)).toBe("UTC");
  });
});

describe("computeSkillStates", () => {
  it("starts every skill as new", () => {
    expect(state([], "2026-09-13")).toMatchObject({ status: "new", attempts: 0, box: 0 });
  });

  it("stays learning with 5 right answers on a single day", () => {
    const attempts = Array.from({ length: 5 }, () => on("2026-09-13", true));
    expect(state(attempts, "2026-09-13")).toMatchObject({ status: "learning", recent: [true, true, true, true, true] });
  });

  it("masters with 4 of the last 5 right across 2 days, then waits 1 day before review", () => {
    const attempts = [on("2026-09-12", true), on("2026-09-12", false), on("2026-09-12", true), on("2026-09-13", true), on("2026-09-13", true)];
    expect(state(attempts, "2026-09-13")).toMatchObject({ status: "mastered", box: 1, masteredOn: "2026-09-13", nextReview: "2026-09-14" });
    expect(state(attempts, "2026-09-14").status).toBe("review-due");
  });

  it("does not master with only 3 of the last 5 right", () => {
    const attempts = [on("2026-09-12", true), on("2026-09-12", false), on("2026-09-13", true), on("2026-09-13", false), on("2026-09-13", true)];
    expect(state(attempts, "2026-09-20").status).toBe("learning");
  });

  it("moves up the review boxes: 1, 3, 7 then 14 days", () => {
    const mastered = [on("2026-09-01", true), on("2026-09-01", true), on("2026-09-02", true), on("2026-09-02", true), on("2026-09-02", true)];
    const reviews = [on("2026-09-03", true), on("2026-09-06", true), on("2026-09-13", true)];
    const s = state([...mastered, ...reviews], "2026-09-13");
    expect(s).toMatchObject({ box: 4, nextReview: "2026-09-27", status: "mastered" });
  });

  it("ignores right answers before the review date for box moves", () => {
    const mastered = [on("2026-09-01", true), on("2026-09-01", true), on("2026-09-02", true), on("2026-09-02", true), on("2026-09-02", true)];
    const early = on("2026-09-02", true);
    expect(state([...mastered, early], "2026-09-02")).toMatchObject({ box: 1, nextReview: "2026-09-03" });
  });

  it("sends a mastered skill back to learning after one miss, and needs 4 of 5 again", () => {
    const mastered = [on("2026-09-01", true), on("2026-09-01", true), on("2026-09-02", true), on("2026-09-02", true), on("2026-09-02", true)];
    const miss = on("2026-09-05", false);
    expect(state([...mastered, miss], "2026-09-05")).toMatchObject({ status: "learning", box: 0, nextReview: null });
    // The window now holds 4 right and the miss; one more right on a new day brings it back.
    expect(state([...mastered, miss, on("2026-09-06", true)], "2026-09-06").status).toBe("mastered");
  });

  it("counts a question toward every skill it is tagged with, and orders by time not input order", () => {
    const attempts = [on("2026-09-02", true, "qab"), on("2026-09-01", false, "qab")].reverse();
    expect(state(attempts, "2026-09-02", "MATH-B")).toMatchObject({ attempts: 2, recent: [false, true], lastPracticed: "2026-09-02" });
  });

  it("skips attempts on questions that no longer exist", () => {
    expect(state([on("2026-09-01", true, "deleted")], "2026-09-01").status).toBe("new");
  });
});
