import { z } from "zod";

/** A question pulled out of a contest PDF. It is never loaded by the app; a person or agent completes and verifies it first. */
export const DraftQuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  source: z.object({ kind: z.literal("contest"), ref: z.string().min(1) }),
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).max(5),
  correctIndex: z.int().min(0).nullable(),
  band: z.int().min(1).max(5),
  needsDiagram: z.boolean(),
  skills: z.array(z.string()),
  reviewStatus: z.literal("draft"),
});
export type DraftQuestion = z.infer<typeof DraftQuestionSchema>;

export type PageLines = { page: number; lines: string[] };

const PROBLEM_START = /^\s*(\d{1,2})[.)]\s+(.*)$/;
const CHOICE = /\(([A-E])\)\s*/g;
const DIAGRAM_WORDS = /\b(picture|figure|diagram|shown|below|drawing|image)\b/i;

/** Splits "(A) 3 (B) 4 (C) 5" into ["3", "4", "5"] and returns the text before the first choice as the stem. */
export function splitChoices(text: string): { stem: string; choices: string[] } {
  const marks = [...text.matchAll(CHOICE)];
  if (marks.length < 2 || marks[0][1] !== "A") return { stem: text.trim(), choices: [] };
  const stem = text.slice(0, marks[0].index).trim();
  const choices = marks.map((m, i) => text.slice(m.index! + m[0].length, i + 1 < marks.length ? marks[i + 1].index : undefined).trim());
  return { stem, choices: choices.every(Boolean) ? choices : [] };
}

/**
 * Math Kangaroo sections: problems 1 to 8 are 3 points, 9 to 16 are 4 points, 17 to 24 are 5 points.
 * Mapped to bands 1, 2 and 3 for the lower levels; anything later is band 4.
 */
export function guessBand(problemNumber: number): number {
  if (problemNumber <= 8) return 1;
  if (problemNumber <= 16) return 2;
  if (problemNumber <= 24) return 3;
  return 4;
}

/** Parses "1:B, 2:D" into a map from problem number to choice index. */
export function parseAnswerKey(key: string | undefined): Map<number, number> {
  const map = new Map<number, number>();
  for (const part of (key ?? "").split(",")) {
    const m = part.trim().match(/^(\d{1,2})\s*[:=]\s*([A-E])$/i);
    if (m) map.set(Number(m[1]), m[2].toUpperCase().charCodeAt(0) - 65);
  }
  return map;
}

/** Turns extracted page lines into draft questions: a numbered line starts a problem, following lines continue it. */
export function linesToDrafts(pages: PageLines[], slug: string, fileName: string, answers = new Map<number, number>()): DraftQuestion[] {
  const found: { number: number; page: number; text: string }[] = [];
  let current: { number: number; page: number; text: string } | null = null;
  for (const { page, lines } of pages) {
    for (const raw of lines) {
      const line = raw.replace(/\s+/g, " ").trim();
      if (!line) continue;
      const start = line.match(PROBLEM_START);
      const next = start ? Number(start[1]) : null;
      // A new problem must count upward (allowing a few skipped numbers), so a stray "3)" inside a problem does not start a new one.
      if (next !== null && (current === null || (next > current.number && next <= current.number + 10))) {
        if (current) found.push(current);
        current = { number: next, page, text: start![2] };
      } else if (current) {
        current.text += ` ${line}`;
      }
    }
  }
  if (current) found.push(current);

  return found.map(({ number, page, text }) => {
    const split = splitChoices(text);
    // More than 5 choices means two problems ran together; keep the text and let a person split it.
    const { stem, choices } = split.choices.length > 5 ? { stem: text.trim(), choices: [] } : split;
    const answer = answers.get(number);
    return DraftQuestionSchema.parse({
      id: `${slug}-p${number}`,
      source: { kind: "contest", ref: `${fileName}, page ${page}, problem ${number}` },
      prompt: stem,
      choices,
      correctIndex: answer !== undefined && answer < choices.length ? answer : null,
      band: guessBand(number),
      needsDiagram: DIAGRAM_WORDS.test(stem),
      skills: [],
      reviewStatus: "draft",
    });
  });
}
