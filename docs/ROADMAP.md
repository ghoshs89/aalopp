# AALOPP roadmap

The living plan. It replaces the original planning file at `~/.claude/plans/what-do-you-think-melodic-harp.md`, which exists only on the parent's Mac and still describes phases that are now done. Decisions and their reasons are in `docs/DEVLOG.md`; the latest session state is in `docs/HANDOFF.md`.

Last updated: 2026-09-13. All planned phases are built and live; next is real use, device testing and fixes (see `docs/HANDOFF.md`).

## Goal
A practice app for one learner, Aishik (age 5.5, working around grade 3: MAP Math and Reading RIT 186, IXL Math about 290 with Measurement and Data as the weakest strand). He uses it on laptops, tablets and phones around the house. Source material: `../Aishik-Support-Plan.md` (one folder above the repo).

## Product principles
These come from the support plan and the review of the original AALOPP specification. They are also the standing rules in `CLAUDE.md`.
- Process over speed: no speed bonuses, no visible timers.
- Soft gates only: everyday convention skills (time, money, measuring, graphs) are mixed into every session; reasoning content is never locked.
- Every prompt can be read aloud; answers are tap or number pad, not typing or speech.
- Wrong answers get a warm "let's check it together" review, not a penalty.
- Difficulty is seeded from outside evidence and never learned from one child's answers.
- Accuracy of content matters more than volume.

## Architecture (current)
- Next.js 16 on Vercel at `https://aalopp.vercel.app`, installable as a home-screen app.
- Supabase: Postgres through Prisma 7.10, Google sign-in limited by `ALLOWED_EMAILS`, Row Level Security on every table with no policies (the browser key can read and write nothing).
- Answers queue in IndexedDB on the device and upload to `/api/sync`; the server re-grades and saves idempotently.
- Skill state is replayed from the attempt log on every request, never stored.
- Planned, not set up yet: nightly backup from Supabase to the family TrueNAS, then an encrypted copy to Google Drive (`docs/backup-truenas.md`).

## Phases

| Phase | Scope | Status |
|---|---|---|
| 0. Content format | Zod question schema, validator, first 39 questions | Done 2026-09-12 (commit a7cc63d) |
| 1. Player MVP | Child player with read-aloud, confidence faces, offline answer queue, Google sign-in, PIN-locked grown-ups page, PWA | Done 2026-09-12 (commit 15a9d22); tested by the parent on a Samsung S23+ and a MacBook |
| Content batch 1 | 187 generated questions, 12 new skills, 5 new picture types | Done 2026-09-13 (commit da402dc) |
| 2. Adaptive practice | Mastery per skill, spaced review, session selection with reasons, Skills tab on the grown-ups page | Done 2026-09-13 (commit a1b8d37); live on Vercel |
| 4. Scratchpad and Find the Bug | Drawing canvas for working out, paper-mode toggle, new question type: find the mistake in a worked solution | Done 2026-09-13 (commit 1e8d91e); live on Vercel; not yet tried with a real stylus |
| 3. Parent dashboard | Pure reasoning vs everyday skills chart, skill map, confidence calibration, trends, notes, printable report | Done 2026-09-13 (commit 692a08e), built early at the parent's request; charts fill in as real answers arrive |
| Content batch 2 | Next generated batch, same verification | Done 2026-09-13: 39 questions, 5 grade 3 skills (multiplication, division, fractions, area and perimeter, counting ways) |
| 5. PDF ingestion tool | Contest PDFs to draft questions | Done 2026-09-13 as a repo command (`npm run content:ingest`), not an in-app upload page; see DEVLOG |
| Later | Reading, Spanish and French with speech input; fatigue detection | Done 2026-09-13 at the parent's request: reading comprehension, Spanish and French words and phrases with read-aloud and optional spoken answers, and a break suggestion instead of fatigue detection |
| 6. Engine tuning from real data | Fixes the first 36 real answers exposed: a reserved new-skill slot, a fifth review box, a miss dropping one box, clearer Find the Bug feedback | Done 2026-09-21, not yet deployed. Before the fix, 25 of 48 skills had never been served and the whole LANGUAGE strand was starved |
| 7. Picked themes | A theme the child chooses from `/choose/[studentId]`, teach cards before knowledge questions, committed flag and logo artwork. Two themes: cars and logos, flags and countries | Built 2026-09-21 at the parent's request. 221 questions across 10 skills, all `"draft"` until the fact-checking pass, so none of it reaches Aishik yet |

Order confirmed by the parent on 2026-09-13: Phase 4 before Phase 3, because the dashboard needs real usage data and the scratchpad is useful immediately.

## Parent to-dos (no code)
- Spot-check a sample of the new cars and world-knowledge facts once they have been through the checking pass.
- Set up the TrueNAS backup (`docs/backup-truenas.md`).
- Repeat the Wi-Fi drop test on the phone (airplane mode, answer, wait, reconnect).
- Spot-check the sample questions listed in `docs/HANDOFF.md`.
