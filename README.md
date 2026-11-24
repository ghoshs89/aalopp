# AALOPP (Puzzle Quest)

Adaptive learning and cognitive reasoning practice app built for one learner (Aishik, age 6, working around grade 3+ in math and reading). Designed for laptops, tablets, and phones around the house, hosted on Vercel with Supabase Postgres and Google sign-in.

## Core principles

- **Process over speed:** no visible timers, no speed bonuses, warm framing of mistakes ("Let's check it together").
- **Soft gates only:** everyday applied-convention skills (time, money, measuring, graphs, calendars) are mixed into every session without locking reasoning content.
- **Event-sourced adaptive engine:** skill mastery and spaced review intervals (1, 3, 7, 14, 30 days) are replayed deterministically from the append-only attempt log in `src/lib/engine/`.
- **Verified content:** mathematical and logic answers are computed by deterministic solvers in `scripts/generate/`, validated by Zod schemas (`src/content/schema.ts`), and checked by independent blind solves or primary-source fact checks logged in `content/REVIEW.md`.
- **Privacy first:** Row Level Security is enabled on every table with no public policies, sign-in is restricted by `ALLOWED_EMAILS`, and scratchpad drawings and speech audio are never stored or uploaded to AALOPP's servers (optional voice answers use the device browser's built-in speech recognition service).

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4
- Supabase Postgres via Prisma 7, Supabase Auth (Google)
- Zod 4 for content and API validation, Vitest for unit and 180-day engine simulation tests

## Commands

```bash
npm run dev              # Local development server
npm test                 # Unit tests, content validation, and 180-day adaptive simulations
npm run content:check    # Validate content/ and print coverage by strand, band, and status
npm run content:generate # Regenerate content/questions/generated-*.json from scripts/generate/
npm run typecheck        # Next typegen + tsc --noEmit
npm run lint             # ESLint
npm run build            # Prisma generate + Next production build
```

## Documentation

- `docs/ROADMAP.md`: living project plan and completed phases
- `docs/DEVLOG.md`: append-only record of architecture and product decisions
- `docs/HANDOFF.md`: latest verified repository state for cold-start handoffs
- `docs/backup-truenas.md`: TrueNAS backup plan
- `content/REVIEW.md`: blind-solve and fact-checking records

## Contributors

- **Soumalya Ghosh** (`@ghoshs89`): Author, parent, product direction, and real-device testing.
- **Google Gemini (Antigravity)**: Codebase review, cognitive-assessment gap analysis, Phase 10 cleanup, engine tuning, sync batching, and security hardening.
- **Anthropic Claude**: Core application architecture, adaptive engine, parent dashboard, content generators, and phases 0 through 9.
- **OpenAI ChatGPT**: Early curriculum ideation, cognitive-practice brainstorming, and problem-design input.

See `CONTRIBUTORS.md` for full attribution details.
