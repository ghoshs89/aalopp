import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Question } from "../../src/content/schema";
import { batch2Questions } from "./batch2";
import { carQuestions } from "./cars";
import { cognitiveQuestions } from "./cognitive";
import { debuggingQuestions } from "./debugging";
import { geometryQuestions } from "./geometry";
import { ixlTargetedQuestions } from "./ixl-targeted";
import { languageQuestions } from "./languages";
import { logicQuestions } from "./logic";
import { worldQuestions } from "./world";
import { measurementQuestions } from "./measurement";
import { numberQuestions } from "./numbers";

/** Generated question files. Answers are computed in these scripts; edit the scripts, never the JSON. */
export const GENERATED: Record<string, () => Question[]> = {
  "generated-measurement.json": measurementQuestions,
  "generated-numbers.json": numberQuestions,
  "generated-geometry.json": geometryQuestions,
  "generated-logic.json": logicQuestions,
  "generated-debugging.json": debuggingQuestions,
  "generated-batch2.json": batch2Questions,
  "generated-languages.json": languageQuestions,
  "generated-world.json": worldQuestions,
  "generated-cars.json": carQuestions,
  "generated-ixl-targeted.json": ixlTargetedQuestions,
  "generated-cognitive.json": cognitiveQuestions,
};

export function renderFile(questions: Question[]): string {
  return `${JSON.stringify(questions, null, 2)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  for (const [file, build] of Object.entries(GENERATED)) {
    const questions = build();
    writeFileSync(path.join(process.cwd(), "content/questions", file), renderFile(questions));
    console.log(`${file}: ${questions.length} questions`);
  }
}
