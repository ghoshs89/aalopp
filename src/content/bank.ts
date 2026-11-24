import bebras from "../../content/questions/bebras-style-starter.json";
import generatedBatch2 from "../../content/questions/generated-batch2.json";
import generatedCars from "../../content/questions/generated-cars.json";
import generatedCognitive from "../../content/questions/generated-cognitive.json";
import generatedDebugging from "../../content/questions/generated-debugging.json";
import generatedGeometry from "../../content/questions/generated-geometry.json";
import generatedIxlTargeted from "../../content/questions/generated-ixl-targeted.json";
import generatedLanguages from "../../content/questions/generated-languages.json";
import generatedLogic from "../../content/questions/generated-logic.json";
import generatedMeasurement from "../../content/questions/generated-measurement.json";
import generatedWorld from "../../content/questions/generated-world.json";
import generatedNumbers from "../../content/questions/generated-numbers.json";
import kangaroo from "../../content/questions/kangaroo-style-l12.json";
import measurement from "../../content/questions/measurement-cars.json";
import skillsJson from "../../content/skills.json";
import themesJson from "../../content/themes.json";
import { QuestionFileSchema, SkillFileSchema, ThemeFileSchema, type Question, type Skill, type Theme } from "./schema";

// Static imports so the question bank ships inside the server bundle on Vercel.
// src/content/bank.test.ts fails if a file in content/questions is missing here.
export const QUESTION_FILES: Record<string, unknown> = {
  "bebras-style-starter.json": bebras,
  "generated-batch2.json": generatedBatch2,
  "generated-cars.json": generatedCars,
  "generated-cognitive.json": generatedCognitive,
  "generated-debugging.json": generatedDebugging,
  "generated-geometry.json": generatedGeometry,
  "generated-ixl-targeted.json": generatedIxlTargeted,
  "generated-languages.json": generatedLanguages,
  "generated-logic.json": generatedLogic,
  "generated-measurement.json": generatedMeasurement,
  "generated-world.json": generatedWorld,
  "generated-numbers.json": generatedNumbers,
  "kangaroo-style-l12.json": kangaroo,
  "measurement-cars.json": measurement,
};

export const skills: Skill[] = SkillFileSchema.parse(skillsJson);

export const questions: Question[] = Object.values(QUESTION_FILES).flatMap((file) => QuestionFileSchema.parse(file));

export const questionsById = new Map(questions.map((q) => [q.id, q]));

export const themes: Theme[] = ThemeFileSchema.parse(themesJson);
