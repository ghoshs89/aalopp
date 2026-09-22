import type { Question, Skill, Theme, Visual } from "./schema";

export type ContentIssue = { file?: string; path: string; message: string };

export type SourcedQuestion = { file: string; question: Question };

/** Returns one prerequisite cycle as a list of skill codes (first code repeated at the end), or null. */
export function findCycle(skills: Skill[]): string[] | null {
  const prereqs = new Map(skills.map((s) => [s.code, s.prerequisites]));
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];

  const visit = (code: string): string[] | null => {
    if (state.get(code) === "done") return null;
    if (state.get(code) === "visiting") return [...stack.slice(stack.indexOf(code)), code];
    state.set(code, "visiting");
    stack.push(code);
    for (const next of prereqs.get(code) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(code, "done");
    return null;
  };

  for (const skill of skills) {
    const cycle = visit(skill.code);
    if (cycle) return cycle;
  }
  return null;
}

/** Every picture a question can point at, including the ones inside a teach card or on the answer choices. */
function picturesIn(question: Question): Visual[] {
  const found: Visual[] = [];
  if (question.visual) found.push(question.visual);
  if (question.teach?.visual) found.push(question.teach.visual);
  if (question.answer.type === "choice" && question.answer.choiceVisuals) found.push(...question.answer.choiceVisuals);
  return found;
}

/**
 * Cross-file checks that a per-item schema cannot see: references, uniqueness, cycles, copy-paste duplicates.
 * `assetPaths` is every picture committed under public/, so a question pointing at a file nobody downloaded fails
 * here rather than showing Aishik a broken box.
 */
export function checkContent(skills: Skill[], questions: SourcedQuestion[], themes: Theme[] = [], assetPaths?: Set<string>): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const codes = new Set<string>();

  for (const skill of skills) {
    if (codes.has(skill.code)) issues.push({ path: skill.code, message: "Duplicate skill code" });
    codes.add(skill.code);
  }
  for (const skill of skills) {
    for (const prereq of skill.prerequisites) {
      if (!codes.has(prereq)) issues.push({ path: skill.code, message: `Unknown prerequisite ${prereq}` });
    }
  }
  const cycle = findCycle(skills);
  if (cycle) issues.push({ path: cycle[0], message: `Prerequisite cycle: ${cycle.join(" -> ")}` });

  const ids = new Map<string, string>();
  const fingerprints = new Map<string, string>();
  for (const { file, question } of questions) {
    const seenIn = ids.get(question.id);
    if (seenIn) issues.push({ file, path: question.id, message: `Duplicate question id (also in ${seenIn})` });
    ids.set(question.id, file);

    for (const skill of question.skills) {
      if (!codes.has(skill)) issues.push({ file, path: question.id, message: `Unknown skill ${skill}` });
    }

    // Questions that share a prompt can still differ by picture, reading passage or the word to hear.
    const fingerprint = JSON.stringify([normalize(question.prompt), question.visual ?? null, question.passage ?? null, question.listen ?? null]);
    const twin = fingerprints.get(fingerprint);
    if (twin) issues.push({ file, path: question.id, message: `Same prompt, visual, passage and listening word as ${twin}` });
    fingerprints.set(fingerprint, question.id);
  }

  const themeIds = new Set<string>();
  for (const theme of themes) {
    if (themeIds.has(theme.id)) issues.push({ file: "themes.json", path: theme.id, message: "Duplicate theme id" });
    themeIds.add(theme.id);
    for (const skill of theme.skills) {
      if (!codes.has(skill)) issues.push({ file: "themes.json", path: theme.id, message: `Unknown skill ${skill}` });
    }
    const covered = questions.some(({ question }) => question.skills.some((c) => theme.skills.includes(c)));
    if (!covered) issues.push({ file: "themes.json", path: theme.id, message: "No question uses any of this theme's skills" });
  }

  if (assetPaths) {
    for (const { file, question } of questions) {
      for (const picture of picturesIn(question)) {
        if (picture.kind !== "image") continue;
        for (const src of [picture.src, picture.beside?.src].filter((s) => s !== undefined)) {
          if (!assetPaths.has(src)) {
            issues.push({ file, path: question.id, message: `Picture ${src} is not committed under public/. Add it to content/assets.json and run npm run assets:fetch` });
          }
        }
      }
    }
  }

  return issues;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}
