# Content review log

## 2026-09-21: Fact-checking pass, cars and world knowledge (221 questions)

A fact cannot be blind solved, so the rule for the `HUMANITIES` strand is different: every fact is checked against a
source rather than re-derived. This pass checked the two source tables the 221 questions are generated from, which is
45 rows rather than 221 questions, since every question is built from those rows.

**Sources**, all retrieved 2026-09-21: Wikidata REST API (`P17` country, `P36` capital, `P30` continent, `P571`
inception) and the English Wikipedia `extracts` API for prose claims. Flag descriptions were checked against the
committed SVG files in `public/flags` rather than against a text source, since the file is what the child sees.

### Checked and correct

| What | Rows | Result |
|---|---|---|
| Car maker founding country | 30 | 30 of 30 match Wikidata `P17`. This is the fact the questions actually ask. |
| Country capital | 15 | 15 of 15 match Wikidata `P36`. |
| Country continent | 15 | 15 of 15 match Wikidata `P30`. |
| Flag descriptions | 15 | 15 of 15 match the committed file, checked by eye at phone width. |
| Ownership notes | 6 | Lamborghini and Volkswagen Group, Mini and BMW, Rolls-Royce and BMW, Land Rover and Tata, Jaguar and Tata, Volvo and Geely. All confirmed. |
| Bar chart arithmetic | 5 | Recomputed by hand. The charts describe a made up car park and class survey, so no real world figure is claimed. |
| Logo shape and symmetry counts | 11 | Checked against the committed logo files, not from memory: 4 Audi rings, 3 Toyota ovals, 3 Mercedes points, 6 Subaru stars, 4 BMW quarters, 2 Citroen arrows. |

### Corrected before shipping

| Fact | Was | Now | Why |
|---|---|---|---|
| Mazda name | "comes from the family name of its founder, Jujiro Matsuda" | "named after Ahura Mazda, an ancient god of wisdom" | Contradicted the company's own stated derivation, which Wikipedia quotes directly. The Matsuda link is a common belief, not the official one. |
| Hyundai logo | "a slanted H, made to look like two people shaking hands" | "Hyundai owns part of Kia" | The handshake story could not be found in any source checked. Replaced with a fact the article does state. |
| Rolls-Royce | "some of the quietest, most expensive cars there are" | "the little silver figure on the front is called the Spirit of Ecstasy" | An opinion, not a fact. The mascot is verifiable and better for a child. |
| Tata | "one of India's biggest companies and builds cars, buses and trucks" | "one of India's biggest companies, and it owns Jaguar and Land Rover in Britain" | Tata Motors demerged its passenger car business in October 2025, so "builds cars" needed care. |
| Jaguar | "Jaguar's badge is a leaping cat" | "named after the big cat, and a leaping jaguar sits on the front of the car" | True, but the committed logo file is a wordmark, so the card would have contradicted the picture beside it. |
| Canada | "the second biggest country in the world by land" | "the second biggest country in the world by total area" | Wikipedia: "By land area alone, Canada ranks fourth." Second is by total area including water. |
| Ferrari (earlier, same session) | teach card said "a black prancing horse" | picture changed to black, card now notes the yellow shield is on the real car | The one-colour mark rendered red, so the words and the picture disagreed. |

### Founding years removed from the shipped text

Wikidata disagreed with 7 of the 30 founding years, and in every case because the two sources date different legal
entities: Lamborghini 1948 is the tractor company and 1963 the car company, Tata 2024 is the demerger, Rolls-Royce
1998 is the BMW era, Renault 2002 a restructure, Peugeot 1810 the family firm and 1896 its first car, Mini 1969 the
marque and 1959 the car, Ferrari 1947 the road car company and 1939 its predecessor. None of these is a useful thing
to tell a five year old with confidence, so the year no longer appears in any question or explanation. It stays in
`scripts/generate/cars.ts` as provenance, with a comment saying why it is not shown.

### Not from a source

The six general `CARS-FACTS` questions (a car has four wheels, a Tesla runs on a battery, the steering wheel turns the
front wheels, off-roaders are built for rough ground, a Formula 1 pit crew changes tyres in seconds, big trucks have
more wheels to spread a heavier load) are everyday knowledge rather than sourced claims. They are the ones for the
parent to spot-check first.

### Outcome

All 221 questions moved from `"draft"` to `"reviewed"`. Parent spot-check suggestions: `car-from-ferrari`,
`car-flag-tata`, `car-shape-audi-rings`, `car-sym-vw`, `car-fact-f1`, `world-flag-detail-in`, `world-capital-ca`,
`world-continent-au`, `world-culture-ca`.

## 2026-09-12: Phase 0 import

### `bebras_100_questions.md` (5 kept of 100)
The file has only 7 distinct questions; the rest are copies (Tasks 4 to 25, 26 to 50, 51 to 75 and 76 to 100 each repeat one question).

| Task | Decision | Why |
|---|---|---|
| 1 Beaver path | Kept, choices reordered | Every original answer was A |
| 2 Robot chef | Kept, choices reordered | Every original answer was A |
| 3 Ice cream machine | Rewritten | Under a "new topping goes on top" reading, the listed answer was the result of the normal order, not the reversed one. Now asks which topping ends on top. |
| 4 to 25 Robot walls | Excluded | Not solvable: no map, and "walls on every even step" does not determine turns |
| 26 to 50 Forest pattern | Kept once | Easy warm-up |
| 51 to 75 Number cipher | Kept once, new word (BED) | Original was fine; new word adds one more letter to decode |
| 76 to 100 Lodge streams | Excluded | Refers to a map that does not exist; choices are meaningless |

### `BRIGHT STEPS/kangaroo.html` (18 kept of 24)

| # | Decision | Why |
|---|---|---|
| 7 Footprints | Excluded | Question and choices do not make sense |
| 9 See-through cards | Excluded | Choices C and E describe the same picture |
| 10 Fold and cut | Excluded for now | Needs a real diagram; answer depends on the triangle's orientation on the fold |
| 18 Caterpillar grid | Excluded | Grid does not match the explanation |
| 23 Missing cubes | Excluded for now | Emoji picture cannot show a 3D corner |
| 24 Smiley card flip | Excluded | Flipping a card "to the right" shows its back |
| 5 Butterfly | Reworded | "A mirror is placed" was confusing |
| 13 Rope | Explanation fixed | Piece lengths were described backwards |
| 14 Ages | Reworded | "Bob is 2 years younger than Cody" restated as "Cody is 2 years older than Bob" for a 5-year-old |
| 16 Shadow | Choice changed | "An oval" was a defensible answer; replaced with "A heart" |
| 17 Stacked cards | Band lowered to 2 | Trivial for a 5-point item |
| 19 Seating | Fixed | Said "five children" but described three |
| 20 Sticks | Visual changed | Picture now shows one square so the child reasons about the shared side instead of counting |

### `measurement-cars.json` (16 new)
Original car-themed Measurement and Data items (clocks, money, rulers, bar graphs), targeting the weakest IXL strand. Answers checked by hand. Uses US-style money and inches, matching IXL's flagged skills.

## 2026-09-13: Generated batch (187 questions, 12 new skills)

Files: `generated-measurement.json` (56), `generated-numbers.json` (41), `generated-geometry.json` (37), `generated-logic.json` (53). Written by the scripts in `scripts/generate/`; never edit the JSON by hand. Run `npm run content:generate`, and a test fails if the JSON is out of date.

How answers were checked:
1. **Computed, not typed.** Clock times, coin totals, ruler lengths, graph readings and calendar dates (October 2026) come from the data. Matchstick and hole-punch counts follow formulas. Ordering clues and grid puzzles run through a solver that must find exactly one solution, and shortest routes use Dijkstra's algorithm, checked for a unique best route.
2. **Independent blind solve.** Two separate agents solved all 187 questions without the answer key. They agreed with the computed answer on 187 of 187.
3. **Wording flags from the solvers, all fixed:**
   - Balance blocks: "a 5" was unclear; it now uses a balance scale with gram weights.
   - Tally marks: the prompt gave the answer away; hint removed.
   - Minute hand quarter turn: no direction given, and a counterclockwise turn gave another listed choice; now says clockwise.
   - Tunnel cars: the picture put the blue car in front, contradicting the text; redrawn with the dead end marked.
   - Undo the walk: two choices both returned the robot home; the second one was replaced.
   - Triangle row: the drawing's code had 3 sticks drawn twice (looked right, but sloppy); now exactly 9.
   - Pages graph "counts by 2s": false alarm; the axis does count by 2s above 10.
4. **Caught by the generators themselves:** the first 4 by 4 number puzzle had 2 solutions, and the first vehicle puzzle had none. Both were rebuilt. A later check swapped the 🔷 in the "4 square corners" path for a ⭐, since a square turned on its corner also has square corners.
5. **Visual check:** every emoji and grid question, plus each new picture type (coins, rulers, picture graphs, calendar, route maps, tally marks, matchsticks), was screenshot at phone width. Nothing is cut off. The bus 🚌 in the vehicle puzzle looked too much like the taxi on Apple devices and was swapped for a tractor 🚜.

Review status: shipped as reviewed under the spot-check policy (parent spot-checks a sample rather than approving each item).

## 2026-09-13: Blind solve of the 39 hand-typed questions

The review rule (see `CLAUDE.md` and `docs/DEVLOG.md`) requires an independent blind solve for questions to ship as reviewed. The 39 hand-typed questions in `kangaroo-style-l12.json`, `bebras-style-starter.json` and `measurement-cars.json` had only a hand check, so an independent agent solved all 39 without the answer key.

Result: it agreed with the answer key on 38 of 39 and flagged 3 questions, all fixed:

| Question | Problem | Fix |
|---|---|---|
| `bb-beaver-color-path` | Real bug: the picture did not say where Barnaby starts, and reading Path A from the log toward the house also matched the rule, so a child could be marked wrong for a correct answer | Prompt now says he starts at the house; Path A changed to red, blue, blue, red so only Path C works in either direction |
| `kl12-folded-rope-cut` | The knot and scissors emoji could not show a folded rope or where the cut is; "across the middle" could be read as cutting at the fold (2 pieces) | Replaced with a drawing of the folded rope, both ends and a dashed "cut here" line; prompt says to cut along the dashed line |
| `kl12-symmetric-butterfly` | The colored dots stand for wing colors, but the prompt never said so | Prompt now says the dots beside each butterfly show its wing spots |

Re-check: the three fixed questions were solved again by a separate agent without the answer key. All 3 agreed with the key at high confidence, with no issues. All 39 hand-typed questions now meet the review rule and stay reviewed.

## 2026-09-13: Find the Bug batch (21 questions, Phase 4)

File: `generated-debugging.json`, written by `scripts/generate/debugging.ts`. Each question shows a named child's worked steps with one injected mistake; the generator computes the correct values and asserts that the wrong step differs from its fix and that steps are unique.

Independent blind solve: an agent found the first wrong step without the key and agreed on 21 of 21, all at high confidence. It flagged two items:
- `dbg-elapsed-past-sixty`: a warning that step 2 (45 + 30 = 75) is correct and step 3 is the mistake. The key already says step 3; no change needed.
- `dbg-calendar-week-later`: step 3 said "the next game" while the question asked only for a date. The question now asks for "the date of the next soccer game, which is one week after the game on October 17". The steps and the answer did not change.

Also changed after the solve, without affecting any answer: explanations now start "Step N should say" instead of repeating "Step N is the first mistake", which the answer screen already says; and for clock times past the half hour, step 1 says the short hand "is past 9 but has not reached 10" instead of "just past 9".

## 2026-09-13: Content batch 2 (39 questions)

File: `generated-batch2.json`, written by `scripts/generate/batch2.ts`. Answers are computed in code; the 5-car race and the 4 by 4 grid are checked by solvers for exactly one solution, and arrangement and handshake counts are enumerated.

Caught before the blind solve: the first 5-car race had no valid order ("Red finished before Blue" is impossible once White is 3rd, Yellow 5th and Blue right behind Green). The clue became "Red finished after Blue".

Independent blind solve: agreed on 39 of 39, all high confidence. Flagged and fixed:
- `b2m-chess-boards-pieces`: a chess set has 16 pawns, so "8 pawns of one color" could lead to 80. Now "8 white pawns" and the unit is "white pawns".
- `b2a-same-area-different-shape` (noted, not flagged): "3 squares long and 4 squares wide" had the long side shorter. Choices now read "4 squares by 3 squares" style.
- `b2l-square-numbers-pattern` (noted): the text-only dot picture was hard to read. Replaced with a drawing of the 1, 2 by 2, 3 by 3 and 4 by 4 dot squares.

Also changed after screenshots, without affecting answers: the area questions now draw touching squares instead of emoji in separate cells.

## 2026-09-13: Reading and languages (42 questions)

File: `generated-languages.json`, written by `scripts/generate/languages.ts`. Word lists avoid regional variants (for example car, which is "coche" or "carro"); phrase choices never pair meanings that overlap (bonjour is never offered next to "good morning"). Passages are original.

Independent blind solve: agreed on 42 of 42, all high confidence, with translations, articles, spelling and passage support checked. Flagged: prompts said "Listen to the Spanish words" when a single word plays (hola, adiós, gracias, bonjour, merci). Prompts now say "Listen to the Spanish. What does it mean?" and the button says "Hear it". Spoken-answer prompts no longer promise a microphone on devices that do not show one.
