import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { QUESTION_FILES, questions } from "./bank";
import { loadContent } from "./load";

describe("question bank", () => {
  it("bundles every file in content/questions", () => {
    const onDisk = readdirSync(path.join(process.cwd(), "content/questions")).filter((f) => f.endsWith(".json"));
    expect(Object.keys(QUESTION_FILES).sort()).toEqual(onDisk.sort());
  });

  it("matches what the validator loads from disk", () => {
    expect(questions.map((q) => q.id).sort()).toEqual(loadContent().questions.map(({ question }) => question.id).sort());
  });
});
