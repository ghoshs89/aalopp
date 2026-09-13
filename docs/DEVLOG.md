# AALOPP dev log

Append only. Newest entries at the top. This is the durable record of decisions and milestones so nothing is lost between sessions and a different model can resume cold. Do not delete entries. When the file gets long, roll the oldest entries into the summary block at the bottom rather than removing them.

Entry format:

```
## YYYY-MM-DD  <Decision | Milestone | Dead end>  <short title>
What: one or two lines.
Reason: why (for decisions).
Alternatives rejected: what else was considered and why not (for decisions).
Verified by: command or check (for milestones).
```

Attribution convention used below: "Parent decision" means the parent chose it; "Assistant recommendation, parent approved" means the reasoning came from the coding assistant and the parent accepted it. A reason the parent did not state is recorded as not stated, never guessed.

---

## 2026-09-13  Decision  Second family account on the allowlist
What: `aishik.ghosh2020@gmail.com` belongs on `ALLOWED_EMAILS`, alongside `ghosh.soumalya@gmail.com`. Added to the local `.env.local`. The Vercel production value must be set by the parent; it cannot be read from the repo.
Reason: Parent decision.
Alternatives rejected: None discussed.
Note: Its only sign-in (2026-09-13 03:47 UTC) has no active session, consistent with the app rejecting it at a time when `ALLOWED_EMAILS` was not yet configured on Vercel.

## 2026-09-13  Milestone  Continuity files reviewed and corrected
What: Reviewed the parent-added continuity system against the repo. Fixed the `/handoff` command (date injection did not execute, `date` was not allowed, `git diff --stat` skipped staged changes), added `docs/ROADMAP.md` as the in-repo plan, corrected `CLAUDE.md` (dangling plan note, backups described as live), removed an untracked `CLAUDE.md.old`, backfilled this log, and wrote the first real `docs/HANDOFF.md`.
Verified by: `npm test` (72 passed), `npm run content:check`, `npm run typecheck`, `npm run lint`, all run on 2026-09-13.

## 2026-09-13  Milestone  39 hand-typed questions pass the blind solve
What: An independent agent solved the 39 without the key and agreed on 38. It flagged 3, all fixed: `bb-beaver-color-path` (a second path was correct when read from the log end; start made explicit and Path A changed), `kl12-folded-rope-cut` (emoji could not show the fold or cut; replaced with a drawing), `kl12-symmetric-butterfly` (prompt now says what the dots mean). Details in `content/REVIEW.md`.
Verified by: a separate blind re-solve of the 3 fixed questions agreed with the key at high confidence with no issues; `npm run content:check` passed; screenshots at phone width.

## 2026-09-13  Decision  Blind-solve the 39 hand-typed questions
What: The review rule says hand-typed questions without an independent blind solve ship as draft, but the 39 original hand-typed questions (`kangaroo-style-l12.json`, `bebras-style-starter.json`, `measurement-cars.json`) were marked reviewed after a hand check only. They get the same independent blind solve as the generated batch.
Reason: Parent decision, to make the repo match the rule.
Alternatives rejected: Grandfather them with an exception in the rule; demote them to draft (pool would shrink from 226 to 187 questions).

## 2026-09-13  Milestone  Continuity system added
What: Added `docs/DEVLOG.md` and `docs/HANDOFF.md`, plus the Session continuity section in `CLAUDE.md`. Decisions and milestones now log here; latest state lives in the handoff.
Verified by: files present in repo.

## 2026-09-13  Milestone  Phase 2 adaptive practice live
What: Skill mastery, spaced review, session selection with stored reasons, Skills and Recent answers tabs on the grown-ups page (commit a1b8d37).
Verified by: 72 tests including `src/lib/engine/simulation.test.ts`; migration applied and `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` reported an empty migration; live bundle at `https://aalopp.vercel.app` contained the new time zone cookie code; `/api/health` returned 200 with `CRON_SECRET`.

## 2026-09-13  Decision  Session caps tuned with the simulation
What: `select-session.ts` caps: at most 2 retries, 3 reviews (enforced in every selection step, relaxed only when the pool runs dry), 2 questions per skill tag, 2 stretch slots one band above the strand's working band, at least 3 everyday-skill questions, no repeat of a question answered right within 14 days.
Reason: Assistant recommendation from the 30-day simulation. With the review cap only in the first step, reviews took 42 percent of slots and new skills barely appeared. A cap of 2 across all steps left 21 skills overdue for review by day 30. A cap of 3 across all steps gave about 30 percent reviews, 17 skills mastered by day 30, and every skill mastered or in review by day 60.
Alternatives rejected: Cap of 3 in the first step only (reviews crowded out practice); cap of 2 (review backlog grew).

## 2026-09-13  Decision  Mastery and spaced review rules
What: A skill is mastered at 4 of the last 5 answers right, with those right answers on at least 2 device-local days. Reviews after 1, 3, 7, then 14 days. Any wrong answer returns the skill to learning. Skill state is replayed from the attempt log, never stored (`src/lib/engine/skill-state.ts`).
Reason: Assistant recommendation in the plan review, parent approved the plan and asked to proceed with Phase 2. A rule a parent can read beats an Elo threshold; spaced review was the highest-value missing piece; replaying the log means every device computes the same state with no sync conflicts.
Alternatives rejected: Elo or IRT from the original specification (item difficulty cannot be calibrated from one learner); Bayesian Knowledge Tracing (kept as a later option if the simple rule proves too coarse).

## 2026-09-13  Decision  Device-local date and selection reason stored on each answer
What: `Attempt.localDate` (the calendar date on the device) and `Attempt.selectionReason` added in migration `20260913120000_attempt_local_date_reason`. `localDate` is nullable in the database; the sync handler always fills it, falling back to the UTC date for older app versions. Devices report their time zone through a `tz` cookie (`src/components/TimeZoneCookie.tsx`).
Reason: Assistant recommendation. "Two different days" must follow the family's clock, not UTC, or an evening session splits across two days. The column stays nullable so the previous deployment kept saving answers during rollout. Storing the reason on the answer avoids empty session rows when a session is opened but never started.
Alternatives rejected: Required column (answers from the old deployment would have failed until the new code was live); server UTC dates; a separate session plan table written at page render.

## 2026-09-13  Milestone  Content batch 1: 187 generated questions
What: `scripts/generate/` writes `generated-measurement.json` (56), `generated-numbers.json` (41), `generated-geometry.json` (37), `generated-logic.json` (53); 12 new skills; new picture types coins, ruler, pictureGraph, calendar, network (commit da402dc).
Verified by: two independent blind-solve agents agreed with the computed answer on 187 of 187; six wording issues they flagged were fixed; generators assert a unique solution for ordering, grid and route puzzles; `scripts/generate/generate.test.ts` fails if JSON drifts from its generator; every emoji, grid and new picture type screenshot at phone width. Details in `content/REVIEW.md`.

## 2026-09-13  Decision  Content review policy
What: Questions whose answers are confirmed by an independent blind solve may ship as `"reviewed"`, with the parent spot-checking a sample. Generated questions also compute their answers in code. Hand-typed questions without a blind solve ship as `"draft"`. (Clarified 2026-09-13: hand-typed questions that pass the blind solve count as reviewed, which applies to the 39 original questions.)
Reason: Parent decision. Parent's stated reason, verbatim: "Time constraints." (Corrected 2026-09-13: an earlier version of this entry contained a reconstructed reason that the parent never stated; it was replaced with the parent's own words.)
Alternatives rejected: The options offered were (a) a review page in the app showing each question as the child sees it with Approve and Flag buttons, which was the assistant's recommendation, and (b) a printable review sheet. Why they were not chosen: not stated.
Canonical: this entry is the source of truth for the decision. `CLAUDE.md` under Content states only the operative rule a coding session must follow and points here for the why.

## 2026-09-13  Decision  Generators compute answers instead of hand-typed content
What: New questions come from scripts that compute answers from the data (clock, coin, calendar arithmetic, formulas, a uniqueness-checking puzzle solver, Dijkstra for routes). The JSON is generated, never edited by hand.
Reason: Assistant recommendation after the source material review: `bebras_100_questions.md` held only 7 unique questions out of 100, and 6 of 24 Kangaroo-style items were broken or ambiguous. Computed answers remove typing errors; the solver caught two broken grid puzzles during generation.
Alternatives rejected: Hand-typing answers with a manual check only.

## 2026-09-13  Decision  Mixed US and Canadian units
What: Money questions use both US coins (penny, nickel, dime, quarter) and Canadian coins (nickel, dime, quarter, loonie, toonie); lengths use inches and centimeters.
Reason: Parent decision. Reason not stated.
Alternatives rejected: US coins and inches only (assistant recommendation, matching IXL and MAP); Canadian coins and metric only. Why they were not chosen: not stated.

## 2026-09-13  Decision  More questions before Phase 2
What: Wrote the 187-question batch before building adaptive practice.
Reason: Parent decision after the assistant pointed out that 39 questions would be exhausted in about five sessions and that the mastery rule needs several distinct questions per skill.
Alternatives rejected: Building Phase 2 first.

## 2026-09-13  Milestone  Phone layout fixed
What: Emoji picture rows now scale to the card width instead of scrolling sideways; solid page background under the gradient (commit 91c97cd).
Verified by: overflow measurement and screenshots at 384 pixels wide (Samsung S23+ size); the beaver path puzzle had been hiding the end of each path.

## 2026-09-13  Milestone  Phase 1 tested by the parent
What: Parent played sessions on a Samsung S23+ and a MacBook Pro.
Verified by: database showed 2 sessions, 6 attempts, uploads within 2 seconds, no duplicates, and no repeated questions across devices. Not verified: the offline queue, because no attempt showed an upload delay.

## 2026-09-12  Milestone  Phase 1 player deployed
What: Child player with read-aloud, confidence faces, number pad, IndexedDB answer queue, `/api/sync`, Google sign-in with `ALLOWED_EMAILS`, PIN-locked grown-ups page, PWA manifest and icons, daily health cron (commit 15a9d22).
Verified by: 45 tests, production build, route checks on a local production server, attempt saving tested against Supabase with a probe student that was then deleted, headless Chrome screenshots at iPad and laptop sizes.

## 2026-09-12  Decision  Row Level Security with no policies
What: RLS enabled on every table, including `_prisma_migrations`, with no policies. All reads and writes go through Prisma on the server.
Reason: Assistant recommendation. Supabase exposes the public schema through its Data API with a key that ships to browsers.
Alternatives rejected: Disabling Data API exposure only; writing per-table policies (no browser-side data access is needed).
Verified by: with the publishable key, REST reads returned an empty list even with a row present, and an insert returned HTTP 401.

## 2026-09-12  Decision  Prisma pinned to 7.10.0
What: `prisma`, `@prisma/client` and `@prisma/adapter-pg` pinned to exactly 7.10.0.
Reason: Assistant decision. The npm `latest` tag pointed at 8.0.0-rc.14 while the client installed as 7.10, a mismatched pre-release.
Alternatives rejected: Prisma 8 release candidate.

## 2026-09-12  Decision  Hosting on Vercel and Supabase, TrueNAS as backup
What: App on Vercel, database and sign-in on Supabase (free tier); the family TrueNAS (SCALE 25.10.6) will pull a nightly dump and sync an encrypted copy to Google Drive (Google One account).
Reason: Parent decision after asking whether Vercel and Supabase is far easier than self-hosting. Assistant comparison: far less setup and upkeep, automatic HTTPS and deploys, no domain needed, most setup can be done from the command line.
Alternatives rejected: Self-hosting on TrueNAS with a domain, Caddy and Tailscale (a weekend of setup and ongoing maintenance); Vercel and Supabase without a NAS backup (free Supabase projects have no downloadable backups).

## 2026-09-12  Decision  Google sign-in with an allowlist and a parent PIN
What: Supabase Auth with Google; the Google OAuth client stays in Testing mode with family accounts as test users; the app also checks `ALLOWED_EMAILS`. The grown-ups page needs `PARENT_PIN`.
Reason: Assistant recommendation for multi-device use: parents sign in once per device, the child only taps his avatar.
Alternatives rejected: Magic links or passkeys (considered in the plan, not needed with Google accounts already in the family).

## 2026-09-12  Decision  Revised build plan instead of the original AALOPP specification
What: Build in thin vertical slices (content format, player, adaptive practice, then dashboard, scratchpad, ingestion) rather than the specification's six infrastructure-first phases. Dropped or changed from the specification: speed multiplier removed, hard gating replaced by soft mixing, Elo item calibration replaced by seeded difficulty, speech input deferred in favor of read-aloud, vision ingestion UI deferred.
Reason: Assistant review of the specification, parent approved the plan. The specification worked against the support plan (speed rewards, locking a perfectionist child out of strengths), contained factual errors (Kangaroo levels, Elo arithmetic, Recharts cannot draw a graph), and put six infrastructure phases before the child saw a new problem. Full review in the original planning file.
Alternatives rejected: Executing the specification's phases as written.

## 2026-09-12  Milestone  Phase 0 content format
What: Zod question schema, cross-file checks, 24 skills, 39 reviewed questions; project `CLAUDE.md` (commit a7cc63d).
Verified by: `npm run content:check`, 15 tests, typecheck and lint.

## Summary of older entries
None yet.
