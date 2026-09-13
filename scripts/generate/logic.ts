import type { Question, Visual } from "../../src/content/schema";
import { assert, choices, numeric, question, type Draft } from "./helpers";

const FILE = "logic.ts";

export function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

function patterns(): Draft[] {
  const repeat = (unit: string[], length: number) => Array.from({ length }, (_, i) => unit[i % unit.length]);
  const abb = repeat(["🚗", "🚙", "🚙"], 8);
  const abc = repeat(["⚽", "🏀", "🎾"], 7);
  const tenth = repeat(["🔺", "🟦", "🟦"], 10)[9];
  const growing = [1, 3, 6, 10];
  const nextGrowing = growing[3] + (growing[3] - growing[2] + 1);
  return [
    {
      id: "lpa-car-abb",
      skills: ["LOGIC-PATTERN"],
      prompt: "The cars follow a pattern. Which car comes next?",
      visual: { kind: "emoji", lines: [[...abb.slice(0, 7), "❓"].join(" ")] },
      answer: choices("lpa-car-abb", abb[7], ["🚗", "🚕", "🚌"]),
      explanation: "The pattern is one red car, then two blue cars, over and over. After the red car in spot 7 come two blue cars, so the next car is blue.",
      band: 2,
    },
    {
      id: "lpa-balls-abc-middle",
      skills: ["LOGIC-PATTERN"],
      prompt: "Which ball is missing from the pattern?",
      visual: { kind: "emoji", lines: [abc.map((b, i) => (i === 5 ? "❓" : b)).join(" ")] },
      answer: choices("lpa-balls-abc-middle", abc[5], ["⚽", "🏀", "🏈"]),
      explanation: "The pattern repeats soccer ball, basketball, tennis ball. The missing spot comes right after a basketball, so it is a tennis ball.",
      band: 2,
    },
    {
      id: "lpa-growing-numbers",
      skills: ["LOGIC-PATTERN", "MATH-OA-ADD-SUB"],
      prompt: `What number comes next? ${growing.join(", ")}, ?`,
      answer: numeric(nextGrowing),
      explanation: "Look at how much it grows each time: +2, +3, +4. Next it grows by 5. 10 + 5 = 15.",
      band: 4,
    },
    {
      id: "lpa-doubling",
      skills: ["LOGIC-PATTERN", "MATH-OA-ADD-SUB"],
      prompt: "What number comes next? 2, 4, 8, 16, ?",
      answer: numeric(32),
      explanation: "Each number is double the one before: 2 + 2 = 4, 4 + 4 = 8, 8 + 8 = 16. So next is 16 + 16 = 32.",
      band: 4,
    },
    {
      id: "lpa-tenth-shape",
      skills: ["LOGIC-PATTERN", "MATH-NBT-SKIP-COUNT"],
      prompt: "This pattern keeps going: triangle, square, square, triangle, square, square. What is the 10th shape?",
      visual: { kind: "emoji", lines: ["🔺 🟦 🟦 🔺 🟦 🟦 ..."] },
      answer: choices("lpa-tenth-shape", tenth === "🔺" ? "A triangle 🔺" : "A square 🟦", ["A triangle 🔺", "A square 🟦"]),
      explanation: "The pattern repeats every 3 shapes, and each group starts with a triangle. Triangles are in spots 1, 4, 7 and 10. So the 10th shape is a triangle.",
      band: 4,
    },
  ];
}

type Clue = (order: string[]) => boolean;
const before = (a: string, b: string): Clue => (o) => o.indexOf(a) < o.indexOf(b);
const at = (a: string, index: number): Clue => (o) => o.indexOf(a) === index;
const notAt = (a: string, index: number): Clue => (o) => o.indexOf(a) !== index;
const rightAfter = (a: string, b: string): Clue => (o) => o.indexOf(a) === o.indexOf(b) + 1;

function solveOrder(id: string, names: string[], clues: Clue[]): string[] {
  const solutions = permutations(names).filter((o) => clues.every((c) => c(o)));
  assert(solutions.length === 1, `${id}: clues must give exactly one order, found ${solutions.length}`);
  return solutions[0];
}

function ordering(): Draft[] {
  const race = solveOrder("lor-race-last", ["Red", "Blue", "Green", "Yellow"], [before("Red", "Blue"), before("Blue", "Green"), at("Yellow", 0)]);
  const tall = solveOrder("lor-second-tallest", ["Mia", "Leo", "Ava", "Sam"], [before("Mia", "Leo"), before("Leo", "Ava"), before("Ava", "Sam")]);
  const shelves = solveOrder("lor-book-shelves", ["chess book", "car book", "soccer book"], [before("chess book", "car book"), at("soccer book", 2)]);
  const line = solveOrder("lor-lunch-line", ["Ann", "Tom", "Kim", "Joe"], [at("Ann", 0), notAt("Tom", 1), rightAfter("Kim", "Tom")]);
  const place = ["first", "second", "third", "fourth"];
  return [
    {
      id: "lor-race-last",
      skills: ["LOGIC-ORDER"],
      prompt: "Four toy cars had a race. Yellow finished first. Red finished before Blue. Green finished after Blue. Which car finished last?",
      answer: choices("lor-race-last", race[3], race.slice(0, 3)),
      explanation: `Yellow is first. Red is before Blue, and Blue is before Green, so the rest go Red, Blue, Green. The order is ${race.join(", ")}. ${race[3]} is last.`,
      band: 3,
    },
    {
      id: "lor-second-tallest",
      skills: ["LOGIC-ORDER"],
      prompt: "Mia is taller than Leo. Leo is taller than Ava. Sam is shorter than Ava. Who is the second tallest?",
      answer: choices("lor-second-tallest", tall[1], [tall[0], tall[2], tall[3]]),
      explanation: `Line them up from tallest to shortest: ${tall.join(", ")}. The second one is ${tall[1]}.`,
      band: 3,
    },
    {
      id: "lor-book-shelves",
      skills: ["LOGIC-ORDER"],
      prompt: "Three books sit on three shelves, one book on each. The soccer book is on the bottom shelf. The chess book is higher than the car book. Which book is on the middle shelf?",
      answer: choices("lor-book-shelves", `The ${shelves[1]}`, shelves.map((b) => `The ${b}`)),
      explanation: `The soccer book takes the bottom. The chess book must be above the car book, so the chess book is on top and the ${shelves[1]} is in the middle.`,
      band: 2,
    },
    {
      id: "lor-lunch-line",
      skills: ["LOGIC-ORDER"],
      prompt: "Ann, Tom, Kim and Joe stand in a line. Ann is first. Tom is not second. Kim stands right behind Tom. Where in line is Joe?",
      answer: choices("lor-lunch-line", place[line.indexOf("Joe")], place),
      explanation: `Ann is first. Tom cannot be second, and Kim must be right behind Tom, so Tom is third and Kim is fourth. That leaves Joe in the ${place[line.indexOf("Joe")]} spot. The line is ${line.join(", ")}.`,
      band: 4,
    },
  ];
}

export function latinSolutions(grid: (string | null)[][], symbols: string[]): string[][][] {
  const n = grid.length;
  const g = grid.map((r) => [...r]);
  const found: string[][][] = [];
  const fits = (r: number, c: number, s: string) => g[r].every((x, j) => j === c || x !== s) && g.every((row, i) => i === r || row[c] !== s);
  const fill = (k: number): void => {
    if (found.length > 1) return;
    if (k === n * n) {
      found.push(g.map((r) => r.map((x) => x!)));
      return;
    }
    const r = Math.floor(k / n);
    const c = k % n;
    if (g[r][c] !== null) return fill(k + 1);
    for (const s of symbols) {
      if (fits(r, c, s)) {
        g[r][c] = s;
        fill(k + 1);
        g[r][c] = null;
      }
    }
  };
  fill(0);
  return found;
}

function gridPuzzles(): Draft[] {
  const drafts: Draft[] = [];
  const latin: [string, (string | null)[][], string[], [number, number], string, 2 | 4 | 5, string[]][] = [
    [
      "lgr-balls-3x3",
      [["⚽", null, "🎾"], [null, "🎾", "⚽"], ["🎾", "⚽", null]],
      ["⚽", "🏀", "🎾"],
      [1, 0],
      "Every row and every column needs one soccer ball, one basketball and one tennis ball. What goes in the box with the question mark?",
      2,
      ["Soccer ball ⚽", "Basketball 🏀", "Tennis ball 🎾"],
    ],
    [
      "lgr-numbers-4x4",
      [["1", null, "3", "4"], [null, "3", null, "1"], ["3", null, "1", null], ["2", "1", null, "3"]],
      ["1", "2", "3", "4"],
      [0, 1],
      "Every row and every column needs the numbers 1, 2, 3 and 4 once each. What number goes in the box with the question mark?",
      4,
      ["1", "2", "3", "4"],
    ],
    [
      "lgr-cars-4x4",
      [["🚗", null, null, "🚜"], [null, "🚜", "🚗", null], [null, null, "🚕", null], [null, "🚗", null, "🚙"]],
      ["🚗", "🚕", "🚙", "🚜"],
      [2, 0],
      "Every row and every column needs one of each vehicle: red car, taxi, blue car and tractor. What goes in the box with the question mark?",
      5,
      ["Red car 🚗", "Taxi 🚕", "Blue car 🚙", "Tractor 🚜"],
    ],
  ];
  for (const [id, puzzle, symbols, [qr, qc], prompt, band, labels] of latin) {
    const solutions = latinSolutions(puzzle, symbols);
    assert(solutions.length === 1, `${id}: puzzle must have exactly one solution, found ${solutions.length}`);
    const answerSymbol = solutions[0][qr][qc];
    const label = (s: string) => labels[symbols.indexOf(s)];
    const rows = puzzle.map((r, i) => r.map((x, j) => (i === qr && j === qc ? "?" : (x ?? " "))));
    // The easy case: the givens in that row and column already rule out every symbol but one.
    const seen = [...new Set([...puzzle[qr], ...puzzle.map((r) => r[qc])].filter((x): x is string => x !== null))];
    const direct = symbols.length - seen.length === 1;
    drafts.push({
      id,
      skills: ["LOGIC-GRID"],
      prompt,
      visual: { kind: "grid", rows, highlight: { row: qr, col: qc } },
      answer: choices(id, label(answerSymbol), symbols.map(label)),
      explanation: direct
        ? `Look at the row and the column that cross at the question mark. Together they already have ${seen.join(" ")}. The only one missing is ${answerSymbol}.`
        : `This one takes a few steps. Fill in the boxes that have only one possible answer first, then use those to fill more. The finished row is ${solutions[0][qr].join(" ")}, so the question mark is ${answerSymbol}.`,
      band,
    });
  }

  const files = ["A", "B", "C", "D"];
  const board = (piece: string, file: number, rank: number) => [
    ["", ...files],
    ...[4, 3, 2, 1].map((r) => [String(r), ...files.map((_, f) => (f === file && r === rank ? piece : "·"))]),
  ];
  drafts.push(
    {
      id: "lgr-chess-knight-square",
      skills: ["LOGIC-GRID"],
      prompt: "On a chess board, each square has a name: the letter on top, then the number on the side. What square is the knight on?",
      visual: { kind: "grid", rows: board("♞", 2, 3).map((r) => r.map((x) => x || " ")) },
      answer: choices("lgr-chess-knight-square", "C3", ["B3", "C2", "3C"]),
      explanation: "Go up from the knight to the letters: C. Go across from the knight to the numbers: 3. Letter first, then number: C3.",
      band: 2,
    },
    {
      id: "lgr-chess-rook-moves",
      skills: ["LOGIC-GRID", "LOGIC-VISUALIZE"],
      prompt: "The rook is on A1. It moves 2 squares up and then 3 squares to the right. What square is it on now?",
      visual: { kind: "grid", rows: board("♜", 0, 1).map((r) => r.map((x) => x || " ")) },
      answer: choices("lgr-chess-rook-moves", `${files[0 + 3]}${1 + 2}`, ["C3", "D2", "B4"]),
      explanation: "Start at A1. Two squares up goes to A2, then A3. Three squares right goes to B3, C3, D3. It lands on D3.",
      band: 3,
    },
  );
  return drafts;
}

function visualize(): Draft[] {
  const gearDirection = (n: number) => (n % 2 === 1 ? "Clockwise, the same way" : "Counterclockwise, the other way");
  return [
    {
      id: "lvz-die-bottom",
      skills: ["LOGIC-VISUALIZE", "MATH-OA-UNKNOWN"],
      prompt: "On a normal die, the numbers on opposite sides always add up to 7. The top of the die shows 2. What number is on the bottom?",
      visual: { kind: "emoji", lines: ["🎲"] },
      answer: numeric(7 - 2),
      explanation: "Top and bottom are opposite sides, so they add up to 7. 2 + ? = 7, and 7 - 2 = 5.",
      band: 3,
    },
    {
      id: "lvz-pizza-two-cuts",
      skills: ["LOGIC-VISUALIZE"],
      prompt: "You cut a round pizza with 2 straight cuts. Both cuts go through the very middle, and they cross. How many pieces do you get?",
      visual: { kind: "emoji", lines: ["🍕"] },
      answer: choices("lvz-pizza-two-cuts", 4, [2, 3, 6]),
      explanation: "The first cut makes 2 halves. The second cut crosses it in the middle and cuts both halves in two. 2 + 2 = 4 pieces.",
      band: 2,
    },
    {
      id: "lvz-two-gears",
      skills: ["LOGIC-VISUALIZE"],
      prompt: "Two gears touch. The first gear turns clockwise. Which way does the second gear turn?",
      visual: { kind: "emoji", lines: ["⚙️⚙️"] },
      answer: choices("lvz-two-gears", gearDirection(2), [gearDirection(1), "It does not turn"]),
      explanation: "Where two gears touch, their teeth push each other in opposite directions. So the second gear turns counterclockwise.",
      band: 3,
    },
    {
      id: "lvz-three-gears",
      skills: ["LOGIC-VISUALIZE", "MATH-NBT-ODD-EVEN"],
      prompt: "Three gears are in a row, and each one touches the next. The first gear turns clockwise. Which way does the third gear turn?",
      visual: { kind: "emoji", lines: ["⚙️⚙️⚙️"] },
      answer: choices("lvz-three-gears", gearDirection(3), [gearDirection(2), "It does not turn"]),
      explanation: "Each gear turns the opposite way from the one it touches. First: clockwise. Second: counterclockwise. Third: clockwise again.",
      band: 4,
    },
  ];
}

type Dir = "⬆️" | "➡️" | "⬇️" | "⬅️";
const MOVE: Record<Dir, [number, number]> = { "⬆️": [-1, 0], "➡️": [0, 1], "⬇️": [1, 0], "⬅️": [0, -1] };

function runRobot(map: string[][], start: [number, number], moves: Dir[]) {
  let [r, c] = start;
  for (const m of moves) {
    r += MOVE[m][0];
    c += MOVE[m][1];
    if (r < 0 || c < 0 || r >= map.length || c >= map[0].length || map[r][c] === "🪨") return null;
  }
  return map[r][c];
}

function robots(): Draft[] {
  const map = [
    ["🍎", "·", "🍌", "·"],
    ["·", "🤖", "·", "🍒"],
    ["🍇", "·", "·", "⭐"],
  ];
  const start: [number, number] = [1, 1];
  const q1: Dir[] = ["➡️", "⬆️"];
  const q2: Dir[] = ["➡️", "➡️", "⬇️"];
  const q3: Dir[] = ["⬇️", "⬅️"];
  const fruit = (moves: Dir[]) => runRobot(map, start, moves)!;
  const names: Record<string, string> = { "🍎": "Apple 🍎", "🍌": "Banana 🍌", "🍒": "Cherry 🍒", "🍇": "Grapes 🍇", "⭐": "Star ⭐" };
  const rockMap = [
    ["🤖", "·", "🪨"],
    ["🪨", "·", "·"],
    ["·", "·", "⭐"],
  ];
  const routeOptions: Dir[][] = [
    ["➡️", "⬇️", "➡️", "⬇️"],
    ["⬇️", "⬇️", "➡️", "➡️"],
    ["➡️", "➡️", "⬇️", "⬇️"],
    ["➡️", "⬇️", "⬇️", "⬅️"],
  ];
  const reachers = routeOptions.filter((r) => runRobot(rockMap, [0, 0], r) === "⭐");
  assert(reachers.length === 1, "exactly one route reaches the star safely");
  for (const moves of [q1, q2, q3]) assert(fruit(moves) !== "·", "robot lands on something");
  const draft = (id: string, moves: Dir[], band: 1 | 2 | 3): Draft => ({
    id,
    skills: ["CS-SEQUENCE"],
    prompt: `The robot follows these arrows, one square for each arrow: ${moves.join(" ")}. What does it land on?`,
    speech: `The robot follows the arrows, one square for each arrow. What does it land on?`,
    visual: { kind: "grid", rows: map },
    answer: choices(id, names[fruit(moves)], Object.values(names)),
    explanation: `Start at the robot and move one square for each arrow: ${moves.map((m) => ({ "⬆️": "up", "➡️": "right", "⬇️": "down", "⬅️": "left" })[m]).join(", then ")}. The robot lands on the ${names[fruit(moves)].split(" ")[0].toLowerCase()}.`,
    band,
  });
  return [
    draft("lcs-robot-right-up", q1, 1),
    draft("lcs-robot-three-steps", q2, 2),
    draft("lcs-robot-down-left", q3, 2),
    {
      id: "lcs-robot-avoid-rocks",
      skills: ["CS-SEQUENCE", "CS-RULE-PATH"],
      prompt: "The robot must reach the star without bumping into a rock. Which list of arrows works?",
      speech: "The robot must reach the star without bumping into a rock. Which list of arrows works?",
      visual: { kind: "grid", rows: rockMap },
      answer: choices("lcs-robot-avoid-rocks", reachers[0].join(" "), routeOptions.filter((r) => r !== reachers[0]).map((r) => r.join(" "))),
      explanation: `Try each list with your finger. ${reachers[0].join(" ")} goes right, down, right, down and never touches a rock. Going down first hits a rock, going right twice hits a rock, and the last list ends in the wrong corner.`,
      band: 3,
    },
  ];
}

function codes(): Draft[] {
  const key: Record<string, string> = { "🔴": "G", "🔵": "O", "🟢": "A", "🟡": "L" };
  const goalCode = ["🔴", "🔵", "🟢", "🟡"];
  const shift = (word: string, by: number) => word.replace(/[A-Z]/g, (ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + by + 26) % 26) + 65));
  const secret = shift("CAR", 1);
  const letters = ["A", "B", "C", "D", "E"];
  const encode = (word: string) => word.split("").map((ch) => letters.indexOf(ch) + 1).join(" ");
  return [
    {
      id: "lcd-color-code-goal",
      skills: ["CS-ENCODING"],
      prompt: "Each color stands for a letter: red = G, blue = O, green = A, yellow = L. What word do these colors spell?",
      visual: { kind: "emoji", lines: [goalCode.join(" ")] },
      answer: choices("lcd-color-code-goal", goalCode.map((c) => key[c]).join(""), ["GAOL", "LOGA", "GOLA"]),
      explanation: "Change each color into its letter, in order: red is G, blue is O, green is A, yellow is L. The word is GOAL.",
      band: 2,
    },
    {
      id: "lcd-shift-code-car",
      skills: ["CS-ENCODING"],
      prompt: `In this secret code, every letter is changed to the next letter of the alphabet: A becomes B, B becomes C, and so on. The secret word is ${secret}. What was the real word?`,
      answer: choices("lcd-shift-code-car", shift(secret, -1), [shift(secret, 1), "BAR", "CAT"]),
      explanation: `To decode, go back one letter: ${secret
        .split("")
        .map((ch) => `${ch} becomes ${shift(ch, -1)}`)
        .join(", ")}. The real word is ${shift(secret, -1)}.`,
      band: 4,
    },
    {
      id: "lcd-number-code-encode",
      skills: ["CS-ENCODING"],
      prompt: "A = 1, B = 2, C = 3, D = 4, E = 5. How do you write the word DEED in this number code?",
      visual: { kind: "grid", rows: [letters, letters.map((_, i) => String(i + 1))] },
      answer: choices("lcd-number-code-encode", encode("DEED"), [encode("DEAD"), "4 5 4 5", "5 4 4 5"]),
      explanation: "Change each letter to its number, in order: D is 4, E is 5, E is 5, D is 4. So DEED is 4 5 5 4.",
      band: 2,
    },
  ];
}

function reversing(): Draft[] {
  const tunnel = ["🚗", "🚕", "🚙"];
  const backOut = [...tunnel].reverse();
  const walk: Dir[] = ["⬆️", "⬆️", "➡️"];
  const opposite: Record<Dir, Dir> = { "⬆️": "⬇️", "➡️": "⬅️", "⬇️": "⬆️", "⬅️": "➡️" };
  const undo = [...walk].reverse().map((d) => opposite[d]);
  const words = ["LEVEL", "LEMON", "LADDER", "LOVE"];
  const palindromes = words.filter((w) => w === [...w].reverse().join(""));
  assert(palindromes.length === 1, "one palindrome");
  return [
    {
      id: "lrv-tunnel-back-out",
      skills: ["CS-REVERSE", "LOGIC-VISUALIZE"],
      prompt: "Three cars drive into a narrow dead-end tunnel, one behind the other: first the red car, then the taxi, then the blue car. They have to back out. Which car comes out first?",
      visual: { kind: "emoji", lines: [`dead end 🧱 ${tunnel.join(" ")} ⬅️ way in`] },
      answer: choices("lrv-tunnel-back-out", "The blue car 🚙", ["The red car 🚗", "The taxi 🚕"]),
      explanation: `The red car went in first, so it is deepest in the tunnel. The blue car went in last, so it is closest to the opening. Backing out, they leave in reverse order: ${backOut.join(" ")}. The blue car comes out first.`,
      band: 3,
    },
    {
      id: "lrv-undo-the-walk",
      skills: ["CS-REVERSE", "CS-SEQUENCE"],
      prompt: `A robot walked ${walk.join(" ")}. Which arrows bring it back to where it started?`,
      speech: "A robot walked up, up, right. Which arrows bring it back to where it started?",
      // Only distractors that do not return home: on an open grid, the undo steps in any order would also work.
      answer: choices("lrv-undo-the-walk", undo.join(" "), [[...walk].reverse().join(" "), walk.join(" "), "⬅️ ⬆️ ⬆️"]),
      explanation: `Undo the last step first, and turn each arrow around. The last step was right, so first go left. Then undo the two ups by going down twice: ${undo.join(" ")}.`,
      band: 3,
    },
    {
      id: "lrv-same-backwards",
      skills: ["CS-REVERSE"],
      prompt: "Which word is spelled the same forwards and backwards?",
      answer: choices("lrv-same-backwards", palindromes[0], words.filter((w) => w !== palindromes[0])),
      explanation: `Read each word from the last letter to the first. LEVEL backwards is L, E, V, E, L: the same word! LEMON backwards is NOMEL, so it changes.`,
      band: 2,
    },
  ];
}

function rulePaths(): Draft[] {
  const rule = ["⚽", "🏀"];
  const paths: [string, string[]][] = [
    ["A", ["⚽", "🏀", "🏀", "⚽", "🏀"]],
    ["B", ["⚽", "🏀", "⚽", "🏀", "⚽"]],
    ["C", ["🏀", "⚽", "🏀", "⚽", "🏀"]],
    ["D", ["⚽", "⚽", "🏀", "⚽", "🏀"]],
  ];
  const follows = (p: string[]) => p.every((x, i) => x === rule[i % 2]);
  const good = paths.filter(([, p]) => follows(p));
  assert(good.length === 1, "one ball path follows the rule");

  const numberPaths: [string, number[]][] = [
    ["A", [2, 4, 7, 8]],
    ["B", [3, 4, 6, 8]],
    ["C", [2, 6, 8, 10]],
    ["D", [2, 4, 6, 9]],
  ];
  const evenOnly = numberPaths.filter(([, p]) => p.every((n) => n % 2 === 0));
  assert(evenOnly.length === 1, "one number path is all even");
  return [
    {
      id: "lrp-ball-path",
      skills: ["CS-RULE-PATH", "LOGIC-PATTERN"],
      prompt: "A soccer player may only step on balls in this order: soccer ball, basketball, soccer ball, basketball, and so on. Which path can she take?",
      visual: { kind: "emoji", lines: paths.map(([name, p]) => `${name}: ${p.join(" ")}`) },
      answer: choices("lrp-ball-path", `Path ${good[0][0]}`, paths.map(([name]) => `Path ${name}`)),
      explanation: `Check each step against the rule. Path ${good[0][0]} goes soccer, basket, soccer, basket, soccer, which matches every step. The other paths have two of the same ball in a row or start with the wrong ball.`,
      band: 2,
    },
    {
      id: "lrp-even-stones",
      skills: ["CS-RULE-PATH", "MATH-NBT-ODD-EVEN"],
      prompt: "A frog may only hop on stones with even numbers. Which path is safe?",
      visual: { kind: "emoji", lines: numberPaths.map(([name, p]) => `${name}: ${p.join("  ")}`) },
      answer: choices("lrp-even-stones", `Path ${evenOnly[0][0]}`, numberPaths.map(([name]) => `Path ${name}`)),
      explanation: `Path ${evenOnly[0][0]} is ${evenOnly[0][1].join(", ")}, and every one of those is even. Path A has 7, Path B has 3, and Path D has 9, which are odd.`,
      band: 3,
    },
  ];
}

function conditionals(): Draft[] {
  const lights = ["🟢", "🔴", "🟢", "🟢"];
  const steps = lights.reduce((t, l) => t + (l === "🟢" ? 2 : 0), 0);
  const beeps = [4, 7, 10].map((n) => (n % 2 === 0 ? "BEEP" : "BOOP"));
  const machine = (n: number) => (n > 5 ? n + 1 : n * 2);
  const afterTwo = machine(machine(3));
  const fruits = ["🍎", "🍌", "🍓", "🍒", "🍋", "🍎"];
  const red = new Set(["🍎", "🍓", "🍒"]);
  const leftBin = fruits.filter((f) => red.has(f)).length;
  return [
    {
      id: "lif-rain-or-shine",
      skills: ["CS-CONDITIONAL"],
      prompt: "The rule is: if it is raining, play chess inside. Otherwise, play soccer outside. Today it is sunny. What do they play?",
      visual: { kind: "emoji", lines: ["☀️"] },
      answer: choices("lif-rain-or-shine", "Soccer outside ⚽", ["Chess inside ♟️", "Both", "Nothing"]),
      explanation: "The rule only says chess if it is raining. It is sunny, so the otherwise part happens: soccer outside.",
      band: 1,
    },
    {
      id: "lif-traffic-light-steps",
      skills: ["CS-CONDITIONAL", "CS-SEQUENCE"],
      prompt: "A toy car reads one light at a time. If the light is green, it moves 2 steps. If the light is red, it waits. How many steps does it move in all?",
      visual: { kind: "emoji", lines: [lights.join(" ")] },
      answer: numeric(steps, "steps"),
      explanation: `Go one light at a time: ${lights.map((l) => (l === "🟢" ? "green, 2 steps" : "red, wait")).join("; ")}. There are ${lights.filter((l) => l === "🟢").length} green lights: ${lights.filter((l) => l === "🟢").map(() => "2").join(" + ")} = ${steps} steps.`,
      band: 2,
    },
    {
      id: "lif-beep-boop",
      skills: ["CS-CONDITIONAL", "MATH-NBT-ODD-EVEN"],
      prompt: "A robot looks at numbers. If the number is even, it says BEEP. If the number is odd, it says BOOP. What does it say for 4, 7, 10?",
      answer: choices("lif-beep-boop", beeps.join(" "), ["BOOP BEEP BOOP", "BEEP BEEP BEEP", "BEEP BEEP BOOP"]),
      explanation: `4 is even: BEEP. 7 is odd: BOOP. 10 is even: BEEP. So it says ${beeps.join(" ")}.`,
      band: 2,
    },
    {
      id: "lif-number-machine-twice",
      skills: ["CS-CONDITIONAL", "MATH-OA-ADD-SUB"],
      prompt: "A number machine has a rule: if the number is bigger than 5, add 1. Otherwise, double it. Put in 3, then put the answer back in. What comes out the second time?",
      answer: numeric(afterTwo),
      explanation: `First time: 3 is not bigger than 5, so double it: ${machine(3)}. Second time: ${machine(3)} is bigger than 5, so add 1: ${afterTwo}.`,
      band: 4,
    },
    {
      id: "lif-fruit-sorter",
      skills: ["CS-CONDITIONAL", "CS-SORTING"],
      prompt: "A sorting machine sends red fruit to the left bin and all other fruit to the right bin. How many fruits go to the left bin?",
      visual: { kind: "emoji", lines: [fruits.join(" ")] },
      answer: numeric(leftBin, "fruits"),
      explanation: `The red fruits are the apples, the strawberry and the cherries: ${fruits.filter((f) => red.has(f)).join(" ")}. That is ${leftBin}. The banana and lemon go right.`,
      band: 2,
    },
  ];
}

function sorting(): Draft[] {
  const racers: [string, number][] = [["Zoom", 42], ["Blaze", 38], ["Turbo", 45], ["Dash", 40]];
  const fastest = [...racers].sort((a, b) => a[1] - b[1]);
  const lengths: [string, number][] = [["bus", 12], ["car", 5], ["truck", 9], ["scooter", 2], ["van", 7]];
  const byLength = [...lengths].sort((a, b) => a[1] - b[1]);
  const middle = byLength[2][0];
  const cards = [3, 1, 4, 2];
  const pass = [...cards];
  for (let i = 0; i < pass.length - 1; i++) if (pass[i] > pass[i + 1]) [pass[i], pass[i + 1]] = [pass[i + 1], pass[i]];
  const sortedOrder = [...[27, 72, 7, 70]].sort((a, b) => a - b);
  return [
    {
      id: "lso-third-fastest",
      skills: ["CS-SORTING", "LOGIC-ORDER"],
      prompt: `Race times in seconds: ${racers.map(([n, t]) => `${n} ${t}`).join(", ")}. The smallest time is the fastest. Who came in third?`,
      answer: choices("lso-third-fastest", fastest[2][0], racers.map(([n]) => n)),
      explanation: `Sort from smallest time to biggest: ${fastest.map(([n, t]) => `${n} (${t})`).join(", ")}. Third in that list is ${fastest[2][0]}.`,
      band: 3,
    },
    {
      id: "lso-smallest-to-largest",
      skills: ["CS-SORTING", "MATH-NBT-PLACE-VALUE"],
      prompt: "Which list puts 27, 72, 7 and 70 in order from smallest to largest?",
      answer: choices("lso-smallest-to-largest", sortedOrder.join(", "), ["7, 70, 27, 72", "72, 70, 27, 7", "7, 27, 72, 70"]),
      explanation: "7 has only ones, so it is smallest. 27 has 2 tens. 70 and 72 both have 7 tens, and 70 has fewer ones. So: 7, 27, 70, 72.",
      band: 3,
    },
    {
      id: "lso-middle-length",
      skills: ["CS-SORTING"],
      prompt: `Line these up from shortest to longest: ${lengths.map(([n, l]) => `${n} ${l} feet`).join(", ")}. Which one is in the middle?`,
      answer: choices("lso-middle-length", `The ${middle}`, lengths.map(([n]) => `The ${n}`)),
      explanation: `Shortest to longest: ${byLength.map(([n, l]) => `${n} (${l})`).join(", ")}. There are 5, so the middle one is the 3rd: the ${middle}.`,
      band: 3,
    },
    {
      id: "lso-swap-neighbors-pass",
      skills: ["CS-SORTING", "CS-SEQUENCE"],
      prompt: `A sorting robot walks along the cards ${cards.join(", ")} from left to right. At each pair of neighbors, if the left card is bigger, it swaps them. What order are the cards in after one walk?`,
      answer: choices("lso-swap-neighbors-pass", pass.join(", "), ["1, 2, 3, 4", "1, 3, 4, 2", "3, 1, 2, 4"]),
      explanation: "Start: 3, 1, 4, 2. Compare 3 and 1: swap, giving 1, 3, 4, 2. Compare 3 and 4: no swap. Compare 4 and 2: swap, giving 1, 3, 2, 4. One walk is not enough to finish sorting!",
      band: 4,
    },
  ];
}

type Network = Extract<Visual, { kind: "network" }>;

function shortest(net: Network, from: string, to: string) {
  const dist = new Map(net.nodes.map((n) => [n.id, Infinity]));
  const prev = new Map<string, string>();
  dist.set(from, 0);
  const todo = new Set(net.nodes.map((n) => n.id));
  while (todo.size) {
    const u = [...todo].reduce((a, b) => (dist.get(a)! <= dist.get(b)! ? a : b));
    todo.delete(u);
    for (const e of net.edges) {
      const v = e.from === u ? e.to : e.to === u ? e.from : null;
      if (v && todo.has(v) && dist.get(u)! + e.weight < dist.get(v)!) {
        dist.set(v, dist.get(u)! + e.weight);
        prev.set(v, u);
      }
    }
  }
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return { distance: dist.get(to)!, path };
}

function allSimplePaths(net: Network, from: string, to: string): string[][] {
  const out: string[][] = [];
  const walk = (path: string[]) => {
    const here = path.at(-1)!;
    if (here === to) return void out.push(path);
    for (const e of net.edges) {
      const next = e.from === here ? e.to : e.to === here ? e.from : null;
      if (next && !path.includes(next)) walk([...path, next]);
    }
  };
  walk([from]);
  return out;
}

function pathLength(net: Network, path: string[]) {
  return path.slice(1).reduce((t, id, i) => t + net.edges.find((e) => (e.from === path[i] && e.to === id) || (e.to === path[i] && e.from === id))!.weight, 0);
}

function shortestPaths(): Draft[] {
  const small: Network = {
    kind: "network",
    nodes: [{ id: "H", label: "🏠", x: 0, y: 50 }, { id: "S", label: "🏫", x: 50, y: 0 }, { id: "P", label: "⚽", x: 100, y: 50 }, { id: "L", label: "🏪", x: 50, y: 100 }],
    edges: [{ from: "H", to: "S", weight: 3 }, { from: "S", to: "P", weight: 4 }, { from: "H", to: "L", weight: 2 }, { from: "L", to: "P", weight: 6 }],
  };
  const medium: Network = {
    kind: "network",
    nodes: [{ id: "H", label: "🏠", x: 0, y: 50 }, { id: "A", label: "A", x: 35, y: 0 }, { id: "B", label: "B", x: 35, y: 100 }, { id: "C", label: "C", x: 70, y: 50 }, { id: "R", label: "🏁", x: 100, y: 50 }],
    edges: [
      { from: "H", to: "A", weight: 4 },
      { from: "H", to: "B", weight: 2 },
      { from: "A", to: "C", weight: 1 },
      { from: "B", to: "C", weight: 5 },
      { from: "A", to: "B", weight: 1 },
      { from: "C", to: "R", weight: 2 },
    ],
  };
  const big: Network = {
    kind: "network",
    nodes: [
      { id: "H", label: "🏠", x: 0, y: 50 },
      { id: "A", label: "A", x: 30, y: 0 },
      { id: "B", label: "B", x: 30, y: 100 },
      { id: "C", label: "C", x: 65, y: 0 },
      { id: "D", label: "D", x: 65, y: 100 },
      { id: "Z", label: "🦁", x: 100, y: 50 },
    ],
    edges: [
      { from: "H", to: "A", weight: 5 },
      { from: "H", to: "B", weight: 3 },
      { from: "A", to: "C", weight: 2 },
      { from: "B", to: "D", weight: 6 },
      { from: "B", to: "A", weight: 1 },
      { from: "C", to: "Z", weight: 4 },
      { from: "D", to: "Z", weight: 2 },
      { from: "C", to: "D", weight: 3 },
    ],
  };
  const name = (net: Network, id: string) => {
    const label = net.nodes.find((n) => n.id === id)!.label;
    return ({ "🏠": "home", "🏫": "school", "⚽": "the soccer field", "🏪": "the store", "🏁": "the finish", "🦁": "the zoo" } as Record<string, string>)[label] ?? label;
  };
  const routeText = (net: Network, path: string[]) => path.map((id) => net.nodes.find((n) => n.id === id)!.label).join(" ➔ ");

  const drafts: Draft[] = [];
  const uniqueShortest = (net: Network, from: string, to: string) => {
    const best = shortest(net, from, to);
    const all = allSimplePaths(net, from, to);
    assert(all.filter((p) => pathLength(net, p) === best.distance).length === 1, "shortest route must be unique");
    return { best, all };
  };

  {
    const { best, all } = uniqueShortest(small, "H", "P");
    drafts.push({
      id: "lsp-home-to-field",
      skills: ["CS-SHORTEST-PATH", "MATH-OA-ADD-SUB"],
      prompt: "The numbers on the roads show how many minutes each road takes. What is the fastest way from home to the soccer field?",
      visual: small,
      answer: choices("lsp-home-to-field", `Past ${name(small, best.path[1])}`, all.filter((p) => p !== all.find((q) => q.join() === best.path.join())).map((p) => `Past ${name(small, p[1])}`).concat(["They take the same time"])),
      explanation: `${all.map((p) => `Past ${name(small, p[1])}: ${p.slice(1).map((id, i) => pathLength(small, [p[i], id])).join(" + ")} = ${pathLength(small, p)} minutes.`).join(" ")} Going past ${name(small, best.path[1])} is faster.`,
      band: 2,
    });
  }
  {
    const { best } = uniqueShortest(medium, "H", "R");
    drafts.push({
      id: "lsp-race-shortest-distance",
      skills: ["CS-SHORTEST-PATH", "MATH-OA-ADD-SUB"],
      prompt: "The numbers show how long each road is. What is the shortest distance from home to the finish flag?",
      visual: medium,
      answer: numeric(best.distance),
      explanation: `The shortest way is ${routeText(medium, best.path)}: ${best.path.slice(1).map((id, i) => pathLength(medium, [best.path[i], id])).join(" + ")} = ${best.distance}. It looks longer on the map, but the numbers are smaller. Going straight through A costs ${pathLength(medium, ["H", "A", "C", "R"])}.`,
      band: 4,
    });
  }
  {
    const { best, all } = uniqueShortest(big, "H", "Z");
    const others = all.filter((p) => p.join() !== best.path.join()).sort((a, b) => pathLength(big, a) - pathLength(big, b)).slice(0, 3);
    drafts.push({
      id: "lsp-zoo-best-route",
      skills: ["CS-SHORTEST-PATH", "MATH-OA-ADD-SUB"],
      prompt: "The numbers show how many minutes each road takes. Which route gets from home to the zoo fastest?",
      visual: big,
      answer: choices("lsp-zoo-best-route", routeText(big, best.path), others.map((p) => routeText(big, p))),
      explanation: `Add up each route. ${[best.path, ...others].map((p) => `${routeText(big, p)} takes ${pathLength(big, p)}.`).join(" ")} The fastest takes ${best.distance} minutes.`,
      band: 5,
    });
  }
  return drafts;
}

function logicTopUps(): Draft[] {
  const letters = ["A", "B", "C", "D", "E"];
  const decode = (nums: number[]) => nums.map((n) => letters[n - 1]).join("");
  const flags: Record<string, string> = { "🟥": "S", "🟩": "T", "🟦": "O", "🟨": "P" };
  const stopCode = ["🟥", "🟩", "🟦", "🟨"];
  const plates = ["🟢", "🔵", "🟡", "🔴"];
  assert([...plates].reverse()[2] === "🔵", "third plate off is blue");
  const fruitWords = ["ZEBRA", "APPLE", "MANGO", "BANANA"];
  const abc = [...fruitWords].sort();
  const fivesPaths: [string, number[]][] = [
    ["A", [5, 10, 15, 20, 25]],
    ["B", [5, 10, 12, 15, 20]],
    ["C", [5, 15, 20, 25, 30]],
    ["D", [10, 15, 20, 24, 30]],
  ];
  const fivesGood = fivesPaths.filter(([, p]) => p.every((n, i) => i === 0 || n - p[i - 1] === 5));
  const shapes: [string, string[], string][] = [
    ["A", ["🟦", "🟩", "🔺", "🟨"], "a triangle"],
    ["B", ["🟦", "🟨", "🟩", "🟧"], ""],
    ["C", ["🟩", "⚪", "🟦", "🟨"], "a circle"],
    ["D", ["⭐", "🟦", "🟩", "🟨"], "a star"],
  ];
  assert(fivesGood.length === 1, "one path counts by 5s");
  return [
    {
      id: "lcd-bead-code",
      skills: ["CS-ENCODING"],
      prompt: "A = 1, B = 2, C = 3, D = 4, E = 5. What word is 2 5 1 4?",
      visual: { kind: "grid", rows: [letters, letters.map((_, i) => String(i + 1))] },
      answer: choices("lcd-bead-code", decode([2, 5, 1, 4]), ["BADE", "BEAD".split("").reverse().join(""), "DEAB"]),
      explanation: "Change each number to its letter, in order: 2 is B, 5 is E, 1 is A, 4 is D. The word is BEAD.",
      band: 2,
    },
    {
      id: "lcd-flag-code-stop",
      skills: ["CS-ENCODING"],
      prompt: "Race flags send a secret word. Red = S, green = T, blue = O, yellow = P. What word do these flags spell?",
      visual: { kind: "emoji", lines: [stopCode.join(" ")] },
      answer: choices("lcd-flag-code-stop", stopCode.map((f) => flags[f]).join(""), ["POTS", "TOPS", "SPOT"]),
      explanation: "Read the flags from left to right and change each color to its letter: S, T, O, P. The word is STOP.",
      band: 2,
    },
    {
      id: "lrv-plate-stack",
      skills: ["CS-REVERSE"],
      prompt: "Plates are stacked one at a time: green first, then blue, then yellow, then red on top. You can only take the top plate. Which plate do you take third?",
      visual: { kind: "emoji", lines: [...plates].reverse() },
      answer: choices("lrv-plate-stack", "Blue 🔵", ["Green 🟢", "Yellow 🟡", "Red 🔴"]),
      explanation: "The last plate put on is the first one off. Taking plates off goes red, yellow, blue, green. The third plate taken is blue.",
      band: 3,
    },
    {
      id: "lrv-number-backwards",
      skills: ["CS-REVERSE", "MATH-NBT-PLACE-VALUE"],
      prompt: "Write the number 385 backwards, digit by digit. What number do you get?",
      answer: numeric(Number("385".split("").reverse().join(""))),
      explanation: "Read the digits from right to left: 5, 8, 3. That makes 583.",
      band: 2,
    },
    {
      id: "lrp-count-by-fives-path",
      skills: ["CS-RULE-PATH", "MATH-NBT-SKIP-COUNT"],
      prompt: "A kangaroo may only hop to a stone that is exactly 5 more than the stone it is on. Which path works all the way?",
      visual: { kind: "emoji", lines: fivesPaths.map(([name, p]) => `${name}: ${p.join("  ")}`) },
      answer: choices("lrp-count-by-fives-path", `Path ${fivesGood[0][0]}`, fivesPaths.map(([name]) => `Path ${name}`)),
      explanation: `Path ${fivesGood[0][0]} goes ${fivesGood[0][1].join(", ")}, adding 5 every hop. Path B jumps from 10 to 12, Path C jumps from 5 to 15, and Path D jumps from 20 to 24.`,
      band: 2,
    },
    {
      id: "lrp-four-sides-path",
      skills: ["CS-RULE-PATH", "MATH-GEO-SHAPES"],
      prompt: "You may only step on shapes with 4 straight sides and 4 square corners. Which path is safe?",
      visual: { kind: "emoji", lines: shapes.map(([name, p]) => `${name}: ${p.join(" ")}`) },
      answer: choices("lrp-four-sides-path", "Path B", shapes.map(([name]) => `Path ${name}`)),
      explanation: `Every shape on Path B is a square with 4 sides and 4 square corners. ${shapes
        .filter(([, , bad]) => bad)
        .map(([name, , bad]) => `Path ${name} has ${bad}.`)
        .join(" ")}`,
      band: 3,
    },
    {
      id: "lif-two-button-door",
      skills: ["CS-CONDITIONAL"],
      prompt: "A garage door opens only if you press the red button AND the green button together. Which one opens the door?",
      answer: choices("lif-two-button-door", "Press red and green", ["Press only red", "Press only green", "Press neither"]),
      explanation: "AND means both things must happen. Pressing just one button is not enough. Only pressing red and green together opens the door.",
      band: 3,
    },
    {
      id: "lso-abc-order-second",
      skills: ["CS-SORTING"],
      prompt: `Put these words in ABC order: ${fruitWords.join(", ")}. Which word comes second?`,
      answer: choices("lso-abc-order-second", abc[1], fruitWords.filter((w) => w !== abc[1])),
      explanation: `Look at the first letter of each word: A, B, M, Z. In ABC order that is ${abc.join(", ")}. The second word is ${abc[1]}.`,
      band: 3,
    },
    {
      id: "lsp-direct-road-trap",
      skills: ["CS-SHORTEST-PATH", "MATH-OA-ADD-SUB"],
      prompt: "The straight road from home to the park is 9 minutes. The road through the market is 3 minutes plus 4 minutes. What is the fastest time to the park?",
      visual: {
        kind: "network",
        nodes: [{ id: "H", label: "🏠", x: 0, y: 80 }, { id: "M", label: "🏪", x: 50, y: 0 }, { id: "P", label: "🌳", x: 100, y: 80 }],
        edges: [{ from: "H", to: "P", weight: 9 }, { from: "H", to: "M", weight: 3 }, { from: "M", to: "P", weight: 4 }],
      },
      answer: numeric(Math.min(9, 3 + 4), "minutes"),
      explanation: "The straight road looks shorter, but check the numbers. Through the market: 3 + 4 = 7 minutes. Straight: 9 minutes. 7 is less, so the fastest time is 7 minutes.",
      band: 3,
    },
    {
      id: "lsp-city-blocks",
      skills: ["CS-SHORTEST-PATH", "LOGIC-GRID"],
      prompt: "In the city you can only walk along the streets. School is 3 blocks right and 2 blocks up from home. What is the fewest number of blocks you can walk to get there?",
      visual: { kind: "grid", rows: [["·", "·", "·", "🏫"], ["·", "·", "·", "·"], ["🏠", "·", "·", "·"]] },
      answer: numeric(3 + 2, "blocks"),
      explanation: "You have to go 3 blocks right and 2 blocks up no matter which streets you pick, as long as you never walk backwards. 3 + 2 = 5 blocks.",
      band: 3,
    },
    {
      id: "lsp-minutes-saved",
      skills: ["CS-SHORTEST-PATH", "MATH-OA-ADD-SUB"],
      prompt: "Going past the school takes 3 + 4 minutes. Going past the store takes 2 + 6 minutes. How many minutes do you save by taking the faster way?",
      answer: numeric(Math.abs(3 + 4 - (2 + 6)), "minutes"),
      explanation: "Past the school: 3 + 4 = 7 minutes. Past the store: 2 + 6 = 8 minutes. 8 - 7 = 1 minute saved.",
      band: 4,
    },
  ];
}

export const logicQuestions = (): Question[] =>
  [...patterns(), ...ordering(), ...gridPuzzles(), ...visualize(), ...robots(), ...codes(), ...reversing(), ...rulePaths(), ...conditionals(), ...sorting(), ...shortestPaths(), ...logicTopUps()].map((d) =>
    question(FILE, d),
  );
