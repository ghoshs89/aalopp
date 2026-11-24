# Session Handoff  2026-11-24  Phase 10 cleanup, confidence prompt removed, and engine/sync hardening

> Read this fully before acting. It is the state of the work as of the end of the last session. Assume you have no memory of that session and may be a different model. This document plus the repository should be enough to resume.
>
> Before trusting any claim below, the previous session should have verified it against the repo, not the conversation. If a section says "assumed", treat it as unconfirmed.

## How this was verified
Commands run at handoff time on 2026-11-24 from the repo root (`/Users/soumalya/Documents/Aishik/aalopp`), all exit code 0:
- `npm test`: pass. 22 test files, 135 tests (7 new: Skill Map `HUMANITIES` ordering, rolling working-band recovery and slump, per-strand starting bands, batched `/api/sync` writes and rejections, peppered parent PIN signing and 5-try lockout).
- `npm run content:check`: pass. 60 skills, 792 questions, all reviewed. By primary strand: HUMANITIES 464, LOGIC_CS 98, MEASUREMENT_DATA 79, GEOMETRY_SPATIAL 42, LANGUAGE 42, OPERATIONS_ALGEBRA 34, NUMBER_BASE_TEN 33. By band: band 1 (85), band 2 (222), band 3 (427), band 4 (48), band 5 (10).
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `rm -rf .next && npm run build`: pass (Prisma generate + Next.js 16.3.5 Turbopack production build + TypeScript check + 17/17 static pages).

## 1. Current state
- Works and verified locally:
  - Grown-ups Skills tab (`src/components/parent/SkillProgress.tsx`) now includes `HUMANITIES` ("World knowledge") so summary badges match the listed rows, and its help copy reflects the live 1, 3, 7, 14, 30 day review intervals and drop-one-box rule.
  - Skill Map (`src/lib/engine/insights.ts`) now orders `HUMANITIES` at the bottom of each column instead of sorting it to `-1` (top).
  - Confidence prompt ("How sure are you?") is removed from `src/components/Player.tsx`, replaced with a direct "Check answer" button that submits `confidence: null`. Historical confidence rows stay visible on `/parent` and `/parent/report` only when earlier confidence records exist.
  - Adaptive engine (`src/lib/engine/select-session.ts`) computes working bands over a rolling window of the most recent `WORKING_BAND_WINDOW` (8) chronological attempts per `(strand, band)` and starts `OPERATIONS_ALGEBRA` and `NUMBER_BASE_TEN` at Band 3 based on the 2026-11-24 IXL LevelUp Diagnostic (OA 350, NBT 320 vs. MD 280, Geometry 290).
  - Offline sync: `src/components/BackgroundSync.tsx` is mounted in `src/app/layout.tsx` so queued answers flush on any route; `src/lib/outbox.ts` deletes acknowledged items in a single IndexedDB transaction; `src/lib/sync.ts` batches `PracticeSession` and `Attempt` writes with `createMany({ skipDuplicates: true })` and collapses `sessionEnd` updates per session.
  - Parent PIN lock (`src/lib/parent-lock.ts`, `src/lib/parent-session.ts`, `src/app/parent/actions.ts`, `src/app/parent/page.tsx`) mixes `PARENT_LOCK_SECRET` or `CRON_SECRET` with `PARENT_PIN` in the HMAC key and enforces a signed 5-try / 5-minute lockout cookie.
  - `README.md` replaced with real project documentation and `CONTRIBUTORS.md` added crediting Soumalya Ghosh, Google Gemini (Antigravity), Anthropic Claude, and OpenAI ChatGPT.
- In progress: nothing.
- Broken or known failing: none observed.
- Assumed, not verified:
  - Production Vercel deployment and live signed-in smoke test after pushing this commit.
  - Real-device stylus/scratchpad behavior, offline Wi-Fi drop recovery on phone/tablet, and daily Vercel cron keeping Supabase awake (confirm no pause emails).
  - Production attempt telemetry from October and November 2026 has not been queried yet; inspecting it before Phase 11 will pinpoint exact abandonment patterns.

## 2. Decisions made this session
All are in `docs/DEVLOG.md` with reasons and attribution. Treat as settled; do not reopen without new cause.
- Parent: drop the per-question confidence prompt in `Player.tsx` (`confidence: null` on new attempts, no schema migration).
- Parent approved: execute Phase 10 cleanup first before new puzzle engines (dashboard bugs, rolling working bands, per-strand starting bands, root-level batched sync, PIN lockout).
- Parent: add Google Gemini (Antigravity), Anthropic Claude, and OpenAI ChatGPT as contributors in repo docs and commit metadata.

## 3. Constraints and invariants the next session must not violate
Standing rules are in `CLAUDE.md`. Key invariants:
- No em dashes anywhere in UI strings, logs, or content.
- No `any`. Pure engine functions in `src/lib/engine/` with unit tests and 180-day `simulation.test.ts` checks.
- No DB migrations needed for confidence removal (`Attempt.confidence` stays nullable for historical records).
- `generated-*.json` files come from `scripts/generate/`; never edit them by hand.
- Keep `HUMANITIES` fact-checked against primary sources in `content/REVIEW.md`; never describe colours of one-colour car marks; hide picture-choice names until checked.
- Confirm before committing new work unless the parent explicitly authorizes it.

## 4. Next steps, prioritized
1. Inspect October-November production attempt telemetry (which questions/sessions Aishik abandons and how long he stays) to guide Phase 11.
2. Build procedural and interactive cognitive-reasoning puzzles to eliminate trivia gravity and boredom:
   - Seeded runtime/parametric templates for 2x2 and 3x3 visual matrices (CogAT Nonverbal / NNAT3 / Raven's), paper folding / hole punching, and symbolic balance scales (CogAT Quantitative / OA 350+), with fresh isomorphic twins on retries.
   - Interactive puzzle mechanics embedded in his interests (car-themed matrices, drag/tap race podium ordering, car-weight seesaws, robot/rally code-path builder) plus a 1-tap progressive Hint ladder.
3. Close the conceptual gaps from the 2026-11-24 IXL Action Plan:
   - Two-object `RulerVisual` (length comparison) and multi-step scaled bar graphs (Measurement & Data 280).
   - `NumberLineVisual` for rounding to nearest 10/100 and equivalent fraction strips (NBT 320).
   - Quadrilateral attribute classification (Geometry 290 + CogAT Figural Classification).
   - CogAT Verbal bridge: prefix/suffix root families, verbal analogies, "choose reasons to support an opinion", and 500L-650L reading inference passages (ELA 300+).
4. Operations housekeeping: set up the TrueNAS backup (`docs/backup-truenas.md`) and consider a minimal Service Worker for offline session starts on flights/road trips.

## 5. Open questions and blockers
- Parent input: whether to keep 8 questions per session or add an optional "Bonus Challenge" / longer interactive puzzle mode once procedural puzzles land.
- Parent action: TrueNAS backup is still not set up; live attempt data exists only in Supabase.

## 6. Dead ends
- Stale `.next` cache from an earlier Turbopack build failed on `next/font/google` (`nunito` CSS query error) until `rm -rf .next` was run; a clean build succeeded immediately.

## 7. Orientation for a cold reader
`CLAUDE.md` covers the stack, commands, and standing rules; `docs/ROADMAP.md` covers all phases 0 to 10; `README.md` and `CONTRIBUTORS.md` cover project overview and attribution. What changed this session:
- `src/components/Player.tsx`: direct "Check answer" button, `confidence: null`, background sync moved out to `src/components/BackgroundSync.tsx` in `src/app/layout.tsx`.
- `src/components/parent/SkillProgress.tsx` and `src/lib/engine/insights.ts`: `HUMANITIES` added to Skills tab and Skill Map `strandOrder`; stale review copy fixed.
- `src/lib/engine/select-session.ts`: `WORKING_BAND_WINDOW = 8` rolling window and `startingBandFor()` (`OPERATIONS_ALGEBRA: 3`, `NUMBER_BASE_TEN: 3`).
- `src/lib/outbox.ts` and `src/lib/sync.ts`: batched IndexedDB deletes and batched Prisma `createMany` / collapsed `sessionEnd` writes (tested in `src/lib/sync.test.ts`).
- `src/lib/parent-lock.ts`, `src/lib/parent-session.ts`, `src/app/parent/actions.ts`, `src/app/parent/page.tsx`: peppered `signingSecret()` and 5-try / 5-minute signed lockout cookie.
