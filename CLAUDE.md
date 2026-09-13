@AGENTS.md

# AALOPP

Adaptive learning app for one learner: Aishik, age 5.5, working around grade 3 (MAP Math and Reading RIT 186). Parents use it from laptops and tablets around the house. The revised build plan lives at `~/.claude/plans/what-do-you-think-melodic-harp.md`.

## Stack
- Next.js 16 App Router, TypeScript strict, Tailwind v4. Hosted on Vercel.
- Supabase: Postgres (via Prisma), Auth (Google), Storage. RLS enabled on every table; all data access is server-side.
- Zod for content and input validation. Vitest for tests. TrueNAS pulls nightly backups (see `docs/backup-truenas.md` once written).

## Commands
- `npm test`: unit tests plus a full validation of `content/`
- `npm run content:check`: validate content and print coverage by strand, band and review status
- `npm run typecheck`, `npm run lint`

## Content
- Questions live in `content/questions/*.json`, skills and prerequisites in `content/skills.json`. Schema: `src/content/schema.ts`. Cross-file checks (unknown skills, cycles, duplicate ids, copy-pasted prompts): `src/content/graph.ts`.
- Every new question must pass `npm run content:check`. Verify the answer by hand; AI-drafted items go in as `"reviewStatus": "draft"` until a parent checks them.
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
