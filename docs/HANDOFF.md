# Session Handoff  2026-09-13  Phases 0 to 2 live; continuity docs reviewed; all 226 questions blind-solved

> Read this fully before acting. It is the state of the work as of the end of the last session. Assume you have no memory of that session and may be a different model. This document plus the repository should be enough to resume.
>
> Before trusting any claim below, the previous session should have verified it against the repo, not the conversation. If a section says "assumed", treat it as unconfirmed.

## How this was verified
Commands run at handoff time on 2026-09-13, from `aalopp/`:
- `npm test`: pass. 15 test files, 72 tests.
- `npm run content:check`: pass. 36 skills, 226 questions, all 226 `"reviewed"`.
- `npm run typecheck`: pass. Exit 0, no errors.
- `npm run lint`: pass. Exit 0, no problems.

Also checked this session: no em dashes in `CLAUDE.md`, `docs/`, `.claude/commands/` or `content/REVIEW.md`.

## 1. Current state
- Works and verified this session:
  - Live app at `https://aalopp.vercel.app` runs commit a1b8d37 (Phase 2). Verified by finding the new time zone cookie code in the live JavaScript bundle and a 200 from `/api/health` with `CRON_SECRET`.
  - Production database schema matches `prisma/schema.prisma` (`npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` printed an empty migration).
  - All 39 hand-typed questions passed an independent blind solve after 3 were fixed (see `content/REVIEW.md`, last section). The 187 generated questions passed earlier (187 of 187).
- In progress: nothing. All work from this session (continuity doc fixes, `docs/ROADMAP.md`, the 3 question fixes) was committed and pushed at the parent's request; see `git log`. Live deployment of that commit was checked at the end of the session (see `docs/DEVLOG.md`).
- Broken or known failing: none observed.

## 2. Decisions made this session
Also in `docs/DEVLOG.md`. Treat as settled; do not reopen without new cause.
- Blind-solve the 39 hand-typed questions rather than grandfather or demote them. Parent decision.
- Review policy reason recorded from the parent: "Time constraints."
- `aishik.ghosh2020@gmail.com` belongs on the allowlist. Parent decision.
- The review rule now applies to hand-typed questions too: a question is `"reviewed"` only after an independent blind solve agrees with its answer.
- `docs/ROADMAP.md` is the in-repo plan; the file under `~/.claude/plans/` is historical and exists only on the parent's Mac.
- Earlier decisions from this session (hosting, sign-in, Row Level Security, Prisma pin, mixed units, mastery rules, session caps, device-local dates) were backfilled into `docs/DEVLOG.md` with attribution.

## 3. Constraints and invariants the next session must not violate
From `CLAUDE.md`: Row Level Security on every table with server-side data access only, no `any`, skill state replayed never stored, no em dashes anywhere, process over speed.
- Never edit `content/questions/generated-*.json` by hand. Change `scripts/generate/*.ts` and run `npm run content:generate`; `scripts/generate/generate.test.ts` fails otherwise.
- Only `"reviewed"` questions reach the child (`src/app/play/[studentId]/page.tsx`). Setting a question to reviewed without a blind solve breaks the review rule.
- Keep `Attempt.localDate` nullable in the database until all devices run the new app; the sync handler fills it.
- New tables need `ENABLE ROW LEVEL SECURITY` in their migration, or the browser key can read them.
- Do not record a reason in `docs/DEVLOG.md` that the parent did not give; write "not stated" or "pending".
- Reminder: rerun `src/lib/engine/simulation.test.ts` after changing any engine cap.

## 4. Next steps, prioritized
- Confirm the pushed commit is live | the 3 fixed questions (`bb-beaver-color-path`, `kl12-folded-rope-cut`, `kl12-symmetric-butterfly`) show their new wording on the live site | `https://aalopp.vercel.app`.
- Confirm `aishik.ghosh2020@gmail.com` can sign in on production | that account reaches "Who is playing?" at `https://aalopp.vercel.app` | parent checks `ALLOWED_EMAILS` in Vercel project settings, redeploys if changed, then signs in with that account.
- Confirm the next phase with the parent | parent picks Phase 4 or another item | `docs/ROADMAP.md` phases table.
- Phase 4, scratchpad and Find the Bug (proposed, not confirmed) | drawing canvas usable with finger and stylus on phone and tablet, paper-mode toggle recorded on each attempt, new `findTheBug` answer type in `src/content/schema.ts` with at least 12 blind-solved questions, tests and phone screenshots | `src/components/Player.tsx`, `src/content/schema.ts`, `prisma/schema.prisma` (add a scratchpad field on `Attempt` with a migration).
- Phase 3, parent dashboard | after 1 to 2 weeks of real answers | `src/app/parent/page.tsx`, `src/components/parent/SkillProgress.tsx`.
- Content batch 2 | in about 3 to 4 weeks | `scripts/generate/`.

## 5. Open questions and blockers
- Needs parent input: confirm Phase 4 as the next phase. Blocks starting Phase 4.
- Needs parent action, not blocking code: TrueNAS backup is not set up (`docs/backup-truenas.md`); the only copy of answer data is in Supabase, whose free plan has no downloadable backups.
- Needs parent action: repeat the Wi-Fi drop test. Assumed working but unverified; the only real session showed no delayed uploads.
- Needs parent action: `aishik.ghosh2020@gmail.com` should be allowed (parent decision). It is in local `.env.local`; whether it is in the Vercel `ALLOWED_EMAILS` value is unverified. Its only sign-in so far has no active session, consistent with being rejected before the allowlist was configured.
- Spot-check suggestions for the parent: `mdl-bus-cm-offset`, `lgr-cars-4x4`, `lsp-zoo-best-route`, `mdc-ca-piggy-bank`, `gs-fan-triangles-4`, `lrv-undo-the-walk`, plus the 3 fixed this session: `bb-beaver-color-path`, `kl12-folded-rope-cut`, `kl12-symmetric-butterfly`.

## 6. Dead ends
- Detecting a new Vercel deployment by matching `/_next/static/chunks/` in page HTML: Next.js 16 serves scripts from `/_next/static/immutable/chunks/`, so the match was empty and the poll never fired. Search the live bundle for a string unique to the new code instead.
- `npx prisma migrate diff --from-migrations`: requires `shadowDatabaseUrl`. Use `--from-empty --to-schema` to write a migration and `--from-config-datasource --to-schema` to confirm the database matches.
- Editing the single-line JSON content files with Python slice indexes: produced invalid JSON (caught by a `json.loads` guard). Replace exact unique strings instead.

## 7. Orientation for a cold reader
`CLAUDE.md` covers the stack, commands and standing rules. This section is only what is relevant to the work in flight.
- Files touched this session, and their role:
  - `.claude/commands/handoff.md`: the `/handoff` command. Fixed its date and diff injections.
  - `docs/DEVLOG.md`, `docs/HANDOFF.md`, `docs/ROADMAP.md`: continuity files.
  - `content/questions/bebras-style-starter.json`, `content/questions/kangaroo-style-l12.json`: 3 question fixes. `content/REVIEW.md`: audit trail.
- Entry points and data flow:
  - Child: `src/app/play/[studentId]/page.tsx` loads attempts, calls `selectSession` in `src/lib/engine/select-session.ts`, renders `src/components/Player.tsx`.
  - Answers: IndexedDB queue in `src/lib/outbox.ts`, then `/api/sync` (`src/app/api/sync/route.ts`, `src/lib/sync.ts`).
  - Parent: `src/app/parent/page.tsx` (PIN), Skills tab uses `computeSkillStates` in `src/lib/engine/skill-state.ts`.
  - Content: `content/`, validated by `src/content/schema.ts` and `src/content/graph.ts`, bundled by `src/content/bank.ts`.
- Environment gotchas:
  - Local secrets are in `.env.local` (git-ignored). Prisma CLI reads `DIRECT_URL` through `prisma.config.ts`; the app uses `DATABASE_URL`.
  - The shell is zsh: an unmatched glob such as `rm *.png` aborts a command chain, and `$VAR` holding several words is not split into arguments. Use `xargs` or arrays.
  - `/dev/player` and `/dev/skills` are local previews that return 404 in production.
  - `next typegen` must run before `tsc` for typed routes; `npm run typecheck` does both.
