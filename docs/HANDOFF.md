# Session Handoff  2026-09-13  All planned phases built and live; next is real use, device testing and fixes

> Read this fully before acting. It is the state of the work as of the end of the last session. Assume you have no memory of that session and may be a different model. This document plus the repository should be enough to resume.
>
> Before trusting any claim below, the previous session should have verified it against the repo, not the conversation. If a section says "assumed", treat it as unconfirmed.

## How this was verified
Commands run at handoff time on 2026-09-13 from the repo root (`aalopp/`), all exit code 0:
- `npm test`: pass. 20 test files, 106 tests (includes the 30-day simulation and a 10-learner quota stress test).
- `npm run content:check`: pass. 48 skills, 328 questions, all `"reviewed"`. By band: 1: 53, 2: 121, 3: 96, 4: 48, 5: 10.
- `npm run typecheck`: pass. No errors.
- `npm run lint`: pass. No problems.

Repo state: `main` level with `origin/main`; the last code commit is `b56be0c`, followed by this handoff's docs commit. No em dashes in `CLAUDE.md`, `docs/` or `content/REVIEW.md`.

## 1. Current state
- Works and verified:
  - Live at `https://aalopp.vercel.app`. Vercel commit status "Deployment has completed" was checked after every phase: Phase 4 `1e8d91e`, Phase 3 `692a08e`, content batch 2 `c87a25b`, Phase 5 `a2af948`, reading and languages `b56be0c`. After the last deploy: `/api/health` returned 200 with `CRON_SECRET`, `/dev/dashboard` returned 404, and `/parent/report` redirected signed-out visitors to `/login`.
  - Every phase in `docs/ROADMAP.md` is done: 0 content format, 1 player, 2 adaptive practice, 3 parent dashboard, 4 scratchpad and Find the Bug, 5 ingestion tool, content batch 2, and the later items (reading, Spanish, French, spoken answers, break offers).
  - Production database has all 5 migrations (`20260913000000_init` through `20260913200000_parent_notes`); after the last schema change `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` printed an empty migration. Row Level Security is on for every table, including `ParentNote` (the publishable key read an empty list with a probe row present).
  - All 328 questions passed an independent blind solve (187 + 39 + 21 + 39 + 42 across five rounds). Record in `content/REVIEW.md`.
  - Both family Google accounts sign in on production (verified earlier on 2026-09-13).
- In progress: nothing.
- Broken or known failing: none observed.
- Assumed, not verified (each is a likely source of the "issues to work out later" the parent expects):
  - Parent dashboard, notes form and printable report in a real signed-in session. They were checked only through `/dev/dashboard` with simulated data and by route checks; they need sign-in and the PIN.
  - Scratchpad with a real stylus and palm rejection on a physical tablet.
  - Voice quality on the family's devices. `pickVoice` now prefers Natural, Premium and Enhanced voices and skips robotic novelty voices, but quality depends on what each device has installed; the family guide explains how to install better voices. Automatic reading is off by default (on-screen switch).
  - Speech recognition of a child's voice, in any language.
  - The offline answer queue after a real Wi-Fi drop.
  - The Vercel cron calling `/api/health` daily.
  - Real usage by Aishik: none yet. All test practice data was deleted on 2026-09-13 for a fresh start (backup at `/Users/soumalya/Documents/Aishik/aalopp-reset-backup-2026-09-13.json`, outside the repo), so every engine threshold is tuned on simulation only.

## 2. Decisions made this session
All are in `docs/DEVLOG.md` with reasons and attribution. Treat as settled; do not reopen without new cause.
- The parent authorized finishing all phases without waiting for input and committing and pushing after each phase passed its checks.
- Earlier: revised build plan; Vercel and Supabase hosting with TrueNAS backup planned; Google sign-in with `ALLOWED_EMAILS` and `PARENT_PIN`; RLS with server-side Prisma 7.10.0; blind-solve review rule (parent's reason "Time constraints."); generators compute answers; mixed US and Canadian units; mastery and review rules; session caps; 8-question sessions with a quiet 12 minute cap; migrations stay compatible with the previous deployment.
- Phase 4: scratchpad stores mode and stroke count only; Find the Bug asks for the first wrong step.
- Phase 3: bars and lines instead of a radar chart; status on the skill map is stripe plus icon plus label; layered SVG skill map instead of React Flow; browser print instead of a PDF library.
- Selector fix: stretch slots yield to the everyday-skills quota.
- Phase 5: a repo command producing drafts, not an in-app AI vision pipeline (no API key; drafts still need a blind solve).
- Languages: speech input optional and experimental, nothing recorded; break offers after 3 wrong in a row instead of fatigue detection.

## 3. Constraints and invariants the next session must not violate
Standing rules in `CLAUDE.md`: RLS on every table with server-side data access only, no `any`, skill state replayed never stored, no em dashes anywhere, process over speed, soft gates only, drawings never stored, passages never read aloud, spoken answers optional, breaks offered never forced.
- Never edit `content/questions/generated-*.json` by hand; change `scripts/generate/*.ts` and run `npm run content:generate`, or `scripts/generate/generate.test.ts` fails.
- A new question file must be imported in `src/content/bank.ts`, or `src/content/bank.test.ts` fails.
- Only `"reviewed"` questions reach the child. Do not mark a question reviewed without an independent blind solve, and log each round in `content/REVIEW.md`.
- Migrations deploy automatically on push through `vercel-build`; keep them compatible with the previous deployment and enable RLS on new tables.
- Keep `Attempt.localDate` nullable until old app versions cached on devices are gone.
- Do not record a reason in `docs/DEVLOG.md` that the parent did not give.
- The autonomous commit-and-push authorization covered finishing the phases; for new work, confirm with the parent before committing unless they say otherwise.
- Rerun `src/lib/engine/simulation.test.ts` after changing any engine cap; it caught a real quota bug this session.

## 4. Next steps, prioritized
- Parent walkthrough of the live app | parent has played a session on a tablet and a phone, opened every grown-ups tab, saved a note and printed the report | `https://aalopp.vercel.app`; collect issues into `docs/HANDOFF.md` section 5.
- Fix whatever the walkthrough finds | each issue has a test or screenshot showing it fixed | usually `src/components/Player.tsx`, `src/app/parent/page.tsx`, `src/components/parent/`.
- Device checks | stylus strokes and palm rejection, Spanish and French voices, 🎤 on a phone, Wi-Fi drop recovery | `src/components/Scratchpad.tsx`, `src/lib/use-speech.ts`, `src/lib/use-speech-input.ts`, `src/lib/outbox.ts`.
- Set up the TrueNAS backup | a nightly dump appears on the NAS and in Google Drive, and a test restore matches the row counts | `docs/backup-truenas.md` (needs the parent at the NAS).
- Tune the engine from real data | after one to two weeks of Aishik's answers; compare accuracy, review share and break offers with the simulation | `src/lib/engine/select-session.ts`, `src/lib/engine/breaks.ts`, `src/lib/engine/simulation.test.ts`.
- Content batch 3 | when the Skills tab shows most skills mastered or the pool feels repetitive; also turn contest PDFs into drafts | `scripts/generate/`, `npm run content:ingest`.

## 5. Open questions and blockers
- Parent input: is 8 questions the right session length? Asked, not yet answered.
- Parent action: TrueNAS backup not set up; answer data exists only in Supabase, whose free plan has no downloadable backups.
- Parent action: Wi-Fi drop test on a phone.
- Parent input, optional: which issues to prioritize from the walkthrough.
- Parent spot-check suggestions: `mdl-bus-cm-offset`, `lgr-cars-4x4`, `lsp-zoo-best-route`, `mdc-ca-piggy-bank`, `gs-fan-triangles-4`, `lrv-undo-the-walk`, `dbg-sub-52-18-trade`, `b2l-five-car-race`, `b2f-not-equal-parts`, `read-soccer-brown-socks`, `lang-fr-phrase-please`.

## 6. Dead ends
Also in `docs/DEVLOG.md` where durable.
- Detecting a deployment from `/_next/static/chunks/` in page HTML; Next.js 16 uses `/_next/static/immutable/chunks/`. Use `gh api repos/ghoshs89/aalopp/commits/<sha>/status`.
- `npx prisma migrate diff --from-migrations` needs a shadow database; use `--from-empty` or `--from-config-datasource`.
- Python one-off edit scripts with `'...parent\\'s...'` quoting failed with a syntax error before writing anything, twice; the commit went out without its docs the first time. Use double-quoted strings for text with apostrophes, or write the script to a file and check it runs before committing.
- Headless Chrome browser tests stall when many speech utterances queue; stub `window.speechSynthesis` in the test page.
- Reading pixels from the scratchpad canvas while it is hidden throws (width 0); check `canvas.width` first.

## 7. Orientation for a cold reader
`CLAUDE.md` covers the stack, commands and standing rules; `docs/ROADMAP.md` covers the plan. This section is only what matters for resuming.
- Where things live:
  - Child flow: `src/app/play/[studentId]/page.tsx` loads attempts and calls `selectSession` (`src/lib/engine/select-session.ts`, which uses `computeSkillStates` in `skill-state.ts`), then renders `src/components/Player.tsx` (scratchpad, Find the Bug, passages, hear-it, 🎤, break offer).
  - Answers: `src/lib/outbox.ts` (IndexedDB queue), then `src/app/api/sync/route.ts` and `src/lib/sync.ts`.
  - Grown-ups: `src/app/parent/page.tsx` (tabs), `src/lib/parent-session.ts` (PIN check and data loading), `src/lib/engine/insights.ts` (dashboard numbers), `src/components/parent/` (charts, skill map, skill progress), `src/app/parent/notes-actions.ts`, `src/app/parent/report/page.tsx`.
  - Content: `content/`, validated by `src/content/schema.ts` and `src/content/graph.ts`, bundled by `src/content/bank.ts`; generators in `scripts/generate/` (measurement, numbers, geometry, logic, debugging, batch2, languages); ingestion in `scripts/ingest/`, drafts in `content/drafts/`.
  - Local previews without sign-in (404 in production): `/dev/player?ids=<id,id>`, `/dev/skills`, `/dev/dashboard`.
- Accounts and services: GitHub `ghoshs89/aalopp` (`gh` logged in on the parent's Mac); Vercel project `aalopp`; Supabase project whose ref starts with `strk`; Google Cloud OAuth client in Testing mode with both family accounts as test users.
- Environment gotchas:
  - Secrets are in `.env.local` (git-ignored): the four Supabase values, `ALLOWED_EMAILS` (both accounts) and `CRON_SECRET`. `PARENT_PIN` is not set locally, so the grown-ups page shows a notice in local development.
  - Prisma CLI reads `DIRECT_URL` (session pooler) through `prisma.config.ts`; the app uses `DATABASE_URL` (transaction pooler).
  - `npm run typecheck` runs `next typegen` first. `next build` type-checks `scripts/` too, so a type error there fails the Vercel build.
  - zsh: an unmatched glob aborts a command chain, and a variable holding several words is one argument.
  - Headless Chrome for screenshots lives in the session scratchpad with `puppeteer-core`; it is not a repo dependency.
- Source material one folder above the repo: `Aishik-Support-Plan.md`, the IXL report PDF, `bebras_100_questions.md`, `BRIGHT STEPS/`.
