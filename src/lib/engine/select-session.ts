import type { Question, Skill } from "@/content/schema";
import { daysBetween, type LocalDate } from "./dates";
import { computeSkillStates, type AttemptRecord, type SkillState } from "./skill-state";

export const SESSION_SIZE = 8;
const MIN_CONVENTION_ITEMS = 3;
/**
 * One slot is held for a skill he has not met yet. Without it a skill in `learning` (score 80 to 95) always
 * outscores a `new` one (50 to 68), so once enough skills are in progress no new skill is ever introduced.
 */
const MIN_NEW_ITEMS = 1;
/**
 * One slot in an ordinary session goes to a theme (cars, flags and countries), so he keeps meeting the world even on
 * days he does not choose a theme himself. A theme question that already arrived through the new-skill slot counts
 * toward this, rather than a second slot being reserved on top.
 */
const MIN_THEME_ITEMS = 1;
const STRETCH_SLOTS = 2;
const MAX_REVIEWS = 4;
const MAX_RETRIES = 2;
const MAX_PER_SKILL = 2;
/** A question answered right within this many days is not asked again unless the pool runs dry. */
const REPEAT_COOLDOWN_DAYS = 14;
/** Every child starts here: MAP and IXL place Aishik above the easiest band. */
const STARTING_BAND = 2;

export type Pick = { questionId: string; reason: string };
export type SessionPlan = { picks: Pick[]; workingBands: Record<string, number> };

export type SessionOptions = {
  /** Every skill that belongs to some theme. One slot per session is kept for one of them. */
  themeSkills?: Set<string>;
  /** Set when the child picked a theme: the whole session is drawn from these skills. */
  onlySkills?: Set<string>;
};

type Category = "review" | "retry" | "practice" | "new" | "maintain";

type Candidate = {
  question: Question;
  skill: Skill;
  state: SkillState;
  category: Category;
  score: number;
  isStretch: boolean;
  isConvention: boolean;
  blocked: boolean;
  reason: string;
};

/**
 * Chooses one session from the attempt log. Pure and seedable.
 *
 * Priority: questions missed on an earlier day, then skills due for review, then one skill he has not met yet,
 * then skills in progress. Two stretch slots go to questions one band above the child's working band for that
 * strand. At least 3 applied-convention questions are always included, and nothing is ever locked.
 */
export function selectSession(
  questions: Question[],
  skills: Skill[],
  attempts: AttemptRecord[],
  today: LocalDate,
  random: () => number = Math.random,
  size = SESSION_SIZE,
  options: SessionOptions = {},
): SessionPlan {
  const { themeSkills, onlySkills } = options;
  const skillByCode = new Map(skills.map((s) => [s.code, s]));
  const questionsById = new Map(questions.map((q) => [q.id, q]));
  const states = computeSkillStates(skills, questionsById, attempts, today);
  const workingBands = computeWorkingBands(questions, skillByCode, attempts);

  const lastByQuestion = new Map<string, AttemptRecord>();
  for (const a of [...attempts].sort((x, y) => x.answeredAt.getTime() - y.answeredAt.getTime())) lastByQuestion.set(a.questionId, a);

  // Skill states and working bands are always computed from the whole bank, so picking a theme does not distort what
  // the engine believes about him. Only the list he can be offered narrows.
  const offerable = onlySkills ? questions.filter((q) => q.skills.some((c) => onlySkills.has(c))) : questions;

  const candidates: Candidate[] = offerable.map((question) => {
    // A question belongs to its most urgent skill.
    const options = question.skills.map((code) => ({ skill: skillByCode.get(code)!, state: states.get(code)! })).filter((o) => o.skill);
    const { skill, state } = options.reduce((best, o) => (urgency(o.state, skillByCode, states) > urgency(best.state, skillByCode, states) ? o : best));
    const working = workingBands[skill.strand] ?? STARTING_BAND;
    const band = question.difficulty.band;
    const last = lastByQuestion.get(question.id);
    const isConvention = question.skills.some((c) => skillByCode.get(c)?.isConvention);

    let category: Category;
    let score: number;
    if (last && !last.isCorrect && last.localDate < today) {
      category = "retry";
      score = 90;
    } else if (state.status === "review-due") {
      category = "review";
      score = 100;
    } else if (state.status === "learning") {
      category = "practice";
      score = 70 + state.recent.filter((r) => !r).length * 3;
    } else if (state.status === "new") {
      const ready = skill.prerequisites.every((p) => (states.get(p)?.attempts ?? 0) > 0);
      category = "new";
      score = ready ? 50 : 20;
    } else {
      category = "maintain";
      score = 10;
    }

    const isStretch = band === working + 1;
    if (band === working) score += 10;
    else if (band === working - 1) score += 5;
    else if (band < working - 1) score -= 15;
    else if (band > working + 1) score -= 30;
    score += random() * 8;

    const answeredToday = last?.localDate === today;
    const recentlyRight = last?.isCorrect === true && daysBetween(last.localDate, today) < REPEAT_COOLDOWN_DAYS;
    const blocked = answeredToday || recentlyRight;

    return { question, skill, state, category, score, isStretch, isConvention, blocked, reason: describe(category, skill, state, last, isStretch, band) };
  });

  const picked: Candidate[] = [];
  // Counts every skill a question is tagged with, so one skill cannot fill the session through shared questions.
  const perSkill = new Map<string, number>();
  const take = (c: Candidate, reasonOverride?: string) => {
    picked.push(reasonOverride ? { ...c, reason: reasonOverride } : c);
    for (const code of c.question.skills) perSkill.set(code, (perSkill.get(code) ?? 0) + 1);
  };
  const reviewsFull = () => picked.filter((p) => p.category === "review").length >= MAX_REVIEWS;
  // The caps (per skill, reviews per session) keep room for practice and new skills; they relax only if the pool runs dry.
  const available = (c: Candidate, allowBlocked = false, ignoreCaps = false) =>
    !picked.some((p) => p.question.id === c.question.id) &&
    (allowBlocked || !c.blocked) &&
    (ignoreCaps || ((c.category !== "review" || !reviewsFull()) && c.question.skills.every((code) => (perSkill.get(code) ?? 0) < MAX_PER_SKILL)));
  const byScore = [...candidates].sort((a, b) => b.score - a.score);
  // A themed session is all flags or all logos, so the everyday-skills mix does not apply to it.
  const conventionNeeded = () =>
    onlySkills ? 0 : Math.max(0, Math.min(MIN_CONVENTION_ITEMS, size) - picked.filter((p) => p.isConvention).length);
  const isThemed = (c: Candidate) => themeSkills !== undefined && c.question.skills.some((code) => themeSkills.has(code));
  const themeNeeded = () =>
    themeSkills === undefined || onlySkills
      ? 0
      : Math.max(0, Math.min(MIN_THEME_ITEMS, size) - picked.filter(isThemed).length);
  /**
   * The new-skill slot is given up while reviews are badly backed up. Starting something new when he already owes
   * more reviews than a session can serve twice over is the wrong lesson, and it is what lets the due queue grow.
   */
  const reviewBacklog = [...states.values()].filter((s) => s.status === "review-due").length;
  const introducing = reviewBacklog <= MAX_REVIEWS * 2;
  const newNeeded = () =>
    introducing ? Math.max(0, Math.min(MIN_NEW_ITEMS, size) - picked.filter((p) => p.category === "new").length) : 0;
  /**
   * Whether a pick that fills neither quota still fits. Retries and reviews come first by priority, but they must
   * not eat the slots the everyday-skills and new-skill quotas still need. A retry or review that happens to be an
   * everyday-skill question is always fine, so this only holds back the ones that fill no quota.
   */
  const roomForExtra = () => picked.length < size - conventionNeeded() - newNeeded() - themeNeeded();

  // 1. Missed questions from earlier days, then due reviews (one per skill).
  for (const c of byScore.filter((c) => c.category === "retry")) {
    if (picked.length >= Math.min(MAX_RETRIES, size)) break;
    if (!c.isConvention && !roomForExtra()) continue;
    if (available(c)) take(c);
  }
  for (const c of byScore.filter((c) => c.category === "review")) {
    if (reviewsFull() || picked.length >= size) break;
    if (!c.isConvention && !roomForExtra()) continue;
    if (available(c) && !picked.some((p) => p.skill.code === c.skill.code)) take(c);
  }
  // 2. One skill he has not met yet, so new material keeps arriving while other skills are still in progress.
  for (const c of byScore.filter((c) => c.category === "new")) {
    if (newNeeded() === 0 || picked.length >= size - conventionNeeded()) break;
    if (available(c)) take(c);
  }
  // 3. One themed question, so cars and countries turn up without him having to ask for them.
  for (const c of byScore.filter(isThemed)) {
    if (themeNeeded() === 0 || picked.length >= size - conventionNeeded()) break;
    if (available(c)) take(c);
  }
  // 4. Stretch slots, leaving room for the quotas still to be filled.
  const reserved = () => conventionNeeded() + newNeeded() + themeNeeded();
  const stretchSlots = Math.min(STRETCH_SLOTS, Math.max(0, size - picked.length - reserved()));
  for (const c of byScore.filter((c) => c.isStretch)) {
    if (picked.filter((p) => p.isStretch).length >= stretchSlots || picked.length >= size - reserved()) break;
    if (available(c)) take(c);
  }
  // 5. Applied-convention quota. Relax the caps, then the repeat rule, rather than miss it.
  for (const [allowBlocked, ignoreCaps] of [[false, false], [false, true], [true, true]]) {
    for (const c of byScore.filter((c) => c.isConvention)) {
      if (conventionNeeded() === 0 || picked.length >= size) break;
      if (available(c, allowBlocked, ignoreCaps)) take(c, c.category === "maintain" ? `Everyday skills mix: ${c.skill.name}` : undefined);
    }
  }
  // 6. Everything else by priority. If the pool runs dry, relax the caps, then the repeat rule.
  for (const [allowBlocked, ignoreCaps] of [[false, false], [false, true], [true, true]]) {
    for (const c of byScore) {
      if (picked.length >= size) break;
      if (available(c, allowBlocked, ignoreCaps)) take(c, c.blocked ? `Extra practice (pool is small): ${c.skill.name}` : undefined);
    }
  }

  // Warm up with the easier questions and finish on the stretch ones.
  const ordered = [...picked].sort((a, b) => Number(a.isStretch) - Number(b.isStretch) || a.question.difficulty.band - b.question.difficulty.band);
  return { picks: ordered.map((c) => ({ questionId: c.question.id, reason: c.reason })), workingBands };
}

function urgency(state: SkillState, skills: Map<string, Skill>, states: Map<string, SkillState>): number {
  if (state.status === "review-due") return 4;
  if (state.status === "learning") return 3;
  if (state.status === "new") {
    const prereqs = skills.get(state.code)?.prerequisites ?? [];
    return prereqs.every((p) => (states.get(p)?.attempts ?? 0) > 0) ? 2 : 1;
  }
  return 0;
}

function describe(category: Category, skill: Skill, state: SkillState, last: AttemptRecord | undefined, isStretch: boolean, band: number): string {
  const right = state.recent.filter(Boolean).length;
  const base = {
    review: `Review: ${skill.name} (mastered, review was due ${state.nextReview})`,
    retry: `Try again: missed this question on ${last?.localDate}`,
    practice: `Practice: ${skill.name} (${right} of last ${state.recent.length} right)`,
    new: `New skill: ${skill.name}`,
    maintain: `Keep it fresh: ${skill.name} (mastered)`,
  }[category];
  return isStretch ? `${base}. Stretch question, level ${band}` : base;
}

/**
 * Working band per strand: one above the highest band where the child has at least 3 answers with at least 2 in 3
 * right, never below the starting band.
 */
export function computeWorkingBands(questions: Question[], skills: Map<string, Skill>, attempts: AttemptRecord[]): Record<string, number> {
  const questionsById = new Map(questions.map((q) => [q.id, q]));
  const tally = new Map<string, { right: number; total: number }>();
  for (const a of attempts) {
    const q = questionsById.get(a.questionId);
    const strand = q && skills.get(q.skills[0])?.strand;
    if (!q || !strand) continue;
    const key = `${strand}|${q.difficulty.band}`;
    const t = tally.get(key) ?? { right: 0, total: 0 };
    t.total += 1;
    if (a.isCorrect) t.right += 1;
    tally.set(key, t);
  }
  const strands = new Set([...skills.values()].map((s) => s.strand));
  const result: Record<string, number> = {};
  for (const strand of strands) {
    let passed = 0;
    for (let band = 1; band <= 5; band++) {
      const t = tally.get(`${strand}|${band}`);
      if (t && t.total >= 3 && t.right / t.total >= 2 / 3) passed = band;
    }
    result[strand] = Math.min(5, Math.max(STARTING_BAND, passed + 1));
  }
  return result;
}
