# Session Handoff  2026-11-24  Phase 11 data integrity, IXL-targeted skills, and Brain Gym cognitive puzzles

> Read this fully before acting. It is the state of the work as of the end of the last session. Assume you have no memory of that session and may be a different model. This document plus the repository should be enough to resume.
>
> Before trusting any claim below, the previous session should have verified it against the repo, not the conversation. If a section says "assumed", treat it as unconfirmed.

## How this was verified
Commands run at handoff time on 2026-11-24 from the repo root (`/Users/soumalya/Documents/Aishik/aalopp`), all exit code 0:
- `npm run content:generate`: pass. Rebuilt all 11 generated files including `generated-ixl-targeted.json` (56) and `generated-cognitive.json` (26), plus factual fixes in `generated-world.json` and `generated-debugging.json`.
- `npm test`: pass. 22 test files, 141 tests (6 new covering choice-text and order grading, retry cap enforcement, slump step-down, cold-start Humanities capping with OA reachability, and Brain Gym theme selection).
- `npm run content:check`: pass. 66 skills, 874 questions, all reviewed. By primary strand: HUMANITIES 464, LOGIC_CS 124, MEASUREMENT_DATA 94, LANGUAGE 58, GEOMETRY_SPATIAL 48, NUMBER_BASE_TEN 46, OPERATIONS_ALGEBRA 40. By band: band 1 (85), band 2 (236), band 3 (467), band 4 (69), band 5 (17).
- `npm run typecheck`: pass.
- `npm run lint`: pass (0 errors, 0 warnings).
- `rm -rf .next && npm run build`: pass (Prisma generate + Next.js 16.3.5 Turbopack production build + TypeScript check + static pages).
- Independent blind solve: two `research` subagents solved all 82 new questions without answer keys or explanations (56/56 IXL + 26/26 cognitive matched); 6 minor wording/hint polish notes were fixed and logged in `content/REVIEW.md`.

## 1. Current state
- Works and verified locally:
  - **Step 1 (Data integrity, selector, privacy, factual fixes, and backup safety):**
    - `src/lib/sync-schema.ts`, `src/lib/engine/grade.ts`, `src/components/Player.tsx`: choice responses now carry `value` (exact choice text) so `grade()` stays accurate if choices are shuffled; `order` responses are graded element-by-element; `sessionEnd` uses fresh UUIDs per enqueue (eliminating the slow-upload overwrite-delete race); `Player.tsx` awaits IndexedDB enqueues before advancing and surfaces a save warning on storage failure.
    - `src/lib/engine/select-session.ts`, `content/skills.json`: `MAX_RETRIES = 2` enforced inside `available()`; slump step-down in `computeWorkingBands` when recent accuracy on the current working band is < 1/3 across 3+ attempts; per-skill jitter + `MAX_HUMANITIES_ITEMS = 2` in ordinary sessions + `MATH-OA-ADD-SUB` root prerequisite cleared so OA reaches cold-start sessions; `targetBand = Math.min(working, skillMaxBand)` + `nearMastery` nudge (+6) + multi-skill `hasNewSkill` fallback in Step 2 so no strand or dual-tagged skill is starved over 180 days.
    - `src/app/parent/actions.ts`: `signOut()` deletes `PARENT_COOKIE` and `PIN_TRIES_COOKIE`.
    - `src/components/Player.tsx`: visual fallback (`Word to read: "..."`) when `question.listen` is set on devices without speech synthesis; updated Find the Bug nudge text so it never calls a true step false.
    - `scripts/generate/world.ts` and `scripts/generate/debugging.ts`: Morocco (`ma`) now includes `"Spain"` in `neighbours`; Indonesia (`id`) fact corrected to "the world's largest island country, spread across more than seventeen thousand islands"; `dbg-us-coin-values` reordered so `"A nickel is 5 cents."` sits before the false dime step.
    - `README.md` speech privacy text clarified; `docs/backup-truenas.md` writes to `.tmp` and prunes old dumps only after verifying a non-empty dump succeeded.
  - **Step 2 (IXL-aligned visuals and 56 targeted questions):**
    - New visuals in `src/content/schema.ts`, `src/components/visuals/Visual.tsx`, and `src/components/visuals/MoreVisuals.tsx`: two-object `compare` mode on `RulerVisual`, `NumberLineVisual`, `FractionStripVisual`, and `BalanceVisual`.
    - 6 new skills in `content/skills.json` (66 total): `MATH-NBT-ROUNDING`, `MATH-GEO-QUADRILATERALS`, `LOGIC-MATRIX`, `LOGIC-ANALOGY`, `LANG-EN-WORD-PARTS`, `LANG-EN-OPINION-EVIDENCE`.
    - `scripts/generate/ixl-targeted.ts` -> `content/questions/generated-ixl-targeted.json` (56 reviewed questions): two-object inch/cm ruler comparisons, Bar Graphs II, analog-to-digital clocks, rounding on a number line, equivalent fraction strips, quadrilaterals, multiplication/division through 10 and two-step problems, prefixes/suffixes + verbal analogies, and 320L-470L independent reading + opinion-evidence items.
  - **Step 3 (Interactive cognitive puzzles, 1-tap hints, and Brain Gym theme):**
    - `src/components/Player.tsx`: 1-tap `Need a hint?` button (`Question.hint`, validated `hint !== explanation`) and interactive tap-to-place `OrderBoard` for `answer.type === "order"`.
    - `content/themes.json`: 3rd theme `"puzzles"` (`"Brain Gym: Logic and matrices"`, skills `LOGIC-MATRIX`, `LOGIC-ANALOGY`, `LOGIC-ORDER`, `CS-DEBUG`).
    - `scripts/generate/cognitive.ts` -> `content/questions/generated-cognitive.json` (26 reviewed questions): 10 SVG 2x2 and 3x3 pattern matrices with SVG `choiceVisuals`, 5 symbolic balance scales, 5 number analogies, and 6 solver-verified interactive ordering puzzles.
- In progress: nothing.
- Broken or known failing: none observed.
- Assumed, not verified yet (pending post-push check):
  - Real-device visual check of the new SVG matrices, `OrderBoard`, `NumberLineVisual`, `FractionStripVisual`, and `BalanceVisual` on phone/tablet width during a signed-in session.
  - TrueNAS backup setup and Wi-Fi drop recovery test on phone/tablet.

## 2. Decisions made this session
All are in `docs/DEVLOG.md` with reasons and attribution. Treat as settled; do not reopen without new cause.
- Parent approved Steps 1, 2, and 3 together (data-integrity/selector/factual/backup fixes, IXL-aligned visuals & skills, and Brain Gym cognitive puzzles with `OrderBoard` and 1-tap hints).
- All 82 new questions passed an independent blind solve before shipping as `"reviewed"` (`content/REVIEW.md`).
- No DB migrations needed (`Attempt.response` is already `Json`, `Attempt.confidence` is already nullable).

## 3. Constraints and invariants the next session must not violate
Standing rules are in `CLAUDE.md`. Key invariants:
- No em dashes anywhere in UI strings, logs, or content.
- No `any`. Pure engine functions in `src/lib/engine/` with unit tests and 180-day `simulation.test.ts` checks.
- `generated-*.json` files come from `scripts/generate/`; never edit them by hand.
- Keep `HUMANITIES` fact-checked against primary sources in `content/REVIEW.md`; never describe colours of one-colour car marks; hide picture-choice names until checked.
- Every new non-humanities question requires an independent blind solve logged in `content/REVIEW.md` before `"reviewed"`.
- Always include `Co-Authored-By: Gemini <200291788+gemini-code-assist@users.noreply.github.com>` when committing Gemini-authored work while keeping Soumalya as primary commit author.

## 4. Next steps, prioritized
1. Have Aishik try the new **Brain Gym: Logic and matrices** theme and ordinary sessions on a phone/tablet, and inspect live attempt telemetry afterwards to see how hints, `OrderBoard`, matrices, and IXL skills perform.
2. Spot-check the sample items listed at the top of `content/REVIEW.md` (`ixl-cmp-truck-car-offset-in`, `ixl-round10-85`, `ixl-eqf-twothirds-sixths`, `ixl-quad-not-a-quad`, `cog-mat-3x3-rotate-arrows`, `cog-bal-three-scales`, `cog-ord-grand-prix-4`, `world-neighbour-ma`, `dbg-us-coin-values`).
3. If Aishik burns through the 26 cognitive puzzles quickly, add seeded procedural retry twins (fresh isomorphic matrices/scales/orderings generated per session) and paper-folding / hole-punching visual puzzles.
4. Set up the nightly TrueNAS backup (`docs/backup-truenas.md`).

## 5. Open questions and blockers
- Parent action: TrueNAS backup is still not set up; live attempt data exists only in Supabase.
- Parent input: after a week with Brain Gym + 1-tap hints, decide whether to add a longer "Bonus Challenge" mode or keep 8-question sessions.

## 6. Dead ends
- `next/font/google` fails inside offline sandboxes after `rm -rf .next` because Turbopack fetches Baloo 2 and Nunito from `fonts.googleapis.com`; running `npm run build` with network access succeeds cleanly.

## 7. Orientation for a cold reader
`CLAUDE.md` covers stack, commands, and standing rules; `docs/ROADMAP.md` covers phases 0 to 11; `docs/DEVLOG.md` has every decision; `content/REVIEW.md` logs the 82-question blind solve and 3 factual fixes. Key files added/changed in Phase 11:
- `src/lib/sync-schema.ts`, `src/lib/engine/grade.ts`, `src/lib/engine/select-session.ts`, `src/app/parent/actions.ts`
- `src/content/schema.ts`, `src/content/bank.ts`, `content/skills.json`, `content/themes.json`
- `src/components/visuals/Visual.tsx`, `src/components/visuals/MoreVisuals.tsx`, `src/components/Player.tsx`, `src/lib/speech.ts`
- `scripts/generate/ixl-targeted.ts`, `scripts/generate/cognitive.ts`, `scripts/generate/world.ts`, `scripts/generate/debugging.ts`, `scripts/generate/helpers.ts`, `scripts/generate/index.ts`
- `README.md`, `docs/backup-truenas.md`, `content/REVIEW.md`
