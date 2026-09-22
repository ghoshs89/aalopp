@AGENTS.md

# AALOPP

Adaptive learning app for one learner: Aishik, age 5.5, working around grade 3 (MAP Math and Reading RIT 186). Parents use it from laptops, tablets and phones around the house. The plan and phase status live in `docs/ROADMAP.md`.

### Current focus
Read `docs/HANDOFF.md` first for the live state of the work, then `docs/ROADMAP.md` for the plan. Phases 0, 1 and 2 are done and live. All planned phases (0 to 5, content batches 1 and 2, reading and languages, break offers) are built and live as of 2026-09-13. Next: the parent's walkthrough, real-device checks and fixes, then tuning from real data. The autonomous commit-and-push authorization covered finishing the phases; confirm before committing new work unless the parent says otherwise.

## Stack
- Next.js 16 App Router, TypeScript strict, Tailwind v4. Hosted on Vercel.
- Supabase: Postgres (via Prisma), Auth (Google), Storage. RLS enabled on every table; all data access is server-side.
- Zod for content and input validation. Vitest for tests. Backups: planned nightly pull to the family TrueNAS (`docs/backup-truenas.md`), not set up yet.

## Commands
- `npm test`: unit tests plus a full validation of `content/`
- `npm run content:check`: validate content and print coverage by strand, band and review status
- `npm run content:generate`: rebuild `content/questions/generated-*.json`
- `npm run content:ingest -- <file.pdf>`: extract draft questions from a contest PDF into `content/drafts/` (never loaded by the app; see `content/drafts/README.md`)
- `npm run typecheck`, `npm run lint`

## Content
- Questions live in `content/questions/*.json`, skills and prerequisites in `content/skills.json`. Files named `generated-*.json` come from `scripts/generate/` (`npm run content:generate`); change the generator, never the JSON. Prefer generators that compute answers and assert uniqueness over hand-typed answers. Schema: `src/content/schema.ts`. Cross-file checks (unknown skills, cycles, duplicate ids, copy-pasted prompts): `src/content/graph.ts`.
- Every new question must pass `npm run content:check`. Review status rule: a question ships as `"reviewed"` only after an independent blind solve (an agent or person solving it without the answer key) agrees with its answer; the parent spot-checks a sample. Prefer generator-computed answers. Anything not yet blind-solved ships as `"draft"`, and the player only uses reviewed questions. Log each round in `content/REVIEW.md`. Rationale, date and alternatives considered are in `docs/DEVLOG.md`.
- Difficulty is seeded from outside evidence (Kangaroo points, contest position, author estimate) and is never learned from Aishik's own answers.
- Log fixes and exclusions of source material in `content/REVIEW.md`.
- Knowledge content (the `HUMANITIES` strand: cars and world knowledge) cannot be blind solved, because a fact has no working to check. The rule instead: every fact needs an independent pass against a source, with the source and date recorded in `content/REVIEW.md`, and figures carry the year they are from. Until that pass is done the questions stay `"draft"` and the player never serves them. A wrong puzzle answer is a bad question; a wrong fact is something Aishik learns and repeats.
- A teach card (`teach` on a question) is shown before the question the first time he meets it, so a fact is taught before it is asked. Never let a card claim something the picture beside it contradicts: the logos are one-colour marks, so do not describe a logo's colours.
- Country of origin means where a brand was FOUNDED, never who owns it now. Jaguar and Land Rover are British and owned by Tata of India; Volvo is Swedish and owned by Geely of China. Founding country and owner are separate fields in `scripts/generate/cars.ts` so a question cannot be built from the wrong one, and ownership only ever appears on a teach card.

## Pictures
- Flags and car logos are real files committed under `public/flags` and `public/logos`, listed with their source and date in `content/assets.json`, and fetched by `npm run assets:fetch`. Never hotlink: an outside URL breaks offline play, breaks when the far side moves the file, and sends requests from the family's devices. `npm run content:check` fails if a question points at a file nobody downloaded.
- Do not hand draw a flag or a logo. A drawn flag quietly gets the number of stars or spokes wrong, and that is a fact the child learns.
- National flags are public domain. Car logos are trademarks, kept here for private family learning, which is the parent's stated basis and a reason the app stays behind its `ALLOWED_EMAILS` allowlist.
- `src/proxy.ts` leaves `flags/` and `logos/` out of the auth matcher, so the signed-out `/dev` preview routes can show them and each picture does not cost a Supabase round trip.

## Themes
- `content/themes.json` groups skills into themes the child picks from `/choose/[studentId]`. A theme can span strands, so adding one is a content change with no code change. A theme is only offered once it has questions that are `"reviewed"`.
- Picking a theme fills the whole session (`onlySkills`, and the everyday-skills quota is skipped). An ordinary session keeps one slot for a themed question (`MIN_THEME_ITEMS`) so cars and countries turn up anyway.

## Product rules
- Process over speed. Never reward fast answers in ratings or UI; no visible timers for the child.
- Soft gates only: mix in applied-convention items (time, money, measurement, graphs), never lock him out of reasoning content.
- Every prompt must be readable aloud (TTS). Use the `speech` field when emoji or symbols would read badly. Automatic reading is off by default and follows the on-screen switch (`useVoicePreference`); the 🔊 and Hear it buttons speak on tap regardless.
- Scratchpad drawings are never stored or uploaded; only the mode (none, digital, paper) and stroke count are saved.
- Find the Bug questions ask for the first wrong step; every step before `bugIndex` must be fully true, or the blind solve will flag a second candidate.
- Reading passages are never read aloud; Spanish and French are spoken with a voice for that language. Spoken answers are optional: a match selects a choice, the child still confirms, and tapping always works.
- Breaks are offered, never forced: after 3 wrong answers in a row, once per session.
- Child-facing screens: large tap targets, minimal text, warm framing of mistakes ("let's check it together").
- No em dashes in UI strings, logs or content. The content schema enforces this.

## Code
- No `any`. Server Components for data fetching; Client Components only for interaction.
- Keep engine logic (selection, mastery, review queue) as pure functions in `src/lib/engine/` with tests.
- Migrations run automatically on every production deploy (`vercel-build` runs `prisma migrate deploy`). Each migration must keep working with the previous deployment while it still serves traffic: add columns as nullable, never rename or drop in the same deploy that stops using them. Every new table needs `ENABLE ROW LEVEL SECURITY` in its migration.
- Changing a Vercel environment variable does nothing until the next deployment.
- Adaptive engine: skill state is replayed from the attempt log every time (`skill-state.ts`), never stored. Mastery is 4 of the last 5 right on 2+ device-local days; reviews at 1, 3, 7, 14, 30 days; a miss drops the skill one box, and only a miss in box 1 returns it to learning. `select-session.ts` caps sessions at 2 retries, 4 reviews and 2 questions per skill, fills 2 stretch slots one band up, keeps 3+ everyday-skill questions, 1 skill he has not met yet and 1 themed question (retries, reviews and stretch all yield to those quotas). The new-skill slot is given up while more than 8 skills are due for review, because starting something new when he already owes more reviews than two sessions can serve is the wrong lesson and is what lets the due queue grow. `simulation.test.ts` runs 30 simulated days and a 180 day run that checks the review queue stays servable; rerun it after changing any cap or interval. The top review interval is load-bearing: N skills demand N/30 reviews a day against the 4 a session can serve, so shortening it or adding many skills can make the due queue grow without bound.

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
