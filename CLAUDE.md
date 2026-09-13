@AGENTS.md

# AALOPP

Adaptive learning app for one learner: Aishik, age 5.5, working around grade 3 (MAP Math and Reading RIT 186). Parents use it from laptops, tablets and phones around the house. The plan and phase status live in `docs/ROADMAP.md`.

### Current focus
Read `docs/HANDOFF.md` first for the live state of the work, then `docs/ROADMAP.md` for the plan. Phases 0, 1 and 2 are done and live; the proposed next phase is Phase 4 (scratchpad and Find the Bug), pending parent confirmation.

## Stack
- Next.js 16 App Router, TypeScript strict, Tailwind v4. Hosted on Vercel.
- Supabase: Postgres (via Prisma), Auth (Google), Storage. RLS enabled on every table; all data access is server-side.
- Zod for content and input validation. Vitest for tests. Backups: planned nightly pull to the family TrueNAS (`docs/backup-truenas.md`), not set up yet.

## Commands
- `npm test`: unit tests plus a full validation of `content/`
- `npm run content:check`: validate content and print coverage by strand, band and review status
- `npm run content:generate`: rebuild `content/questions/generated-*.json`
- `npm run typecheck`, `npm run lint`

## Content
- Questions live in `content/questions/*.json`, skills and prerequisites in `content/skills.json`. Files named `generated-*.json` come from `scripts/generate/` (`npm run content:generate`); change the generator, never the JSON. Prefer generators that compute answers and assert uniqueness over hand-typed answers. Schema: `src/content/schema.ts`. Cross-file checks (unknown skills, cycles, duplicate ids, copy-pasted prompts): `src/content/graph.ts`.
- Every new question must pass `npm run content:check`. Review status rule: a question ships as `"reviewed"` only after an independent blind solve (an agent or person solving it without the answer key) agrees with its answer; the parent spot-checks a sample. Prefer generator-computed answers. Anything not yet blind-solved ships as `"draft"`, and the player only uses reviewed questions. Log each round in `content/REVIEW.md`. Rationale, date and alternatives considered are in `docs/DEVLOG.md`.
- Difficulty is seeded from outside evidence (Kangaroo points, contest position, author estimate) and is never learned from Aishik's own answers.
- Log fixes and exclusions of source material in `content/REVIEW.md`.

## Product rules
- Process over speed. Never reward fast answers in ratings or UI; no visible timers for the child.
- Soft gates only: mix in applied-convention items (time, money, measurement, graphs), never lock him out of reasoning content.
- Every prompt must be readable aloud (TTS). Use the `speech` field when emoji or symbols would read badly.
- Child-facing screens: large tap targets, minimal text, warm framing of mistakes ("let's check it together").
- No em dashes in UI strings, logs or content. The content schema enforces this.

## Code
- No `any`. Server Components for data fetching; Client Components only for interaction.
- Keep engine logic (selection, mastery, review queue) as pure functions in `src/lib/engine/` with tests.
- Migrations run automatically on every production deploy (`vercel-build` runs `prisma migrate deploy`). Each migration must keep working with the previous deployment while it still serves traffic: add columns as nullable, never rename or drop in the same deploy that stops using them. Every new table needs `ENABLE ROW LEVEL SECURITY` in its migration.
- Changing a Vercel environment variable does nothing until the next deployment.
- Adaptive engine: skill state is replayed from the attempt log every time (`skill-state.ts`), never stored. Mastery is 4 of the last 5 right on 2+ device-local days; reviews at 1, 3, 7, 14 days; any miss returns a skill to learning. `select-session.ts` caps sessions at 2 retries, 3 reviews and 2 questions per skill, fills 2 stretch slots one band up, and keeps 3+ everyday-skill questions. `simulation.test.ts` runs 30 simulated days; rerun it after changing any cap.

## Session continuity
Preserve plans, decisions and context across sessions so no milestone is lost and a different model can resume cold.

Files:
- `docs/DEVLOG.md`: append only, newest first. Durable record of decisions and milestones. Never delete entries; compact old ones into a summary block at the bottom when the file gets long.
- `docs/HANDOFF.md`: the latest session state, overwritten each session. The cold start read. Keep its section structure.
- `docs/ROADMAP.md`: the plan and phase status. Update it when a phase starts or finishes or the order changes. The original planning file under `~/.claude/plans/` is outside the repo and historical only.
- This file: evergreen instructions plus the Current focus pointer above. Do not paste session logs here.

During work, not only at the end:
- On any non trivial decision (schema, engine caps, adaptive rules, dependency, review policy, product rule), append it to `docs/DEVLOG.md` immediately: date, decision, reason, alternatives rejected. The parent review-policy note under Content is exactly the kind of thing that now lives there.
- On any verified milestone, append a one line entry.
- Keep Current focus in sync when priorities shift.

At end of session, or when asked to hand off:
- Verify state against the repo before writing, not against the conversation. Run `npm test`, `npm run content:check`, `npm run typecheck` and `npm run lint`, and report what passed. Separate what you verified from what you are assuming.
- Regenerate `docs/HANDOFF.md` with the same section structure (the `/handoff` command in `.claude/commands/handoff.md` does this).
- Confirm every decision and milestone from the session is in `docs/DEVLOG.md`.

Write logs and handoffs in plain markdown, no em dashes, no assistant-specific assumptions, so any model or human can read them.
