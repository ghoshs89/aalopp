import { describe, expect, it } from "vitest";
import { QuestionSchema } from "./schema";

const valid = {
  id: "test-question",
  source: { kind: "original" },
  skills: ["MATH-OA-ADD-SUB"],
  prompt: "What is 2 + 3?",
  answer: { type: "choice", choices: ["4", "5", "6"], correctIndex: 1 },
  explanation: "2 + 3 = 5.",
  difficulty: { band: 1, basis: "author-estimate" },
  reviewStatus: "reviewed",
};

const messages = (input: unknown) => {
  const result = QuestionSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("QuestionSchema", () => {
  it("accepts a valid question and defaults language to English", () => {
    const result = QuestionSchema.parse(valid);
    expect(result.language).toBe("en");
  });

  it("rejects a correctIndex past the end of the choices", () => {
    expect(messages({ ...valid, answer: { ...valid.answer, correctIndex: 3 } })).toContain(
      "correctIndex 3 is out of range for 3 choices",
    );
  });

  it("rejects duplicate choices", () => {
    expect(messages({ ...valid, answer: { ...valid.answer, choices: ["5", "5", "6"] } })).toContain(
      "Choices must be unique",
    );
  });

  it("rejects em dashes anywhere, including nested visuals", () => {
    const withDash = { ...valid, visual: { kind: "emoji", lines: ["one — two"] } };
    expect(messages(withDash)).toContain("Em dashes are not allowed in content");
  });

  it("requires points when difficulty comes from Kangaroo point values", () => {
    expect(messages({ ...valid, difficulty: { band: 1, basis: "kangaroo-points" } })).toContain(
      "kangaroo-points difficulty needs a points value",
    );
  });

  it("rejects clock times that do not exist", () => {
    expect(messages({ ...valid, visual: { kind: "clock", hour: 13, minute: 0 } })).not.toHaveLength(0);
  });
});
