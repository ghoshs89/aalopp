import { describe, expect, it } from "vitest";
import { loadContent } from "./load";

describe("repository content", () => {
  const { skills, questions, issues } = loadContent();

  it("has no schema, reference, cycle or duplicate issues", () => {
    expect(issues).toEqual([]);
  });

  it("has enough questions for a first session", () => {
    expect(questions.length).toBeGreaterThanOrEqual(30);
  });

  it("covers the weakest strand, Measurement and Data, with applied-convention skills", () => {
    const conventionCodes = new Set(skills.filter((s) => s.isConvention).map((s) => s.code));
    const conventionQuestions = questions.filter(({ question }) => question.skills.some((c) => conventionCodes.has(c)));
    expect(conventionQuestions.length).toBeGreaterThanOrEqual(10);
  });
});
