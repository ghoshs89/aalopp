import bebras from "../../content/questions/bebras-style-starter.json";
import kangaroo from "../../content/questions/kangaroo-style-l12.json";
import measurement from "../../content/questions/measurement-cars.json";
import skillsJson from "../../content/skills.json";
import { QuestionFileSchema, SkillFileSchema, type Question, type Skill } from "./schema";

// Static imports so the question bank ships inside the server bundle on Vercel.
// src/content/bank.test.ts fails if a file in content/questions is missing here.
export const QUESTION_FILES: Record<string, unknown> = {
  "bebras-style-starter.json": bebras,
  "kangaroo-style-l12.json": kangaroo,
  "measurement-cars.json": measurement,
};

export const skills: Skill[] = SkillFileSchema.parse(skillsJson);

export const questions: Question[] = Object.values(QUESTION_FILES).flatMap((file) => QuestionFileSchema.parse(file));

export const questionsById = new Map(questions.map((q) => [q.id, q]));
