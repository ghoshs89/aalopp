import type { Question, Visual } from "../../src/content/schema";

export type Draft = {
  id: string;
  skills: string[];
  prompt: string;
  speech?: string;
  visual?: Visual;
  answer: Question["answer"];
  explanation: string;
  band: 1 | 2 | 3 | 4 | 5;
};

/** Wraps a draft into a full question. Generated questions compute their own answers, so they ship as reviewed. */
export function question(file: string, d: Draft): Question {
  return {
    id: d.id,
    source: { kind: "original", ref: `scripts/generate/${file}` },
    skills: d.skills,
    language: "en",
    prompt: d.prompt,
    ...(d.speech ? { speech: d.speech } : {}),
    ...(d.visual ? { visual: d.visual } : {}),
    answer: d.answer,
    explanation: d.explanation,
    difficulty: { band: d.band, basis: "author-estimate" },
    reviewStatus: "reviewed",
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return h >>> 0;
}

/**
 * Multiple choice with the correct answer at a position derived from the id, so answers are spread across A to E
 * but regenerate identically. Duplicate distractors (and any equal to the answer) are dropped.
 */
export function choices(id: string, correct: string | number, distractors: (string | number)[], max = 4): Question["answer"] {
  const right = String(correct);
  const wrong = [...new Set(distractors.map(String))].filter((d) => d !== right).slice(0, max - 1);
  if (wrong.length === 0) throw new Error(`${id}: needs at least one distinct distractor`);
  const list = [...wrong];
  const at = hash(id) % (wrong.length + 1);
  list.splice(at, 0, right);
  return { type: "choice", choices: list, correctIndex: at };
}

export function numeric(value: number, unit?: string): Question["answer"] {
  return unit ? { type: "numeric", value, unit } : { type: "numeric", value };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** 12-hour clock arithmetic: hour in 1..12. */
export function addMinutes(hour: number, minute: number, add: number) {
  const total = ((((hour % 12) * 60 + minute + add) % 720) + 720) % 720;
  const h = Math.floor(total / 60);
  return { hour: h === 0 ? 12 : h, minute: total % 60 };
}

export const timeLabel = (hour: number, minute: number) => `${hour}:${pad2(minute)}`;

export function dollars(cents: number): string {
  if (cents < 100) return `${cents} cents`;
  return `$${Math.floor(cents / 100)}.${pad2(cents % 100)}`;
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
