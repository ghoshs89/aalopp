import type { Question, Skill } from "@/content/schema";
import { addDays, type LocalDate } from "./dates";

export type AttemptRecord = {
  questionId: string;
  isCorrect: boolean;
  answeredAt: Date;
  /** The date on the device when the answer was given. */
  localDate: LocalDate;
};

export type SkillStatus = "new" | "learning" | "mastered" | "review-due";

export type SkillState = {
  code: string;
  status: SkillStatus;
  attempts: number;
  /** Oldest first, at most MASTERY_WINDOW. */
  recent: boolean[];
  /** Spaced-review box: 0 while learning, 1 to 5 once mastered. */
  box: number;
  lastPracticed: LocalDate | null;
  masteredOn: LocalDate | null;
  nextReview: LocalDate | null;
};

export const MASTERY_WINDOW = 5;
export const MASTERY_CORRECT = 4;
export const MASTERY_MIN_DAYS = 2;
/**
 * Days until the next review after landing in box 1 to 5. The last box is what keeps the review queue servable:
 * a settled skill needs a review every 30 days, so N skills demand N/30 reviews a day against the 4 a session can
 * serve. At a 14 day top box, 48 skills demanded 3.4 a day and 58 skills demanded 4.1, which the session could not
 * meet, and the due queue grew without bound.
 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

type Entry = { isCorrect: boolean; localDate: LocalDate };

/**
 * Replays the attempt log in time order to get each skill's state. Nothing here is stored: the attempt log is the
 * only source of truth, so every device computes the same answer.
 *
 * Rules:
 * - Mastered: at least 4 of the last 5 answers right, and those right answers were on at least 2 different days.
 * - Once mastered, the skill waits 1 day, then 3, then 7, then 14, then 30 between reviews. A right answer on or after the
 *   review date moves it up a box. A wrong answer drops it one box, and only a miss in box 1 returns it to learning.
 */
export function computeSkillStates(skills: Skill[], questionsById: Map<string, Question>, attempts: AttemptRecord[], today: LocalDate): Map<string, SkillState> {
  const bySkill = new Map<string, Entry[]>(skills.map((s) => [s.code, []]));
  const ordered = [...attempts].sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());
  for (const attempt of ordered) {
    const question = questionsById.get(attempt.questionId);
    if (!question) continue;
    for (const code of question.skills) bySkill.get(code)?.push({ isCorrect: attempt.isCorrect, localDate: attempt.localDate });
  }

  const states = new Map<string, SkillState>();
  for (const skill of skills) states.set(skill.code, replay(skill.code, bySkill.get(skill.code) ?? [], today));
  return states;
}

function replay(code: string, entries: Entry[], today: LocalDate): SkillState {
  const window: Entry[] = [];
  let box = 0;
  let masteredOn: LocalDate | null = null;
  let nextReview: LocalDate | null = null;

  for (const entry of entries) {
    window.push(entry);
    if (window.length > MASTERY_WINDOW) window.shift();

    if (box > 0) {
      if (!entry.isCorrect) {
        // A miss drops one box rather than wiping the skill, so a few days away from the app does not
        // erase weeks of work. Only a miss in box 1 sends it back to learning.
        box -= 1;
        if (box === 0) {
          masteredOn = null;
          nextReview = null;
        } else {
          nextReview = addDays(entry.localDate, REVIEW_INTERVALS[box - 1]);
        }
      } else if (nextReview !== null && entry.localDate >= nextReview) {
        box = Math.min(box + 1, REVIEW_INTERVALS.length);
        nextReview = addDays(entry.localDate, REVIEW_INTERVALS[box - 1]);
      }
      continue;
    }

    if (meetsMastery(window)) {
      box = 1;
      masteredOn = entry.localDate;
      nextReview = addDays(entry.localDate, REVIEW_INTERVALS[0]);
    }
  }

  const status: SkillStatus = entries.length === 0 ? "new" : box === 0 ? "learning" : nextReview !== null && today >= nextReview ? "review-due" : "mastered";
  return {
    code,
    status,
    attempts: entries.length,
    recent: window.map((e) => e.isCorrect),
    box,
    lastPracticed: entries.at(-1)?.localDate ?? null,
    masteredOn,
    nextReview,
  };
}

function meetsMastery(window: Entry[]): boolean {
  if (window.length < MASTERY_WINDOW) return false;
  const right = window.filter((e) => e.isCorrect);
  return right.length >= MASTERY_CORRECT && new Set(right.map((e) => e.localDate)).size >= MASTERY_MIN_DAYS;
}
