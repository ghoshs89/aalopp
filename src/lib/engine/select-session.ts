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
/**
 * Cap on Humanities (world/cars recall) items in an ordinary session so the large recall bank cannot crowd out core
 * math, logic and language practice.
 */
const MAX_HUMANITIES_ITEMS = 2;
/**
 * A session he picks a theme for still carries this many questions from his ordinary plan, retries and reviews first.
 * In the first themed week 87 of his 119 answers were theme questions (95% right, about 4 seconds each), and core
 * practice nearly stopped. The parent chose a mix over limiting how often a theme can be played.
 */
export const THEMED_CORE_ITEMS = 3;
const STRETCH_SLOTS = 2;
const MAX_REVIEWS = 4;
const MAX_RETRIES = 2;
const MAX_PER_SKILL = 2;
/** A question answered right within this many days is not asked again unless the pool runs dry. */
const REPEAT_COOLDOWN_DAYS = 14;
/** Default starting band when a strand has no higher baseline. */
const STARTING_BAND = 2;
/**
 * Per-strand starting bands calibrated from outside diagnostics (MAP RIT 186, IXL Math 310 with OA 350 and NBT 320
 * against Measurement & Data 280 and Geometry 290). Never learned from one child's app answers.
 */
const STRAND_STARTING_BAND: Partial<Record<Skill["strand"], number>> = {
  OPERATIONS_ALGEBRA: 3,
  NUMBER_BASE_TEN: 3,
};
/** Recent attempts per (strand, band) used to decide whether a band is passed, so old misses age out. */
export const WORKING_BAND_WINDOW = 8;

export function startingBandFor(strand: Skill["strand"]): number {
  return STRAND_STARTING_BAND[strand] ?? STARTING_BAND;
}

export type Pick = { questionId: string; reason: string };
export type SessionPlan = { picks: Pick[]; workingBands: Record<string, number> };

export type SessionOptions = {
  /** Every skill that belongs to some theme. One slot per session is kept for one of them. */
  themeSkills?: Set<string>;
  /**
   * Set when the child picked a theme: the session is drawn from these skills, apart from THEMED_CORE_ITEMS slots
   * that come from questions outside every theme.
   */
  onlySkills?: Set<string>;
};

/** How many slots a fill reserves for everyday skills, a skill he has not met, and a themed question. */
type Quotas = { convention: number; newSkill: number; theme: number };

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

  // Roll random jitter per skill rather than per question so a large question bank (such as Humanities) does not
  // outdraw smaller core strands purely by having more random rolls.
  const skillJitter = new Map<string, number>();
  const jitterFor = (code: string) => {
    let j = skillJitter.get(code);
    if (j === undefined) {
      j = random() * 8;
      skillJitter.set(code, j);
    }
    return j;
  };

  // Highest available band per skill, so a skill whose bank tops out below the strand's working band (e.g. band-2
  // Spanish phrases when English has pushed LANGUAGE to band 4) is not penalized for lacking higher-band items.
  const skillMaxBand = new Map<string, number>();
  for (const q of questions) {
    for (const code of q.skills) {
      skillMaxBand.set(code, Math.max(skillMaxBand.get(code) ?? 1, q.difficulty.band));
    }
  }

  // Skill states and working bands are always computed from the whole bank, so picking a theme does not distort what
  // the engine believes about him. Picking a theme only narrows which questions fill which slots (see the end).
  const candidates: Candidate[] = questions.map((question) => {
    // A question belongs to its most urgent skill.
    const options = question.skills.map((code) => ({ skill: skillByCode.get(code)!, state: states.get(code)! })).filter((o) => o.skill);
    const { skill, state } = options.reduce((best, o) => (urgency(o.state, skillByCode, states) > urgency(best.state, skillByCode, states) ? o : best));
    const working = workingBands[skill.strand] ?? startingBandFor(skill.strand);
    const targetBand = Math.min(working, skillMaxBand.get(skill.code) ?? working);
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
      // Prioritize skills with recent misses, and also nudge skills that are close to mastery (2-4 right answers in)
      // so started skills finish cleanly instead of sitting half-done in learning.
      const misses = state.recent.filter((r) => !r).length;
      const nearMastery = state.recent.length >= 2 && state.recent.length < 5 && misses <= 1 ? 6 : 0;
      score = 70 + misses * 3 + nearMastery;
    } else if (state.status === "new") {
      const ready = skill.prerequisites.every((p) => (states.get(p)?.attempts ?? 0) > 0);
      category = "new";
      score = ready ? 50 : 20;
    } else {
      category = "maintain";
      score = 10;
    }

    const isStretch = band === working + 1;
    if (band === targetBand) score += 10;
    else if (band === targetBand - 1) score += 5;
    else if (band < targetBand - 1) score -= 15;
    else if (band > working + 1) score -= 30;
    score += jitterFor(skill.code) + random() * 0.5;

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
  const isThemed = (c: Candidate) => themeSkills !== undefined && c.question.skills.some((code) => themeSkills.has(code));
  const isHumanities = (c: Candidate) => skillByCode.get(c.question.skills[0])?.strand === "HUMANITIES";
  const reviewsFull = () => picked.filter((p) => p.category === "review").length >= MAX_REVIEWS;
  const retriesFull = () => picked.filter((p) => p.category === "retry").length >= MAX_RETRIES;
  const humanitiesFull = () => !onlySkills && picked.filter(isHumanities).length >= MAX_HUMANITIES_ITEMS;
  // The caps (per skill, reviews, retries, Humanities in ordinary sessions) keep room for balanced practice; they relax only if the pool runs dry.
  const available = (c: Candidate, allowBlocked = false, ignoreCaps = false) =>
    !picked.some((p) => p.question.id === c.question.id) &&
    (allowBlocked || !c.blocked) &&
    // One question per brand or country, so the first one cannot hand him the answer to the next.
    (allowBlocked || !c.question.topic || !picked.some((p) => p.question.topic === c.question.topic)) &&
    (ignoreCaps ||
      ((c.category !== "review" || !reviewsFull()) &&
        (c.category !== "retry" || !retriesFull()) &&
        (!isHumanities(c) || !humanitiesFull()) &&
        c.question.skills.every((code) => (perSkill.get(code) ?? 0) < MAX_PER_SKILL)));
  const byScore = [...candidates].sort((a, b) => b.score - a.score);
  /**
   * The new-skill slot is given up while reviews are badly backed up. Starting something new when he already owes
   * more reviews than a session can serve twice over is the wrong lesson, and it is what lets the due queue grow.
   */
  const reviewBacklog = [...states.values()].filter((s) => s.status === "review-due").length;
  const introducing = reviewBacklog <= MAX_REVIEWS * 2;

  /**
   * Fills the session up to `target` picks from `pool`, in priority order. Quotas count only this fill's own picks;
   * the retry, review and stretch caps count the whole session.
   */
  const fill = (pool: Candidate[], target: number, quotas: Quotas) => {
    const start = picked.length;
    const slots = target - start;
    const mine = () => picked.slice(start);
    const hasNewSkill = (c: Candidate) => c.question.skills.some((code) => states.get(code)?.status === "new");
    const conventionNeeded = () => Math.max(0, Math.min(quotas.convention, slots) - mine().filter((p) => p.isConvention).length);
    const themeNeeded = () => Math.max(0, Math.min(quotas.theme, slots) - mine().filter(isThemed).length);
    const newNeeded = () => Math.max(0, Math.min(quotas.newSkill, slots) - mine().filter(hasNewSkill).length);
    /**
     * Whether a pick that fills neither quota still fits. Retries and reviews come first by priority, but they must
     * not eat the slots the everyday-skills and new-skill quotas still need. A retry or review that happens to be an
     * everyday-skill question is always fine, so this only holds back the ones that fill no quota.
     */
    const roomForExtra = () => picked.length < target - conventionNeeded() - newNeeded() - themeNeeded();

    // 1. Missed questions from earlier days, then due reviews (one per skill).
    for (const c of pool.filter((c) => c.category === "retry")) {
      if (picked.filter((p) => p.category === "retry").length >= MAX_RETRIES || picked.length >= target) break;
      if (!c.isConvention && !roomForExtra()) continue;
      if (available(c)) take(c);
    }
    for (const c of pool.filter((c) => c.category === "review")) {
      if (reviewsFull() || picked.length >= target) break;
      if (!c.isConvention && !roomForExtra()) continue;
      if (available(c) && !picked.some((p) => p.skill.code === c.skill.code)) take(c);
    }
    // 2. One skill he has not met yet, so new material keeps arriving while other skills are still in progress.
    // Prefer candidates whose primary category is "new", then fall back to multi-skill questions carrying a new skill
    // (e.g. CARS-ORIGIN questions that also tag WORLD-FLAGS while WORLD-FLAGS is learning or due for review).
    const newCandidates = [
      ...pool.filter((c) => c.category === "new"),
      ...pool.filter((c) => c.category !== "new" && hasNewSkill(c)),
    ];
    for (const c of newCandidates) {
      if (newNeeded() === 0 || picked.length >= target - conventionNeeded()) break;
      if (available(c)) take(c);
    }
    // 3. One themed question, so cars and countries turn up without him having to ask for them.
    for (const c of pool.filter(isThemed)) {
      if (themeNeeded() === 0 || picked.length >= target - conventionNeeded()) break;
      if (available(c)) take(c);
    }
    // 4. Stretch slots, leaving room for the quotas still to be filled.
    const reserved = () => conventionNeeded() + newNeeded() + themeNeeded();
    const stretchSlots = Math.min(STRETCH_SLOTS, Math.max(0, target - picked.length - reserved()));
    for (const c of pool.filter((c) => c.isStretch)) {
      if (picked.filter((p) => p.isStretch).length >= stretchSlots || picked.length >= target - reserved()) break;
      if (available(c)) take(c);
    }
    // 5. Applied-convention quota. Relax the caps, then the repeat rule, rather than miss it.
    for (const [allowBlocked, ignoreCaps] of [[false, false], [false, true], [true, true]]) {
      for (const c of pool.filter((c) => c.isConvention)) {
        if (conventionNeeded() === 0 || picked.length >= target) break;
        if (available(c, allowBlocked, ignoreCaps)) take(c, c.category === "maintain" ? `Everyday skills mix: ${c.skill.name}` : undefined);
      }
    }
    // 6. Everything else by priority. If the pool runs dry, relax the caps, then the repeat rule.
    for (const [allowBlocked, ignoreCaps] of [[false, false], [false, true], [true, true]]) {
      for (const c of pool) {
        if (picked.length >= target) break;
        if (available(c, allowBlocked, ignoreCaps)) take(c, c.blocked ? `Extra practice (pool is small): ${c.skill.name}` : undefined);
      }
    }
  };

  const newSkill = introducing ? MIN_NEW_ITEMS : 0;
  if (onlySkills) {
    // A picked theme: a few questions from his ordinary plan first, with one everyday skill among them and no new
    // skill (the theme brings its own), then the theme fills the rest. The everyday-skills mix does not apply to it.
    const inTheme = (c: Candidate) => c.question.skills.some((code) => onlySkills.has(code));
    fill(byScore.filter((c) => !inTheme(c) && !isThemed(c)), Math.min(THEMED_CORE_ITEMS, size), { convention: 1, newSkill: 0, theme: 0 });
    fill(byScore.filter(inTheme), size, { convention: 0, newSkill, theme: 0 });
  } else {
    fill(byScore, size, { convention: MIN_CONVENTION_ITEMS, newSkill, theme: themeSkills ? MIN_THEME_ITEMS : 0 });
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
 * Working band per strand: one above the highest band where at least 2 in 3 of the most recent WORKING_BAND_WINDOW
 * answers (minimum 3) are right, never below that strand's starting band.
 */
export function computeWorkingBands(questions: Question[], skills: Map<string, Skill>, attempts: AttemptRecord[]): Record<string, number> {
  const questionsById = new Map(questions.map((q) => [q.id, q]));
  const history = new Map<string, boolean[]>();
  const ordered = [...attempts].sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());
  for (const a of ordered) {
    const q = questionsById.get(a.questionId);
    const strand = q && skills.get(q.skills[0])?.strand;
    if (!q || !strand) continue;
    const key = `${strand}|${q.difficulty.band}`;
    const list = history.get(key) ?? [];
    list.push(a.isCorrect);
    history.set(key, list);
  }
  const strands = new Set([...skills.values()].map((s) => s.strand));
  const result: Record<string, number> = {};
  for (const strand of strands) {
    let passed = 0;
    for (let band = 1; band <= 5; band++) {
      const recent = (history.get(`${strand}|${band}`) ?? []).slice(-WORKING_BAND_WINDOW);
      const right = recent.filter(Boolean).length;
      if (recent.length >= 3 && right / recent.length >= 2 / 3) passed = band;
    }
    let working = Math.min(5, Math.max(startingBandFor(strand), passed + 1));
    // If he has struggled repeatedly on the current working band (fewer than 1 in 3 right across 3+ recent attempts),
    // step down one band instead of keeping him pinned there because an earlier lower band passed.
    const currentRecent = (history.get(`${strand}|${working}`) ?? []).slice(-WORKING_BAND_WINDOW);
    if (currentRecent.length >= 3 && currentRecent.filter(Boolean).length / currentRecent.length < 1 / 3) {
      working = Math.max(1, working - 1);
    }
    result[strand] = working;
  }
  return result;
}
