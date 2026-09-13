import type { Question, Skill } from "./schema";

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

/** Cross-file checks that a per-item schema cannot see: references, uniqueness, cycles, copy-paste duplicates. */
export function checkContent(skills: Skill[], questions: SourcedQuestion[]): ContentIssue[] {
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

  return issues;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}
