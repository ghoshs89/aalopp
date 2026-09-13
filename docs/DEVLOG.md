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

## 2026-09-13  Milestone  Phase 5 content ingestion tool
What: `npm run content:ingest -- <file.pdf> [--slug name] [--answers "1:B,2:D"]` (`scripts/ingest/`) extracts a PDF's text layer with pdfjs-dist 6.3.289, splits numbered problems and lettered choices, estimates the band from the Kangaroo problem number, flags problems that mention a picture, applies an answer key, and writes drafts to `content/drafts/<slug>.json`. Workflow for turning drafts into reviewed questions in `content/drafts/README.md`. Test fixture `tests/fixtures/sample-contest.pdf` contains original problems generated with headless Chrome.
Verified by: 7 ingestion tests including extraction from the fixture PDF across two pages; full `npm test`, typecheck, lint and build clean. Content batch 2 (commit c87a25b) was confirmed deployed by Vercel's commit status before this work.
Not verified: a real contest PDF (none in the repo); scanned PDFs without a text layer produce no drafts by design.

## 2026-09-13  Decision  Ingestion as a repo tool, not an in-app vision pipeline
What: Phase 5 is a command-line tool that produces drafts in the repo. The in-app upload page, AI vision parsing and image cropping from the original specification were not built.
Reason: Assistant decision under the parent's instruction to finish all phases. The vision path needs an Anthropic API key and storage that the project does not have, so it would ship untested; drafts still need the independent blind solve before any question reaches the child, so an in-app approve button would bypass the content review rule; and contest artwork should be redrawn, not cropped and copied.
Alternatives rejected: Claude vision extraction behind an upload page (no key, untestable now, can be added later on top of `DraftQuestionSchema`); OCR for scanned PDFs (heavy dependency; noted in the drafts README).

## 2026-09-13  Milestone  Content batch 2: 39 questions and 5 grade 3 skills
What: `scripts/generate/batch2.ts` writes `generated-batch2.json`: multiplication, division (including leftovers), fractions (halves, thirds, quarters; unequal parts), area and perimeter, harder logic (5-car ordering, 4 by 4 grid, counting arrangements and handshakes) and 6 more Find the Bug items. New skills `MATH-OA-MULT`, `MATH-OA-DIVIDE`, `MATH-NF-FRACTIONS`, `MATH-MD-AREA-PERIMETER` (everyday skill) and `LOGIC-COUNT-WAYS`. Bank now 42 skills and 286 questions; band 5 grew from 3 to 12 questions.
Verified by: independent blind solve agreed on 39 of 39; generator uniqueness checks caught a 5-car race whose clues had no solution (clue changed before the solve); `npm test` 88 passed; typecheck, lint and build clean; phone-width overflow check on the new pictures passed. Details in `content/REVIEW.md`.

## 2026-09-13  Decision  Reserve room for the everyday-skills quota before stretch slots
What: `selectSession` now limits stretch slots so the 3 everyday-skill questions always fit, and relaxes the per-skill and review caps, then the repeat rule, before ever missing the quota. A new test runs 10 simulated learners for 25 days each and checks every session.
Reason: Assistant fix for a bug exposed by content batch 2: retries (2), reviews (3) and stretch (2) could take 7 of 8 slots before the quota step ran, leaving sessions with only 2 everyday questions. The single-seed simulation had passed by luck before.
Alternatives rejected: Lowering the quota; running the quota step first (it would crowd out retries and due reviews).

## 2026-09-13  Milestone  Phase 3 deployed
What: Commit 692a08e pushed to `main`.
Verified by: GitHub commit status from Vercel for 692a08e reported "Deployment has completed". (The Phase 3 docs update failed on a script syntax error before that commit and was added in the next commit.)

## 2026-09-13  Milestone  Phase 3 parent dashboard built
What: Grown-ups page tabs Overview (stat tiles, everyday skills vs reasoning, confidence calibration, answers per day, weekly percent right, accuracy by strand), Skills, Skill map, Recent answers and Notes; printable report at `/parent/report`; `ParentNote` table (migration `20260913200000_parent_notes`, RLS enabled). Pure calculations in `src/lib/engine/insights.ts`.
Verified by: `npm test` 86 passed (7 new insight tests); typecheck, lint and build clean; migration applied and `prisma migrate diff --from-config-datasource` empty; the publishable key read an empty list from `ParentNote` with a probe row present (probe deleted); `/dev/dashboard` with 30 simulated days screenshot at 1280 and 384 pixels wide, tooltips appear on hover, no page-level sideways scroll, no console errors.
Not verified: the notes form and report printing in a real signed-in session (both need sign-in and the PIN).

## 2026-09-13  Decision  Dashboard chart forms
What: Horizontal percent bars in one hue (everyday vs reasoning, confidence, strands); two shades of one hue for right and not-right daily columns; a 2px line for weekly percent right with gaps for empty weeks; skill map status as a colored stripe plus icon plus label; every chart has hover and keyboard tooltips and a "Show as table" view. Charts sit on light cards (`#fcfcfb`) on the app's dark page. The daily chart keeps a 600px minimum width and scrolls inside its card on phones.
Reason: Assistant decision following the dataviz method: bars compare magnitude better than the radar chart in the original specification, and status colors must never carry meaning alone. The palette validator failed the status yellow (`#fab219`) on the lightness band and warned on contrast; that color is from the fixed status palette, which documents the shortfall and requires icon plus label, so it always appears with "Review due".
Alternatives rejected: Radar chart for strands; React Flow for the skill map (a new dependency for a 37-node graph; the layered SVG layout in `skillMapLayout` is enough); a PDF library for the report (browser print to PDF from a plain light page).

## 2026-09-13  Decision  Finish all remaining phases without waiting for parent input
What: The parent asked to finish the entire project, commit and push whatever is recommended, and go live, with issues worked out later. Remaining scope, in order: Phase 3 (parent dashboard), content batch 2, Phase 5 (content ingestion), and the later items (reading, Spanish and French with speech, fatigue detection). Commit and push are authorized for this run after each phase passes its checks. Decisions and milestones keep being logged here.
Reason: Parent decision, stated verbatim: "Don't wait for my inputs, finish the entire project, push and commit whatever you recommend and go live. We will come back and work out the issues later."
Alternatives rejected: Waiting 1 to 2 weeks of real use before Phase 3 (the earlier proposal); stopping after Phase 4.

## 2026-09-13  Milestone  Phase 4 deployed
What: Commit 1e8d91e (scratchpad and Find the Bug) pushed to `main` at the parent's request.
Verified by: GitHub commit status from Vercel for 1e8d91e reported "Deployment has completed"; `/api/health` returned 200 afterwards. Before committing: `npm test` 79 passed and `npm run content:check` OK (37 skills, 247 questions).

## 2026-09-13  Milestone  Phase 4 built and verified locally (not yet deployed)
What: Scratchpad (`src/components/Scratchpad.tsx`) with pen colors, undo, clear, palm rejection when a stylus is used, and an "I'm using paper" toggle; Find the Bug answer type with 21 generated questions (`scripts/generate/debugging.ts`, `content/questions/generated-debugging.json`) and skill `CS-DEBUG`; migration `20260913180000_attempt_scratchpad` applied to the production database; grown-ups Answers tab shows ✏️ strokes or 📝 paper.
Verified by: `npm test` 79 passed including the 30-day simulation; `npm run content:check` 37 skills and 247 questions; typecheck, lint and `npm run build` clean; `prisma migrate diff --from-config-datasource` empty after the migration; a probe sync against Supabase stored step answers, `DIGITAL` with 9 strokes and `PAPER`, and an old-format answer with nulls (probe data deleted); headless Chrome at phone (384 px) and iPad (820 px) drew with mouse and touch, undo removed a stroke, the scratchpad started hidden on the next question, no sideways scroll, no console errors; independent blind solve agreed on 21 of 21 Find the Bug questions.
Not verified: a real stylus (Apple Pencil or S Pen) and palm rejection on a physical device.

## 2026-09-13  Decision  Find the Bug question design
What: New answer type `findTheBug` in `src/content/schema.ts`: a named solver's steps (3 to 6), `bugIndex` for the first wrong step, and `fix` (what that step should say). The child taps a step; the response type is `step`. Later steps may build on the mistake, so the question always asks for the first wrong step. Questions carry skill `CS-DEBUG` plus the math skill involved, and are generated from common child errors (forgetting to carry, subtracting the smaller digit from the bigger, reading the minute hand's number as minutes, measuring from the wrong end of a ruler, wrong coin values, 45 + 30 minutes written as 3:75).
Reason: Assistant design for the "Find the Bug" item in the approved plan, which asked for flawed solutions with a marked bug step; it builds the checking habit in `Aishik-Support-Plan.md`.
Alternatives rejected: Multiple choice "which step is wrong" (same interaction with less context); allowing solutions with no mistake (deferred; too confusing at this age to start).

## 2026-09-13  Decision  Scratchpad records how, never what
What: Each answer stores `scratchpad` (`NONE`, `DIGITAL` or `PAPER`) and `scratchpadStrokes`. The drawing itself is never saved or uploaded. If both paper and drawing are used, `DIGITAL` is recorded. The scratchpad is hidden until opened and cleared for every question.
Reason: Assistant recommendation: the parent needs to know whether working out happened, not the scribbles; storing images of a child's drawings adds privacy exposure and database size for little value.
Alternatives rejected: Saving drawings to Supabase Storage; not recording scratchpad use at all.

## 2026-09-13  Decision  Phase 4 is the next phase
What: Build Phase 4 (scratchpad and Find the Bug) before Phase 3 (parent dashboard).
Reason: Parent decision ("Continue to Phase 4"), following the assistant's proposal that the dashboard needs a couple of weeks of real answers while the scratchpad is useful immediately.
Alternatives rejected: Phase 3 first (little real data yet); another content batch first.

## 2026-09-13  Milestone  Session handoff written
What: Ran the `/handoff` procedure: verification commands, DEVLOG reconciled (backfilled decisions, a milestone and dead ends not yet logged), `docs/HANDOFF.md` rewritten, `CLAUDE.md` checked. Not committed; committing is the parent's step.
Verified by: `npm test` (15 files, 72 tests), `npm run content:check` (36 skills, 226 questions, all reviewed), `npm run typecheck` and `npm run lint`, all exit 0 on 2026-09-13.

## 2026-09-13  Dead end  Detecting a new deployment from script paths in the HTML
What: A background poll compared `/_next/static/chunks/` paths in the live page to spot a new Vercel deployment. It never fired, because Next.js 16 serves scripts from `/_next/static/immutable/chunks/`, so both fingerprints were the hash of an empty string.
Instead: read the GitHub commit status that Vercel posts (`gh api repos/ghoshs89/aalopp/commits/<sha>/status`), or search the live bundle for a string unique to the new code.

## 2026-09-13  Dead end  Diffing migrations without a shadow database
What: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma` fails with Prisma 7.10 unless `shadowDatabaseUrl` is set in `prisma.config.ts`, and `prisma migrate dev` would need a shadow database on Supabase.
Instead: write migrations with `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` (or by hand for later changes), apply with `npx prisma migrate deploy`, and confirm with `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`, which should print an empty migration.

## 2026-09-13  Milestone  Production environment configured
What: Vercel production has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `ALLOWED_EMAILS`, `PARENT_PIN` and `CRON_SECRET`. The first attempt did not take effect until the variables were saved for Production and the site was redeployed.
Verified by: `/api/health` with the local `CRON_SECRET` returned 200 on the live site; the parent signed in with both family accounts.

## 2026-09-13  Milestone  Second family account can sign in on production
What: `aishik.ghosh2020@gmail.com` signs in at `https://aalopp.vercel.app` and reaches "Who is playing?".
Verified by: parent sign-in in a fresh session; Supabase `auth.users` showed a new sign-in at 2026-09-13 14:46:29 UTC with an active row in `auth.sessions`, which the app would have removed if the account had failed the `ALLOWED_EMAILS` check in `src/app/auth/callback/route.ts`.

## 2026-09-13  Milestone  Continuity and question fixes deployed
What: Commit 413d549 (continuity docs, `/handoff` fixes, `docs/ROADMAP.md`, 3 question fixes) pushed to `main`.
Verified by: GitHub commit status from Vercel for 413d549 reported "Deployment has completed". Before committing: `npm test` 72 passed, `npm run content:check` OK (226 reviewed), typecheck and lint clean.

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

## 2026-09-12  Decision  Session length and child-facing timing
What: A session is 8 questions (`SESSION_SIZE` in `src/lib/engine/select-session.ts`) and ends quietly after 12 minutes (`SESSION_LIMIT_MS` in `src/components/Player.tsx`). No timer is ever shown. Timing (time to first action, total time, replays) is recorded for the parent only.
Reason: Assistant recommendation in the plan review, parent approved the plan: fixed short sessions suit a 5 year old better than algorithmic fatigue detection, and visible timers work against "process over speed".
Alternatives rejected: Fatigue detection from hesitation spikes (the specification's approach; deferred until real data shows it is needed); visible timers.
Open: the parent has been asked whether 8 is the right length; no answer yet.

## 2026-09-12  Decision  Answers queue on the device and are re-graded on the server
What: Each answer goes into an IndexedDB queue (`src/lib/outbox.ts`) with a device-generated UUID, then uploads to `/api/sync`. `src/lib/sync.ts` re-grades against the question bank and writes idempotently, so retries never duplicate. Mastery and history come from the server, so every device sees the same progress.
Reason: Assistant recommendation for multi-device use and unreliable home Wi-Fi.
Alternatives rejected: Trusting correctness sent by the device; storing progress per device.

## 2026-09-12  Decision  Question bank bundled with static imports
What: `src/content/bank.ts` imports each `content/questions/*.json` file statically. `src/content/bank.test.ts` fails if a file on disk is not registered there.
Reason: Assistant decision. Reading `content/` with `fs` at runtime is not guaranteed to be included in Vercel's serverless bundle; static imports are.
Alternatives rejected: Runtime `fs` reads with output file tracing configuration.

## 2026-09-12  Decision  Migrations run on every production deploy
What: `vercel-build` in `package.json` runs `prisma generate && prisma migrate deploy && next build`, so a pushed migration reaches the production database during the build, before the new code serves traffic.
Reason: Assistant decision; keeps schema and code in step without a manual step.
Consequence: every migration must stay compatible with the previous deployment while it is still serving (for example, add columns as nullable). Recorded as a rule in `CLAUDE.md`.
Alternatives rejected: Running migrations by hand before each deploy.

## 2026-09-12  Decision  Daily health check keeps the free Supabase project awake
What: `vercel.json` schedules a daily cron to `/api/health`, which runs `SELECT 1` and requires `Authorization: Bearer <CRON_SECRET>`.
Reason: Assistant recommendation: free Supabase projects pause after about a week without activity, for example during a family trip.
Alternatives rejected: Paid Supabase plan; relying only on the planned TrueNAS nightly dump, which is not set up yet.

## 2026-09-12  Decision  Vercel Prisma Postgres integration not added
What: At the first Vercel deploy, the suggested Prisma Postgres integration was skipped.
Reason: Assistant recommendation, parent followed it: it would create a second database and could set its own `DATABASE_URL`, overriding Supabase.
Alternatives rejected: Using Prisma Postgres instead of Supabase (Supabase was already chosen for database, auth and storage together).

## 2026-09-12  Decision  Every strand starts at working level 2
What: `STARTING_BAND = 2` in `src/lib/engine/select-session.ts`. A strand moves up one level after at least 3 answers at a level with at least 2 in 3 right.
Reason: Assistant decision based on the MAP and IXL results (about grade 3), which place Aishik above the easiest band.
Alternatives rejected: Starting at level 1 for everyone (too many easy questions before the engine adapts).

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
