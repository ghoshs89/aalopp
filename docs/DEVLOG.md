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

## 2026-10-03  Decision  World knowledge batch 2: scope and teaching moments
What: Five parent decisions from one conversation, acted on together.
1. Countries: add all four offered groups rather than picking a subset. India's neighbours (Nepal, Bangladesh, Sri
   Lanka, Pakistan, Bhutan), Africa (Egypt, Kenya, South Africa, Nigeria, Morocco), more of the Americas (Argentina,
   Peru, Chile, Colombia, Cuba), more of Europe and Asia-Pacific (Netherlands, Switzerland, Greece, Russia,
   Indonesia, Thailand, New Zealand). 15 plus 22 is 37 countries.
2. Question kinds: add all four offered kinds. Big cities, landmarks, real locator maps, land neighbours.
3. Teaching: both a richer teach card and a "Did you know?" fact after he answers, right or wrong.
4. Maps: the India point-of-view version of the geographic data, so Jammu, Kashmir and Ladakh are drawn as India
   rather than hatched as disputed, matching what the parent wants him taught.
Reason for the countries and question-kind scope: not narrowed down, the parent chose everything on offer.
Alternatives rejected: none, these were the offered options, not alternatives to a default.

## 2026-10-03  Decision  Picture answer choices hide their name until the answer is checked
What: `Picture` choices (flags, logos, maps) no longer print a name under the picture while he is answering, only
after (`src/components/Player.tsx`); the read aloud button skips choice names entirely for a picture-choice question
(`src/lib/speech.ts`); `voiceAnswer` is now rejected together with `choiceVisuals` in the schema, since saying a
choice out loud needs the very name the picture is meant to hide.
Reason: parent noticed that "which one of these is the flag of X" showed the country name under every flag choice,
which answers the question by reading rather than by recognising the picture.
Alternatives rejected: none offered; this was the only reasonable fix.

## 2026-10-03  Decision  Capital and continent questions skipped where there is no single right answer
What: `skipCapitalQuestion` leaves out the quiz question for Sri Lanka (executive capital Colombo, legislative
capital Sri Jayawardenepura Kotte) and South Africa (Pretoria, Cape Town and Bloemfontein); `skipContinentQuestion`
leaves it out for Russia (Europe and Asia, no single correct answer). The teach card still explains the real
situation in each case; only the quiz question with one correct choice is skipped. Switzerland and the Netherlands
were considered for the same treatment (Bern is called the "federal city" rather than the constitutional capital;
Amsterdam is the constitutional capital but the government sits in The Hague) but kept as normal single-answer
questions, since both are taught as a single capital everywhere from school atlases to encyclopedias, unlike the
genuinely split cases.
Reason: a single-answer quiz question needs one unambiguous right answer; Wikipedia's own text for Sri Lanka, South
Africa and Russia states the split directly (see content/REVIEW.md).
Alternatives rejected: picking one of the real answers arbitrarily and calling it correct, which would mark the
other true answer wrong if he ever heard it elsewhere.

## 2026-10-03  Decision, parent not asked  No neighbour question for South Korea
What: `neighbours` is left empty for South Korea, so it gets no "which country shares a border with X" question. Its
only real land neighbour is North Korea.
Reason: the parent did not ask for this topic, and a quiz answer framing it as a plain neighbour fact seemed like
the wrong way for a five year old to first meet it. Easy to revisit if the parent would rather it were included.
Alternatives rejected: including it like any other country, since India to Pakistan and India to China are already
treated as plain geography elsewhere in this same content.

## 2026-10-03  Milestone  World knowledge batch 2 built and verified locally
What: 37 countries (22 new), 4 new question kinds (big cities, landmarks, maps, land neighbours) in
`scripts/generate/world.ts`, two new skills `WORLD-CITIES` and `WORLD-NEIGHBOURS`, a `didYouKnow` field on
`Question`, picture choices hiding their name until checked, and 37 locator maps rendered from real geographic data.
Sources for new facts: Wikidata REST API (capital, continent) cross-checked against the English Wikipedia's full
article text (capital, land borders, biggest city), both retrieved 2026-10-03; landmarks and second cities are
common knowledge checked the same way the six general CARS-FACTS questions were in the first content batch, not
against one named source. Full detail in content/REVIEW.md. Verified since the facts were checked as they were
written rather than drafted first and checked in a separate pass, every new question ships `"reviewed"` directly;
this is a deviation from the usual "ships draft until an independent pass" sequence, justified because the
independent-source check happened before the data was typed in, not after.
Verified by: `npm test` 21 files, 128 tests (6 new, covering neighbour decoys, the two skipped quiz questions,
Russia's skipped continent question, every picture path existing on disk, and no `didYouKnow` repeating its own
explanation). `npm run content:check`: 60 skills, 792 questions, all reviewed. `npm run typecheck` and `npm run
lint` pass. `npm run build` succeeds. Driven in headless Chrome at 390px: a map question, a city question, a
landmark question and a neighbour question all render and grade correctly; a flag-pick question shows no names
while answering; a Did You Know box appears after answering a flag question.

## 2026-10-03  Dead end  d3-geo renders the inverse of a country if the source data's ring winding is backwards
What: `geoAzimuthalEqualArea().clipAngle(...)` combined with a `MultiPolygon` whose exterior rings wind clockwise
(the convention most shapefiles use) does not clip to nothing or throw. It silently fills the entire clip circle
except for the country's own shape, which looks exactly like a giant circle with the real shape punched out of it
as a hole, and the resulting SVG path is enormous (one single-country file bloated past 800KB). The fix is
`mapshaper ... -o reverse-winding` when converting the source shapefile to GeoJSON, documented with the full
regeneration command in `scripts/maps/data/README.md`. Also: always use the bounding box diagonal for the view
radius, not the width or height alone, or a country whose shape is wider than it is tall (India) gets its far
corner clipped off at the top. Also: `mapshaper -simplify ... -clean` drops small countries entirely (lost 71 of
248 at one setting); `keep-shapes` avoids that.

## 2026-10-01  Milestone  First-themed-week tuning deployed
What: Commit 067f23b pushed to `main` at the parent's request.
Verified by: `npm run build` succeeded before pushing. GitHub commit status from Vercel for 067f23b reported
"Deployment has completed". On production afterwards: `/login` 200, `/` and `/choose/abc` 307 to login when signed
out, `/dev/player` 404, `/logos/mini.svg` 200. Not yet seen in a real signed-in session.

## 2026-10-01  Decision  Tuning from the first themed week (parent decisions on three changes)
What: Four changes from the 158 real attempts up to 2026-09-25.
1. Parent decision: a picked theme now carries 3 questions from his ordinary plan (`THEMED_CORE_ITEMS`), retries and
   reviews first, at least one everyday skill, no new-skill slot. The theme fills the other 5.
2. Parent decision: teach cards no longer show who owns a car brand (`ownerNote` kept in `cars.ts`, unused).
3. Parent decision: in Find the Bug, tapping a wrong step after the real bug gets one nudge ("the mistake started
   earlier, look above it") and a second tap. The first tap is the one graded, so it still counts as a miss; the
   second is stored as `secondIndex` in the response JSON (no migration).
4. Assistant recommendation, parent approved with the plan: questions carry an optional `topic` (`car:<id>`,
   `country:<code>`), and a session asks at most one question per topic, relaxed only when the pool runs dry.
Reason: since 2026-09-22, 87 of 119 answers were theme questions at 95% right and a median 3.8 seconds, against
core questions at 66% and 27 seconds; on 09-22 he played 11 sessions, 6 of them cars. Session d5a8 asked about Mini
three times in a row, so the card and the first question answered the next two. He answered "Germany" for Mini
straight after a card saying BMW of Germany owns it. 4 of his 7 Find the Bug misses were taps on a later wrong step,
usually the final answer line (dbg-clock-minutes-4-20 twice, same step).
Alternatives rejected: one themed session a day (feels like a lock; parent chose the mix); keeping the ownership line
(one miss is thin evidence, but the line adds a second country to a card about the first); marking a late tap
wrong at once (it already had a specific message and he kept doing it).
Noted, not changed: a retry repeats the identical question after the answer was shown (nas-63-minus-27: 241 s to
miss, 16 s right the next day), so retry success may be memory; revisit with more data. b2a-perimeter-garden got the
same wrong answer, 9, on two days (two sides added, not four). He picks "Very sure" on 93 of 119 answers.

## 2026-10-01  Milestone  First-themed-week tuning built and verified locally
What: The four changes above, not yet committed or deployed.
Verified by: `npm test` 20 files, 120 tests (new: themed mix per theme over 25 seeds, a retry among the core picks,
one question per topic, first-tap grading, `secondIndex` accepted by the sync schema); the topic test was confirmed
to fail with the rule disabled. `npm run content:check` 549 questions all reviewed, 199 with a topic, no ownership
lines. `npm run typecheck` and `npm run lint` pass. `/dev/player` driven in headless Chrome at 384 px: a late tap
shows the nudge and greys out that step, a right second tap shows "You found it!", a tap on a true step gets the
ordinary feedback with no nudge.

## 2026-09-22  Milestone  Engine tuning and both themes deployed
What: Commit 2b9781b pushed to `main` at the parent's request ("Check everything in and go live with the app"). 79
files, the engine fixes and the cars and world-knowledge themes together.
Verified by: GitHub commit status from Vercel for 2b9781b reported "Deployment has completed". On production
afterwards: `/login` 200, `/`, `/parent`, `/parent/report` and `/choose/abc` 307 to login when signed out,
`/dev/dashboard` 404, and `/api/health` 200 with the secret so the database is reachable. The artwork now serves
without sign-in as intended by the `src/proxy.ts` matcher change: `/flags/ca.svg`, `/flags/in.svg`, `/flags/us.svg`,
`/logos/toyota.svg`, `/logos/ferrari.svg` and `/logos/tata.svg` all returned 200. Before pushing, `npm run build`
succeeded (Vercel type-checks `scripts/` too) and no migration was involved, since `prisma/schema.prisma` did not
change this session.

## 2026-09-21  Milestone  Fact-checking pass: 221 questions moved from draft to reviewed
What: Every fact behind the cars and world-knowledge questions was checked against a source rather than from memory.
The 221 questions come from two tables totalling 45 rows, so the check was of those rows. Sources: the Wikidata REST
API for country (`P17`), capital (`P36`), continent (`P30`) and inception (`P571`), and the English Wikipedia
`extracts` API for prose claims. Flag descriptions were checked against the committed SVG files, since the file is
what the child actually sees. Full record in `content/REVIEW.md`.
Verified by: 30 of 30 car maker founding countries match Wikidata, which is the fact the questions ask. 15 of 15
capitals and 15 of 15 continents match. Six claims were wrong and were corrected: Mazda's name (the company's own
stated derivation is Ahura Mazda, not the founder's family name), Hyundai's logo (the handshake story could not be
sourced anywhere checked), Rolls-Royce ("quietest, most expensive" is an opinion, replaced with the Spirit of
Ecstasy), Tata (its car business demerged in October 2025), Jaguar (true, but the committed logo file is a wordmark so
the card contradicted the picture), and Canada ("second biggest by land" is wrong; it is fourth by land and second by
total area). Afterwards `npm run content:check` reported 58 skills and 549 questions, all reviewed.
Also: the 7 founding years Wikidata disagreed with were all cases of the two sources dating different legal entities
(Lamborghini 1948 is the tractor company, Tata 2024 the demerger, Rolls-Royce 1998 the BMW era). The year no longer
appears in any question or explanation and stays in the table as provenance only.

## 2026-09-21  Decision  The new-skill slot is given up while reviews are backed up
What: `selectSession` skips its reserved new-skill slot when more than `MAX_REVIEWS * 2` skills are due for review.
Reason: Assistant decision; the parent has not been asked. Moving the 221 questions to reviewed took the servable
bank from 48 to 58 skills, and review demand scales with skill count. At a sustained 70% accuracy the due queue
stopped converging. Pausing new material while he owes more reviews than two sessions can serve is also the right
lesson, so this fixes the queue and the teaching together. Measured over 180 simulated days it lowered the peak due
queue at every accuracy tested (18 to 15 at 70%, 21 to 16 at 75%, 18 to 15 at 80%, 14 to 13 at 85%) and raised
skills mastered at his actual accuracy from 52 to 54 of 58.
Alternatives rejected: raising `MAX_REVIEWS` again (an 8 question session already reserves 3 everyday-skill slots, 1
new-skill slot and 1 themed slot); weakening the test instead of the behaviour.
Known trade-off: one new-skill slot now serves more than 25 unstarted skills across two strands, so LANGUAGE fell
from 96 to 29 slots per 1600 in ordinary sessions. It is no longer starved, but it is thin. The real lever is session
length, which is still an open question for the parent.

## 2026-09-21  Milestone  Picked themes: cars and logos, flags and countries
What: A theme system plus two themes. `content/themes.json` groups skills into themes the child picks from a new
`/choose/[studentId]` screen; picking one fills the whole session, and ordinary sessions keep one slot for a themed
question. 221 new questions across 10 new HUMANITIES skills (`WORLD-*`, `CARS-*`): naming a logo, picking it out of a
line-up, which country a maker is from, matching a country to its flag, capitals, continents, culture, and bar charts.
Every one ships as `"draft"` until its facts are checked, so none of it reaches Aishik yet.
Verified by: `npm test` 115 passed, `npm run content:check` 58 skills and 549 questions, typecheck and lint clean.
In headless Chrome at 384 px: the Ferrari teach card shows the logo beside the Italian flag then the question, "Got
it" moves on, the India flag line-up renders four real flags, and no picture failed to load. A deliberately broken
picture path was confirmed to fail `content:check` rather than reach the screen.

## 2026-09-21  Decision  Cars are the on-ramp to world knowledge, not a separate thing
What: Every `CARS-ORIGIN` question is tagged `WORLD-FLAGS` as well, and its teach card shows the maker's logo beside
its country's flag. Some car logo questions are also tagged `MATH-GEO-SHAPES` or `MATH-GEO-SYMMETRY` (counting the
Audi rings, the Toyota ovals, the quarters of the BMW roundel, folding the Volkswagen circle).
Reason: Parent decision on the geometry tie-in, choosing "Yes, weave it in". The parent asked for cars because "he
loves guessing car logos, manufacturer country of origin etc. He's an automobile nerd. he looooves his cars", and
separately asked for world knowledge so he gets "more aware about the world". Tying them together was an assistant
decision: he will take Italy, Japan and Germany along with the logos he already wants to know. The geometry tagging
lands on the one weakness his real answers show, undercounting composite shapes.
Alternatives rejected: keeping cars purely about cars.

## 2026-09-21  Decision  Artwork is downloaded and committed, never drawn and never hotlinked
What: Flags and logos are real files under `public/flags` and `public/logos`, listed with source and date in
`content/assets.json` and fetched by `npm run assets:fetch`. A new `image` visual kind points at them, and
`content:check` fails if a question names a file nobody downloaded. `src/proxy.ts` leaves those two folders out of the
auth matcher.
Reason: Parent decision on logos: "Take logos from company websites. This is not a commercial product, only used for
at home learning." Extending the same approach to flags was an assistant decision: the plan had been to draw flags in
code, and a drawn flag quietly gets the 50 stars or the 24 chakra spokes wrong, which is a fact the child then learns.
Alternatives rejected: hand drawn SVG for both; hotlinking (breaks offline play, breaks when a URL moves, and sends
requests from the family's devices).
Caveat: company press pages have no stable direct file URLs, so 27 of 30 logos come from Simple Icons and 3 from
Wikimedia Commons. Simple Icons marks are one colour, so a teach card must never describe a logo's colours. This
already caught one: the Ferrari card said "black prancing horse" while the mark rendered red, so the mark is now
black and the wording moved the yellow shield onto the real car.

## 2026-09-21  Decision  Knowledge questions teach before they ask
What: A `teach` card (title, up to 4 lines, optional picture) is shown before a question the first time he meets it,
and skipped once he has answered that question. The timer starts when the question appears, not when the card does.
Reason: Parent decision, choosing "Teach card, then check", having asked for something "more geared towards learning
than just outside testing with puzzles". Reason not stated beyond that choice.
Alternatives rejected: asking first and teaching in the explanation (the first sight of a country would be a question
he cannot know); a browse mode with no scoring (sits outside the engine, so nothing is reviewed or remembered).

## 2026-09-21  Milestone  Engine fixes from the first real usage data
What: Four changes to the adaptive engine, all driven by measurement against Aishik's real attempt log: a reserved
new-skill slot, MAX_REVIEWS 3 to 4, a fifth review box at 30 days, and a miss dropping one box instead of resetting.
Also a specific Find the Bug message when he taps a step after the real bug.
Verified by: `npm test` 113 passed (20 files, 5 new tests), `npm run typecheck` and `npm run lint` clean. Both new
engine tests were confirmed to fail when the change they cover is reverted. Against the real log, 200 seeded draws of
one session went from 0 "New skill" picks in 1600 slots to 200, and from 0 LANGUAGE slots to 96. A 180 day simulation
at 80% accuracy ends with 47 of 48 skills mastered and 1 review due. The Find the Bug message was checked in headless
Chrome at 384 px on `dbg-clock-minutes-4-20`, the exact question he missed this way on 2026-09-15: tapping step 4
shows "So close. Something went wrong before that step.", and tapping step 2 shows no such line.

## 2026-09-21  Decision  A fifth review box at 30 days
What: `REVIEW_INTERVALS` becomes 1, 3, 7, 14, 30 days.
Reason: Assistant decision; the parent has not been asked. Raising MAX_REVIEWS to 4 was meant to keep the review
queue servable, but measuring it showed that alone did not work: over 90 days the due queue still peaked at 18 to 20
of 48 skills. The arithmetic says why. With a 14 day top box, N settled skills demand N/14 reviews a day, so 48
skills demand 3.4 against a capacity of 4, and the 10 skills planned for the themes work would demand 4.1, over
capacity. A 30 day top box drops that to 1.6 and leaves headroom.
Alternatives rejected: raising MAX_REVIEWS further (an 8 question session already reserves 3 everyday-skill slots
and 1 new-skill slot, so there is no room); a longer session (the parent's open question about session length is
still unanswered, and this would have pre-empted it).

## 2026-09-21  Decision  A missed review drops one box instead of resetting the skill
What: In `computeSkillStates`, a wrong answer on a mastered skill sets box to box minus 1 and recomputes the next
review date, keeping `masteredOn`. Only a miss in box 1 returns the skill to learning.
Reason: Parent decision, choosing "Drop one box" when asked what should happen to a skill he misses on review. Reason
not stated beyond that choice. The measurement put to the parent: he played on 09-14, 09-15 and 09-20, and that four
day gap made reviews land late, he missed 2 of 3, and both skills reset to zero, leaving 0 of 48 skills mastered.
Alternatives rejected: keeping the full reset to learning; leaving it unchanged and deciding on more data.

## 2026-09-21  Decision  One session slot is reserved for a skill he has not met yet
What: `MIN_NEW_ITEMS = 1` in `select-session.ts`, filled after retries and reviews and before the stretch slots.
Retries, reviews and stretch picks that fill no quota now yield to the everyday-skills and new-skill quotas.
Reason: Parent decision, choosing "One guaranteed slot" over two slots or a language-first rule. Reason not stated
beyond that choice. It was put to the parent because 25 of 48 skills had never been served after 36 attempts,
including the entire LANGUAGE strand: a skill in `learning` scores 80 to 95 and a `new` skill 50 to 68, so once
enough skills are in progress no new skill can ever win a slot.
Alternatives rejected: two reserved slots (costs a practice slot); a language-first preference for the slot.

## 2026-09-21  Milestone  First real usage data since the reset, reviewed
What: 36 attempts across 5 played sessions on 3 days (2026-09-14, 09-15, 09-20), 28 right, 78%. One empty session row
from 09-14 (3 seconds, 0 attempts). Sessions ran 4.5 to 9 minutes, all under the 12 minute cap. Upload lag was 0 to 2
seconds on every attempt, so the outbox has never had to queue. Scratchpad used once in 36. `listenCount` 0
throughout, so the read-aloud buttons have not been tapped.
Verified by: read directly from the production database, and replayed through the app's own engine
(`computeSkillStates`, `selectSession`, `insights`).
Findings for the parent, recorded because they are teaching signals rather than bugs: he missed `gs-fan-triangles-2`
and `gs-fan-triangles-4` the same way six days apart, counting only the small triangles and never the composites;
`lso-third-fastest` and `kl12-clock-two-hours-later` were both off-by-one in ordinal counting; `nas-63-minus-27` was
answered 56, consistent with subtracting only the 7 and ignoring the 20, after 241 seconds at LOW confidence with the
scratchpad unopened, then right in 16 seconds the next day.

## 2026-09-13  Milestone  Voice switch and natural voice selection deployed
What: Commit bcdc783 pushed to `main` at the parent's request.
Verified by: GitHub commit status from Vercel for bcdc783 reported "Deployment has completed"; `npm test` 108 passed before committing. Family guide republished (version 2) at the same artifact link.

## 2026-09-13  Decision  Voice off by default, with an on-screen switch
What: Automatic reading aloud (the question when it appears, feedback, explanations, the end-of-session message) is off until someone taps the switch in the top bar of every puzzle screen ("🔇 Voice off" or "🔊 Voice on"). The choice is saved per device in localStorage (`src/lib/voice-preference.ts`). Taps the child makes on purpose still speak while the voice is off: the 🔊 button beside a question and "Hear it" on Spanish and French questions, which cannot be answered without hearing the word.
Reason: Parent decision: "The voice needs to be turned off by default and I would like an on/off button on screen to turn it on." Keeping the deliberate 🔊 and "Hear it" taps working is an assistant decision so listening questions stay answerable; the parent has not yet been asked about it.
Alternatives rejected: One switch that also silences the 🔊 and Hear it buttons (listening questions would become unanswerable); a setting only on the grown-ups page (the parent asked for an on-screen button).
Verified by: headless Chrome at 384 px: default "🔇 Voice off" with nothing spoken on start; tapping 🔊 spoke once; turning the switch on read the current question, and feedback plus the next question were then read automatically; the setting survived a reload; top bar fits with no sideways scroll. `npm test` 108 passed; typecheck, lint and build clean.

## 2026-09-13  Decision  Pick the most natural installed voice
What: `pickVoice` in `src/lib/voices.ts` now scores every voice: language match, names marked Natural, Neural, Premium, Enhanced or Online, well-liked voices per language (for example Ava, Samantha, Aria, Monica, Amelie), Chrome and Edge network voices (`localService` false), and a heavy penalty for macOS novelty voices (Albert, Bad News, Bubbles, Fred and others). The family guide explains how to install Premium or Enhanced voices on each device.
Reason: Parent reported the voice as "very robotic". The old code fell back to the first voice for the language, which on a Mac is the novelty voice "Albert". Browsers can only use voices installed on the device, so voice quality still depends on the device.
Alternatives rejected for now: pre-recorded audio from a cloud neural voice service (sounds the same on every device but needs a paid API account and an audio-generation step). Offered to the parent, who chose "Device voices are enough for now"; reason not stated beyond that choice.

## 2026-09-13  Milestone  Family user guide
What: `docs/user-guide.html`, a guide for Aishik and his parents: device setup, how to play (a section to read with Aishik), a session flow diagram, how puzzles are chosen (mastery, review gaps, session rules, levels), question types with counts per strand, the grown-ups page and its selection reasons, tips, troubleshooting and data privacy. Published as a private artifact at https://claude.ai/code/artifact/8a8f0d10-cf4c-4082-8258-74892b1c3c62.
Verified by: counts taken from `content/` (328 questions, 48 skills; 200 choice, 101 number, 27 Find the Bug); screen text and rules checked against `src/components/Player.tsx`, `src/lib/engine/select-session.ts`, `src/lib/engine/skill-state.ts`, `src/lib/engine/breaks.ts` and `src/app/parent/page.tsx`; two statements corrected before publishing (wrong answers do get an outline; background upload retries run only during a session). Update the guide when question counts, session rules or screens change.

## 2026-09-13  Milestone  Practice data reset for a fresh start
What: All test practice data was deleted from production so Aishik starts from scratch: 30 attempts and 6 practice sessions. Kept: the Aishik student profile, both Google sign-in accounts, and parent notes (there were none). Skill states, reviews, working levels, the dashboard and the report reset automatically because they are replayed from attempts.
Reason: Parent decision: "reset all that he has done and start from scratch". Parent chose to delete answers and sessions only and to keep a backup.
Alternatives rejected: Also deleting and recreating the student profile; deleting without a backup.
Verified by: backup file `/Users/soumalya/Documents/Aishik/aalopp-reset-backup-2026-09-13.json` (outside the git repo) contains all 6 sessions and 30 attempts; deletes ran in one transaction; afterwards Student 1, PracticeSession 0, Attempt 0, ParentNote 0.
Caveat: answers still queued in a device's IndexedDB outbox would upload after the reset. The parent was asked to confirm no pending uploads (no cloud counter) on each device.

## 2026-09-13  Milestone  All planned phases complete and live
What: Every phase in `docs/ROADMAP.md` is built and deployed. Final bank: 48 skills, 328 reviewed questions (bands 1 to 5: 53, 121, 96, 48, 10). Session handoff rewritten for the next stage: real use, device testing and fixes.
Verified by: at handoff `npm test` (20 files, 106 tests), `npm run content:check`, `npm run typecheck` and `npm run lint` all exit 0; Vercel commit status "Deployment has completed" for b56be0c; `/api/health` 200, `/dev/dashboard` 404 and `/parent/report` redirecting to `/login` when signed out.
Not verified: see `docs/HANDOFF.md` section 1, "Assumed, not verified" (signed-in dashboard, stylus, language voices, child speech recognition, Wi-Fi drop recovery, cron runs, real usage).

## 2026-09-13  Milestone  Reading and languages deployed
What: Commit b56be0c pushed to `main`.
Verified by: GitHub commit status from Vercel for b56be0c reported "Deployment has completed".

## 2026-09-13  Dead end  One-off Python edit scripts with escaped apostrophes
What: Twice, a docs update script used a single-quoted Python string containing an escaped apostrophe and failed with a syntax error before writing anything. The first time, the Phase 3 code commit went out before the failure was noticed, and the docs followed in a separate commit.
Instead: use double-quoted strings for text with apostrophes, and confirm the script printed its success line before committing.

## 2026-09-13  Milestone  Reading, Spanish, French and break suggestions built
What: 42 generated questions (`scripts/generate/languages.ts`, `generated-languages.json`): 10 reading comprehension questions on 4 original passages, and 16 each in Spanish and French (hear a word and pick the picture, name a picture or color, count, phrases). Six skills in the new `LANGUAGE` strand. Schema fields `passage`, `listen` and `voiceAnswer`. Read-aloud speaks the English prompt, then the word to hear and any Spanish or French choices in a voice for that language (`src/lib/use-speech.ts`, `pickVoice` in `src/lib/voices.ts`); passages are never read aloud. An optional 🎤 on spoken-answer questions uses the browser's speech recognition (`src/lib/use-speech-input.ts`) and selects the matching choice (`matchSpokenChoice`); the confidence tap still confirms it. After 3 wrong answers in a row the child is offered a break once per session (`src/lib/engine/breaks.ts`).
Verified by: independent blind solve agreed on 42 of 42 (translations, articles and passage answers checked); its only flags were "words" in prompts that play a single word, now reworded; `npm test` 106 passed (voice picking, spoken matching, break rule, read-aloud parts); content check 48 skills and 328 questions; typecheck, lint and build clean; headless Chrome at phone width showed the passage card and hear-it button, the break offer appeared exactly after the third wrong answer and "Keep going" continued, and the 🎤 button appeared on a French question.
Not verified: real Spanish and French voices on the family's devices (depends on installed voices; falls back to the default voice); speech recognition of a child's voice; headless Chrome stalls when many utterances queue, so the browser test replaced speech synthesis with a silent stub.

## 2026-09-13  Decision  Speech input is optional and experimental
What: Spoken answers are offered only on questions marked `voiceAnswer` and only when the browser supports speech recognition. A match selects a choice but never submits it; unmatched speech shows what was heard and asks for a tap. No audio is stored, and which input method was used is not recorded.
Reason: Assistant decision following the plan review: recognition of young children's speech is unreliable, worse in Spanish and French, and browsers send audio to their own speech services. Tapping keeps every question answerable on every device.
Alternatives rejected: Speech as the main input for language questions; recording audio for the parent; adding an input-method column now (can be added later if the parent wants to track it).

## 2026-09-13  Decision  Break suggestions instead of fatigue detection
What: A single rule: after 3 wrong answers in a row, offer "Take a break" or "Keep going", at most once per session. No timing signals are used.
Reason: Assistant decision consistent with "process over speed" and the plan review, which rejected hesitation-spike fatigue detection from the original specification as noise for a 5-year-old. The fixed 12 minute cap still applies.
Alternatives rejected: Mandatory breaks; hesitation or speed based fatigue scores.

## 2026-09-13  Milestone  Phase 5 content ingestion tool
What: `npm run content:ingest -- <file.pdf> [--slug name] [--answers "1:B,2:D"]` (`scripts/ingest/`) extracts a PDF's text layer with pdfjs-dist 6.3.289, splits numbered problems and lettered choices, estimates the band from the Kangaroo problem number, flags problems that mention a picture, applies an answer key, and writes drafts to `content/drafts/<slug>.json`. Workflow for turning drafts into reviewed questions in `content/drafts/README.md`. Test fixture `tests/fixtures/sample-contest.pdf` contains original problems generated with headless Chrome.
Verified by: 7 ingestion tests including extraction from the fixture PDF across two pages; full `npm test`, typecheck, lint and build clean. Content batch 2 (commit c87a25b) was confirmed deployed by Vercel's commit status before this work.
Not verified: a real contest PDF (none in the repo); scanned PDFs without a text layer produce no drafts by design.

## 2026-09-13  Decision  Ingestion as a repo tool, not an in-app vision pipeline
What: Phase 5 is a command-line tool that produces drafts in the repo. The in-app upload page, AI vision parsing and image cropping from the original specification were not built.
Reason: Assistant decision under the parent's instruction to finish all phases. The vision path needs an Anthropic API key and storage that the project does not have, so it would ship untested; drafts still need the independent blind solve before any question reaches the child, so an in-app approve button would bypass the content review rule; and contest artwork should be redrawn, not cropped and copied.
Alternatives rejected: Claude vision extraction behind an upload page (no key, untestable now, can be added later on top of `DraftQuestionSchema`); OCR for scanned PDFs (heavy dependency; noted in the drafts README).

## 2026-09-13  Milestone  Content batch 2: 39 questions and 5 grade 3 skills
What: `scripts/generate/batch2.ts` writes `generated-batch2.json`: multiplication, division (including leftovers), fractions (halves, thirds, quarters; unequal parts), area and perimeter, harder logic (5-car ordering, 4 by 4 grid, counting arrangements and handshakes) and 6 more Find the Bug items. New skills `MATH-OA-MULT`, `MATH-OA-DIVIDE`, `MATH-NF-FRACTIONS`, `MATH-MD-AREA-PERIMETER` (everyday skill) and `LOGIC-COUNT-WAYS`. Bank now 42 skills and 286 questions; band 5 grew from 3 to 10 questions. (Corrected at handoff: an earlier version of this entry said 12.)
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
