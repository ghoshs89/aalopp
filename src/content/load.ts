import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { checkContent, type ContentIssue, type SourcedQuestion } from "./graph";
import { QuestionFileSchema, SkillFileSchema, ThemeFileSchema, type Skill, type Theme } from "./schema";

export type LoadedContent = {
  skills: Skill[];
  questions: SourcedQuestion[];
  themes: Theme[];
  issues: ContentIssue[];
};

export function loadContent(contentDir = path.join(process.cwd(), "content")): LoadedContent {
  const issues: ContentIssue[] = [];

  const skills = parseFile(path.join(contentDir, "skills.json"), SkillFileSchema, issues) ?? [];

  const questionDir = path.join(contentDir, "questions");
  const questions: SourcedQuestion[] = [];
  for (const name of readdirSync(questionDir).filter((f) => f.endsWith(".json")).sort()) {
    const file = `questions/${name}`;
    const parsed = parseFile(path.join(questionDir, name), QuestionFileSchema, issues, file);
    for (const question of parsed ?? []) questions.push({ file, question });
  }

  const themes = parseFile(path.join(contentDir, "themes.json"), ThemeFileSchema, issues, "themes.json") ?? [];

  issues.push(...checkContent(skills, questions, themes, committedPictures(contentDir)));
  return { skills, questions, themes, issues };
}

/** Every picture actually present under public/, as the paths a question would use. */
function committedPictures(contentDir: string): Set<string> {
  const publicDir = path.join(path.dirname(contentDir), "public");
  const found = new Set<string>();
  for (const folder of ["flags", "logos"]) {
    const dir = path.join(publicDir, folder);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) found.add(`/${folder}/${name}`);
  }
  return found;
}

function parseFile<T extends z.ZodType>(
  absolutePath: string,
  schema: T,
  issues: ContentIssue[],
  file = path.basename(absolutePath),
): z.infer<T> | null {
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    issues.push({ file, path: "", message: `Cannot read JSON: ${(error as Error).message}` });
    return null;
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    for (const issue of result.error.issues) {
      issues.push({ file, path: issue.path.join("."), message: issue.message });
    }
    return null;
  }
  return result.data;
}
