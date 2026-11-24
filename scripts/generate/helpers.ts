import type { Question, Visual } from "../../src/content/schema";

export type Draft = {
  id: string;
  skills: string[];
  prompt: string;
  speech?: string;
  visual?: Visual;
  passage?: string;
  listen?: Question["listen"];
  voiceAnswer?: boolean;
  /** Language of the answer choices; defaults to English. */
  language?: Question["language"];
  /** Optional 1-tap clue shown while answering so the child can work through a hard puzzle without giving up. */
  hint?: string;
  answer: Question["answer"];
  explanation: string;
  band: 1 | 2 | 3 | 4 | 5;
  /** A card shown before the question the first time he meets it. */
  teach?: Question["teach"];
  /** What the question is about, so a session asks only one question per brand or country. */
  topic?: Question["topic"];
  /** A second, different fact shown after he answers. See the schema's own comment on this field. */
  didYouKnow?: Question["didYouKnow"];
  /**
   * Knowledge questions ship as drafts. A generator can compute that 4 + 3 is 7, but it cannot check that Ferrari is
   * Italian, so those facts need a separate checking pass before the player will serve them.
   */
  review?: Question["reviewStatus"];
};

/** Wraps a draft into a full question. Generated questions compute their own answers, so they ship as reviewed. */
export function question(file: string, d: Draft): Question {
  return {
    id: d.id,
    source: { kind: "original", ref: `scripts/generate/${file}` },
    skills: d.skills,
    language: d.language ?? "en",
    prompt: d.prompt,
    ...(d.speech ? { speech: d.speech } : {}),
    ...(d.visual ? { visual: d.visual } : {}),
    ...(d.passage ? { passage: d.passage } : {}),
    ...(d.teach ? { teach: d.teach } : {}),
    ...(d.topic ? { topic: d.topic } : {}),
    ...(d.didYouKnow ? { didYouKnow: d.didYouKnow } : {}),
    ...(d.listen ? { listen: d.listen } : {}),
    ...(d.voiceAnswer ? { voiceAnswer: true } : {}),
    ...(d.hint ? { hint: d.hint } : {}),
    answer: d.answer,
    explanation: d.explanation,
    difficulty: { band: d.band, basis: "author-estimate" },
    reviewStatus: d.review ?? "reviewed",
  };
}

export function hash(text: string): number {
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

/**
 * Picks `count` items spread across a list, deterministically from `seed`. Source tables are grouped by country, so
 * taking the first few or a consecutive run would hand every question the same decoys, and he would learn to spot the
 * odd one out instead of learning the logos. Striding across the list mixes countries, and with them colours.
 */
export function pickSpread<T>(pool: T[], count: number, seed: string): T[] {
  if (pool.length === 0) return [];
  const start = hash(seed) % pool.length;
  const stride = Math.max(1, Math.floor(pool.length / (count + 1)));
  const out: T[] = [];
  for (let i = 0; out.length < count && i < pool.length * 2; i++) {
    const item = pool[(start + i * stride + Math.floor(i / pool.length)) % pool.length];
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
