import type { Question, Skill } from "@/content/schema";

export type PastAttempt = { questionId: string; isCorrect: boolean; answeredAt: Date };

export type SessionPlan = { questionIds: string[]; reasons: Record<string, string> };

export const SESSION_SIZE = 8;
const MIN_CONVENTION_ITEMS = 3;

/**
 * Picks one session: questions never tried first, then ones answered wrong, then the longest-ago correct ones.
 * Guarantees a few applied-convention items (time, money, measuring, graphs) without ever locking anything.
 * Pure and seedable so tests can pin the order.
 */
export function selectSession(
  questions: Question[],
  skills: Skill[],
  history: PastAttempt[],
  random: () => number = Math.random,
  size = SESSION_SIZE,
): SessionPlan {
  const conventionSkills = new Set(skills.filter((s) => s.isConvention).map((s) => s.code));
  const isConvention = (q: Question) => q.skills.some((code) => conventionSkills.has(code));

  const latest = new Map<string, PastAttempt>();
  for (const attempt of history) {
    const seen = latest.get(attempt.questionId);
    if (!seen || attempt.answeredAt > seen.answeredAt) latest.set(attempt.questionId, attempt);
  }

  const reasonFor = (q: Question) => {
    const last = latest.get(q.id);
    if (!last) return { rank: 0, reason: "new" };
    if (!last.isCorrect) return { rank: 1, reason: "try again" };
    return { rank: 2, reason: "review" };
  };

  // Shuffle first so ties break randomly, then sort by rank, band, and for reviews the oldest attempt first.
  const ranked = shuffle(questions, random)
    .map((q) => ({ q, ...reasonFor(q), lastAt: latest.get(q.id)?.answeredAt.getTime() ?? 0 }))
    .sort((a, b) => a.rank - b.rank || (a.rank === 2 ? a.lastAt - b.lastAt : 0));

  const picked: typeof ranked = [];
  const conventionPool = ranked.filter((r) => isConvention(r.q));
  for (const r of conventionPool.slice(0, Math.min(MIN_CONVENTION_ITEMS, size))) picked.push(r);
  for (const r of ranked) {
    if (picked.length >= size) break;
    if (!picked.includes(r)) picked.push(r);
  }

  // Warm up with easier items, and keep the order stable within a band.
  const ordered = picked.sort((a, b) => a.q.difficulty.band - b.q.difficulty.band);
  return {
    questionIds: ordered.map((r) => r.q.id),
    reasons: Object.fromEntries(ordered.map((r) => [r.q.id, r.reason])),
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
