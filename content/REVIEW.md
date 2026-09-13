# Content review log

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
4. **Caught by the generators themselves:** the first 4 by 4 number puzzle had 2 solutions, and the first vehicle puzzle had none. Both were rebuilt. A later check replaced a ⭐ for the 🔷 in the "4 square corners" path, since a square turned on its corner also has square corners.
5. **Visual check:** every emoji and grid question, plus each new picture type (coins, rulers, picture graphs, calendar, route maps, tally marks, matchsticks), was screenshot at phone width. Nothing is cut off. The bus 🚌 in the vehicle puzzle looked too much like the taxi on Apple devices and was swapped for a tractor 🚜.

Review status: shipped as reviewed under the spot-check policy (parent spot-checks a sample rather than approving each item).
