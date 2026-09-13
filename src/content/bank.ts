import bebras from "../../content/questions/bebras-style-starter.json";
import generatedDebugging from "../../content/questions/generated-debugging.json";
import generatedGeometry from "../../content/questions/generated-geometry.json";
import generatedLogic from "../../content/questions/generated-logic.json";
import generatedMeasurement from "../../content/questions/generated-measurement.json";
import generatedNumbers from "../../content/questions/generated-numbers.json";
import kangaroo from "../../content/questions/kangaroo-style-l12.json";
import measurement from "../../content/questions/measurement-cars.json";
import skillsJson from "../../content/skills.json";
import { QuestionFileSchema, SkillFileSchema, type Question, type Skill } from "./schema";

// Static imports so the question bank ships inside the server bundle on Vercel.
// src/content/bank.test.ts fails if a file in content/questions is missing here.
export const QUESTION_FILES: Record<string, unknown> = {
  "bebras-style-starter.json": bebras,
  "generated-debugging.json": generatedDebugging,
  "generated-geometry.json": generatedGeometry,
  "generated-logic.json": generatedLogic,
  "generated-measurement.json": generatedMeasurement,
  "generated-numbers.json": generatedNumbers,
  "kangaroo-style-l12.json": kangaroo,
  "measurement-cars.json": measurement,
};

export const skills: Skill[] = SkillFileSchema.parse(skillsJson);

export const questions: Question[] = Object.values(QUESTION_FILES).flatMap((file) => QuestionFileSchema.parse(file));

export const questionsById = new Map(questions.map((q) => [q.id, q]));
