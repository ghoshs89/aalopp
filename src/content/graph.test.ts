import { describe, expect, it } from "vitest";
import { checkContent, findCycle } from "./graph";
import { QuestionSchema, type Skill } from "./schema";

const skill = (code: string, prerequisites: string[] = []): Skill => ({
  code,
  name: code,
  domain: "MATHEMATICS",
  strand: "OPERATIONS_ALGEBRA",
  tier: 1,
  isConvention: false,
  prerequisites,
});

const question = (id: string, prompt: string, skills = ["MATH-A"]) =>
  QuestionSchema.parse({
    id,
    source: { kind: "original" },
    skills,
    prompt,
    answer: { type: "numeric", value: 1 },
    explanation: "Because.",
    difficulty: { band: 1, basis: "author-estimate" },
    reviewStatus: "draft",
  });

describe("findCycle", () => {
  it("returns null for a valid prerequisite graph", () => {
    expect(findCycle([skill("MATH-A"), skill("MATH-B", ["MATH-A"]), skill("MATH-C", ["MATH-A", "MATH-B"])])).toBeNull();
  });

  it("returns the cycle path when prerequisites loop", () => {
    const cycle = findCycle([skill("MATH-A", ["MATH-C"]), skill("MATH-B", ["MATH-A"]), skill("MATH-C", ["MATH-B"])]);
    expect(cycle).toEqual(["MATH-A", "MATH-C", "MATH-B", "MATH-A"]);
  });

  it("catches a skill that requires itself", () => {
    expect(findCycle([skill("MATH-A", ["MATH-A"])])).toEqual(["MATH-A", "MATH-A"]);
  });
});

describe("checkContent", () => {
  const skills = [skill("MATH-A"), skill("MATH-B", ["MATH-A"])];

  it("passes clean content", () => {
    expect(checkContent(skills, [{ file: "q.json", question: question("q-1", "One?") }])).toEqual([]);
  });

  it("flags unknown prerequisites and unknown question skills", () => {
    const issues = checkContent([skill("MATH-A", ["MATH-MISSING"])], [
      { file: "q.json", question: question("q-1", "One?", ["MATH-NOPE"]) },
    ]);
    expect(issues.map((i) => i.message)).toEqual(["Unknown prerequisite MATH-MISSING", "Unknown skill MATH-NOPE"]);
  });

  it("flags duplicate ids and copy-pasted questions", () => {
    const issues = checkContent(skills, [
      { file: "a.json", question: question("q-1", "Same prompt") },
      { file: "b.json", question: question("q-1", "Different prompt") },
      { file: "b.json", question: question("q-2", "  same   PROMPT ") },
    ]);
    expect(issues.map((i) => i.message)).toEqual([
      "Duplicate question id (also in a.json)",
      "Same prompt and visual as q-1",
    ]);
  });
});
