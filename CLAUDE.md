@AGENTS.md

# AALOPP

Adaptive learning app for one learner: Aishik, age 5.5, working around grade 3 (MAP Math and Reading RIT 186). Parents use it from laptops and tablets around the house. The revised build plan lives at `~/.claude/plans/what-do-you-think-melodic-harp.md`.

## Stack
- Next.js 16 App Router, TypeScript strict, Tailwind v4. Hosted on Vercel.
- Supabase: Postgres (via Prisma), Auth (Google), Storage. RLS enabled on every table; all data access is server-side.
- Zod for content and input validation. Vitest for tests. TrueNAS pulls nightly backups (see `docs/backup-truenas.md`).

## Commands
- `npm test`: unit tests plus a full validation of `content/`
- `npm run content:check`: validate content and print coverage by strand, band and review status
- `npm run content:generate`: rebuild `content/questions/generated-*.json`
- `npm run typecheck`, `npm run lint`

## Content
- Questions live in `content/questions/*.json`, skills and prerequisites in `content/skills.json`. Files named `generated-*.json` come from `scripts/generate/` (`npm run content:generate`); change the generator, never the JSON. Prefer generators that compute answers and assert uniqueness over hand-typed answers. Schema: `src/content/schema.ts`. Cross-file checks (unknown skills, cycles, duplicate ids, copy-pasted prompts): `src/content/graph.ts`.
- Every new question must pass `npm run content:check`. Review policy (parent decision, 2026-09-13): questions whose answers are computed by a generator and confirmed by an independent blind solve may ship as `"reviewed"`, and the parent spot-checks a sample. Hand-typed questions without that check go in as `"draft"`.
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
- Adaptive engine: skill state is replayed from the attempt log every time (`skill-state.ts`), never stored. Mastery is 4 of the last 5 right on 2+ device-local days; reviews at 1, 3, 7, 14 days; any miss returns a skill to learning. `select-session.ts` caps sessions at 2 retries, 3 reviews and 2 questions per skill, fills 2 stretch slots one band up, and keeps 3+ everyday-skill questions. `simulation.test.ts` runs 30 simulated days; rerun it after changing any cap.
