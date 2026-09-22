# Session Handoff  2026-09-21  Engine tuned from real data; themes built, fact-checked and ready to deploy

> Read this fully before acting. It is the state of the work as of the end of the last session. Assume you have no memory of that session and may be a different model. This document plus the repository should be enough to resume.
>
> Before trusting any claim below, the previous session should have verified it against the repo, not the conversation. If a section says "assumed", treat it as unconfirmed.

## How this was verified
Commands run at handoff time on 2026-09-21 from the repo root (`aalopp/`), all exit code 0:
- `npm test`: pass. 20 test files, 115 tests (5 new: a 180 day review-queue run at two accuracies, every servable skill getting served, the new-skill slot, and a miss dropping one box).
- `npm run content:check`: pass. 58 skills, 549 questions, all reviewed. By primary strand: LOGIC_CS 98, MEASUREMENT_DATA 79, HUMANITIES 221, GEOMETRY_SPATIAL 42, LANGUAGE 42, OPERATIONS_ALGEBRA 34, NUMBER_BASE_TEN 33.
- `npm run typecheck`: pass. `npm run lint`: pass.
- Both new engine tests were confirmed to fail when the change they cover is reverted, and the picture check was confirmed to fail on a deliberately broken path.

Repo state: **nothing is committed.** All of this session's work is uncommitted in the working tree, and nothing is deployed. Production still runs `f44be31`.

## 1. Current state
- Works and verified:
  - Live at `https://aalopp.vercel.app`, still on `f44be31`. Checked this session: `/login` 200, `/`, `/parent` and `/parent/report` 307 to login when signed out, `/dev/dashboard` 404, `/api/health` 401 without the secret and `{"ok":true}` with it. Vercel commit status for `f44be31`: "Deployment has completed".
  - Real usage since the 2026-09-13 reset: 36 attempts across 5 played sessions on 3 days (09-14, 09-15, 09-20), 28 right, 78%. Sessions ran 4.5 to 9 minutes. Upload lag 0 to 2 seconds on every attempt.
  - Engine fixes (uncommitted): a reserved new-skill slot, `MAX_REVIEWS` 3 to 4, a fifth review box at 30 days, a miss dropping one box instead of resetting, and a specific Find the Bug message when he taps a step after the real bug.
  - Themes (uncommitted): `content/themes.json`, a `/choose/[studentId]` screen, teach cards, an `image` visual, picture answer choices, 45 committed artwork files, 221 draft questions.
- In progress: nothing. The fact-checking pass is done and recorded in `content/REVIEW.md`; six wrong claims were found and corrected, and all 221 questions are now `"reviewed"`. Both themes appear on the choose screen. Verified by simulation: a cars session and a world session each drew 400 picks with zero off-theme questions, and all 200 sampled ordinary sessions contained a themed question.
- Broken or known failing: none observed.
- Assumed, not verified:
  - Everything from the 2026-09-13 handoff that still stands: the parent dashboard in a real signed-in session, the scratchpad with a real stylus, voice quality on family devices, speech recognition of a child's voice, the offline queue after a real Wi-Fi drop.
  - The daily Vercel cron calling `/api/health`. The runtime logs API returns 403 on this plan, so cron runs could not be confirmed from the command line. Check the Vercel dashboard, project `aalopp`, Cron Jobs tab.
  - Every screen in this session was checked in headless Chrome at 384 px, never on a real device.

## 2. Decisions made this session
All are in `docs/DEVLOG.md` with reasons and attribution. Treat as settled; do not reopen without new cause.
- Parent: a missed review drops a skill one box instead of resetting it to learning.
- Parent: one session slot is reserved for a skill he has not met yet.
- Parent: knowledge questions teach first, with a card before the question.
- Parent: picking a theme fills the whole session, and ordinary sessions also mix in a themed item.
- Parent: the first world batch covers flags, capitals and maps, culture and daily life, and numbers about countries.
- Parent: "Take logos from company websites. This is not a commercial product, only used for at home learning."
- Parent: car logos double as shape and symmetry practice.
- Assistant, parent not asked: the fifth review box at 30 days, and extending the downloaded-artwork approach from logos to flags.

## 3. Constraints and invariants the next session must not violate
Standing rules are in `CLAUDE.md`, which gained three sections this session: knowledge-content review, Pictures, and Themes. The ones easiest to break:
- Knowledge content stays `"draft"` until an independent pass checks each fact against a source and records it in `content/REVIEW.md`. A wrong puzzle answer is a bad question; a wrong fact is something Aishik learns and repeats.
- A teach card must never describe a logo's colours. The logos are one-colour marks, so the card and the picture would contradict each other. This already happened once with Ferrari.
- Country of origin means where a brand was founded, never who owns it now. `scripts/generate/cars.ts` keeps `country` and `ownerNote` in separate fields for exactly this reason.
- Never hand draw a flag or a logo, and never hotlink one. Add it to `content/assets.json` and run `npm run assets:fetch`.
- The top review interval is load-bearing. N skills demand N/30 reviews a day against the 4 a session can serve; at the old 14 day top box the due queue grew without bound. Rerun `simulation.test.ts` after touching any cap or interval.
- Everything from the previous handoff still holds: never edit `generated-*.json` by hand, a new question file must be imported in `src/content/bank.ts`, migrations stay compatible with the previous deployment, `Attempt.localDate` stays nullable.
- The autonomous commit-and-push authorization covered finishing the original phases only. Confirm with the parent before committing this session's work.

## 4. Next steps, prioritized
- Commit and deploy | the parent confirms, then push; Vercel commit status reports "Deployment has completed" | the engine fixes in Part 1 are independent of the themes and can ship first if preferred.
- Parent walkthrough on a real device | a session on a tablet and a phone, both themes, every grown-ups tab, a note saved and the report printed | collect issues into section 5.
- Two weak logo files | Mahindra and Jaguar came through as wordmarks rather than marks, which are poor for "guess the logo" | replace the `sourceUrl` in `content/assets.json` and rerun `npm run assets:fetch -- --force`.
- Device checks, TrueNAS backup, engine tuning from more data | unchanged from the previous handoff | `docs/backup-truenas.md` needs the parent at the NAS.

## 5. Open questions and blockers
- Parent input: is 8 questions the right session length? Asked 2026-09-13, still unanswered, and now the most consequential open question. An 8 slot session reserves 3 everyday-skill items, 1 new skill and 1 themed item, and one new-skill slot has to serve more than 25 unstarted skills across two strands. LANGUAGE fell from 96 to 29 slots per 1600 in ordinary sessions once the themes went live. It is not starved, but a longer session is the real lever.
- Parent input: the four brands with no usable logo file are Mercedes-Benz (resolved from Commons, fine), Alfa Romeo (dropped, only model wordmarks found), plus the two weak files above. Does he want Alfa Romeo?
- Parent action: TrueNAS backup still not set up. Answer data exists only in Supabase.
- Parent action: Wi-Fi drop test on a phone.
- Parent spot-check suggestions: `car-from-ferrari`, `car-flag-tata`, `car-shape-audi-rings`, `car-sym-vw`, `car-fact-f1`, `world-flag-detail-in`, `world-capital-ca`, `world-continent-au`, `world-culture-ca`. The six general `CARS-FACTS` questions are the ones not taken from a source, so they are worth a look first.

## 6. Dead ends
Also in `docs/DEVLOG.md` where durable.
- Everything in the previous handoff still applies: deployment detection via `/_next/static/chunks/`, `prisma migrate diff --from-migrations`, Python one-off scripts with escaped apostrophes, queued speech stalling headless Chrome, reading pixels from a hidden canvas.
- Trusting a lead summary as a fact check. Wikipedia's `summary` endpoint confirmed only about half the prose claims; the rest needed the full article via `prop=extracts&explaintext=1`, which is where the Mazda, Hyundai and Canada errors surfaced.
- Wikidata's `action=wbsearchentities` and `wbgetentities` API. It rate limits an anonymous burst within a handful of requests and returns plain text, not JSON, when it does. The REST endpoint `\`/w/rest.php/wikibase/v1/entities/items/<QID>\`` is fine, and Wikipedia's `summary` endpoint hands over the QID.
- Guessing a company's own logo URL. Press pages are JavaScript driven with no stable direct file URLs; `https://www.toyota.com/.../logo.svg` returns an HTML 404 page. The MediaWiki `pageimages` API is no better, returning headquarters photographs for Toyota, Audi and Ferrari. Use Simple Icons for a predictable URL, or resolve an exact Commons file title.
- Counting broken images in a page whose `onerror` handler rewrites the element. The images leave `document.images`, so the count comes back zero and everything looks fine. Set a data attribute instead and count that.
- Top-level `await` in a `scripts/*.ts` file. `tsx` builds them as CommonJS here, so wrap it in a `main()`.

## 7. Orientation for a cold reader
`CLAUDE.md` covers the stack, commands and standing rules; `docs/ROADMAP.md` covers the plan. This section is only what matters for resuming. Everything in the previous handoff's orientation still applies. What is new:
- Choosing what to play: `src/app/page.tsx` (who is playing) links to `src/app/choose/[studentId]/page.tsx` (today's puzzles, or a theme), which links to `/play/[studentId]?theme=<id>`.
- Themed selection: `selectSession` takes a `SessionOptions` with `themeSkills` (the mix-in quota) and `onlySkills` (a themed session). Skill states are always computed from the whole bank, so picking a theme never distorts what the engine believes.
- Teach cards: `teach` on a question, rendered by the `learning` phase in `src/components/Player.tsx`. The play page passes `seen`, the ids he has already answered, so a card shows once. The answer timer starts in `beginQuestion`, not when the card appears.
- Pictures: the `image` visual kind, rendered by `Picture` in `src/components/visuals/Visual.tsx` on a white tile. Files in `public/flags` and `public/logos`, manifest `content/assets.json`, fetched by `npm run assets:fetch`. `src/proxy.ts` excludes both folders from the auth matcher.
- Picture answer choices: `choiceVisuals` on a choice answer, one per choice in the same order.
- Generators: `scripts/generate/cars.ts` and `scripts/generate/world.ts`. `pickSpread` in `helpers.ts` varies the wrong answers; without it every logo question offered the same three decoys and he would have learned to spot the odd one out.
- A throwaway harness for driving the app in headless Chrome lives in the session scratchpad with `puppeteer-core`, not in the repo. Stub `window.speechSynthesis` before the page loads.
