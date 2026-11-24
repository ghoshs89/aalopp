import type { Question, Visual } from "../../src/content/schema";
import { assert, hash, numeric, question, type Draft } from "./helpers";
import { permutations } from "./logic";

const FILE = "cognitive.ts";
const INK = "#1d2f4b";

type ShapeKind = "circle" | "square" | "triangle" | "diamond" | "star" | "arrow";
type CellSpec = {
  shape: ShapeKind;
  color: string;
  count?: number;
  rotate?: number;
  hollow?: boolean;
  inner?: ShapeKind;
};

const PALETTE = {
  red: "#d84957",
  blue: "#2878e3",
  green: "#2cb470",
  gold: "#e8a33b",
  purple: "#8a5cd6",
} as const;

function drawShape(shape: ShapeKind, cx: number, cy: number, r: number, color: string, hollow = false, rotate = 0): string {
  const fill = hollow ? "#ffffff" : color;
  const stroke = hollow ? color : INK;
  const sw = hollow ? 4 : 2.5;
  const tf = rotate ? ` transform="rotate(${rotate} ${cx} ${cy})"` : "";
  switch (shape) {
    case "circle":
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    case "square":
      return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${tf}/>`;
    case "triangle":
      return `<polygon points="${cx},${cy - r} ${cx + r},${cy + r * 0.85} ${cx - r},${cy + r * 0.85}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${tf}/>`;
    case "diamond":
      return `<polygon points="${cx},${cy - r} ${cx + r * 0.85},${cy} ${cx},${cy + r} ${cx - r * 0.85},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${tf}/>`;
    case "star": {
      const pts = Array.from({ length: 10 }, (_, k) => {
        const a = (k * Math.PI) / 5 - Math.PI / 2;
        const rad = k % 2 === 0 ? r : r * 0.45;
        return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${tf}/>`;
    }
    case "arrow":
      return `<polygon points="${cx},${cy - r} ${cx + r * 0.85},${cy} ${cx + r * 0.35},${cy} ${cx + r * 0.35},${cy + r} ${cx - r * 0.35},${cy + r} ${cx - r * 0.35},${cy} ${cx - r * 0.85},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${tf}/>`;
  }
}

function drawCellBody(spec: CellSpec, ox: number, oy: number, size: number): string {
  const cx = ox + size / 2;
  const cy = oy + size / 2;
  const count = spec.count ?? 1;
  if (count === 1) {
    const outer = drawShape(spec.shape, cx, cy, size * 0.3, spec.color, spec.hollow, spec.rotate ?? 0);
    const inner = spec.inner ? drawShape(spec.inner, cx, cy, size * 0.13, INK, false, 0) : "";
    return outer + inner;
  }
  const offsets: Record<number, [number, number][]> = {
    2: [[-0.2, 0], [0.2, 0]],
    3: [[0, -0.2], [-0.22, 0.18], [0.22, 0.18]],
    4: [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]],
    5: [[-0.22, -0.22], [0.22, -0.22], [0, 0], [-0.22, 0.22], [0.22, 0.22]],
    6: [[-0.24, -0.18], [0, -0.18], [0.24, -0.18], [-0.24, 0.18], [0, 0.18], [0.24, 0.18]],
  };
  const r = count <= 2 ? size * 0.16 : count <= 4 ? size * 0.13 : size * 0.1;
  return (offsets[count] ?? offsets[3])
    .map(([dx, dy]) => drawShape(spec.shape, cx + dx * size, cy + dy * size, r, spec.color, spec.hollow, spec.rotate ?? 0))
    .join("");
}

function cellTileVisual(spec: CellSpec, alt: string): Visual {
  const size = 76;
  return {
    kind: "svg",
    alt,
    svg: `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="12" fill="#ffffff" stroke="${INK}" stroke-opacity="0.25" stroke-width="2"/>${drawCellBody(spec, 0, 0, size)}</svg>`,
  };
}

function matrixSvg(grid: (CellSpec | null)[][]): string {
  const rows = grid.length;
  const cols = grid[0].length;
  const cell = 76;
  const gap = 8;
  const pad = 10;
  const w = pad * 2 + cols * cell + (cols - 1) * gap;
  const h = pad * 2 + rows * cell + (rows - 1) * gap;
  const body = grid
    .flatMap((row, r) =>
      row.map((spec, c) => {
        const x = pad + c * (cell + gap);
        const y = pad + r * (cell + gap);
        if (!spec) {
          return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="12" fill="#ffe08a" stroke="${INK}" stroke-width="3" stroke-dasharray="6 4"/><text x="${x + cell / 2}" y="${y + cell / 2}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="34" font-weight="800" fill="${INK}">?</text>`;
        }
        return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="12" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/>${drawCellBody(spec, x, y, cell)}`;
      }),
    )
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

type MatrixOption = { label: string; spec: CellSpec };

function matrixQuestion(
  id: string,
  grid: (CellSpec | null)[][],
  correct: MatrixOption,
  distractors: MatrixOption[],
  hint: string,
  explanation: string,
  band: 2 | 3 | 4 | 5,
): Draft {
  const all = [correct, ...distractors];
  assert(new Set(all.map((o) => o.label)).size === all.length, `${id}: matrix choice labels must be unique`);
  const ordered = [...distractors];
  const at = hash(id) % all.length;
  ordered.splice(at, 0, correct);
  return {
    id,
    skills: ["LOGIC-MATRIX", "LOGIC-PATTERN"],
    prompt: "Look at the pattern across each row and down each column. Which tile fits the box with the question mark?",
    visual: { kind: "svg", alt: `A ${grid.length} by ${grid[0].length} visual pattern matrix with the bottom-right tile missing.`, svg: matrixSvg(grid) },
    hint,
    answer: {
      type: "choice",
      choices: ordered.map((o) => o.label),
      correctIndex: at,
      choiceVisuals: ordered.map((o) => cellTileVisual(o.spec, o.label)),
    },
    explanation,
    band,
  };
}

/** CogAT Nonverbal / NNAT3 / Raven's style 2x2 and 3x3 visual matrices. */
function visualMatrices(): Draft[] {
  const { red, blue, green, gold, purple } = PALETTE;
  return [
    // 1. 2x2 shape across rows, color down columns (Band 2 warm-up)
    matrixQuestion(
      "cog-mat-2x2-shape-color",
      [
        [{ shape: "circle", color: red }, { shape: "circle", color: blue }],
        [{ shape: "square", color: red }, null],
      ],
      { label: "Blue square", spec: { shape: "square", color: blue } },
      [
        { label: "Red square", spec: { shape: "square", color: red } },
        { label: "Blue circle", spec: { shape: "circle", color: blue } },
        { label: "Green square", spec: { shape: "square", color: green } },
      ],
      "Look at the shape in the bottom row, and the color in the right column.",
      "The top row has circles and the bottom row has squares. The left column is red and the right column is blue. So the missing tile is a blue square.",
      2,
    ),
    // 2. 2x2 count x shape (Band 2)
    matrixQuestion(
      "cog-mat-2x2-count-shape",
      [
        [{ shape: "star", color: gold, count: 1 }, { shape: "star", color: gold, count: 2 }],
        [{ shape: "triangle", color: green, count: 1 }, null],
      ],
      { label: "2 green triangles", spec: { shape: "triangle", color: green, count: 2 } },
      [
        { label: "1 green triangle", spec: { shape: "triangle", color: green, count: 1 } },
        { label: "2 gold stars", spec: { shape: "star", color: gold, count: 2 } },
        { label: "3 green triangles", spec: { shape: "triangle", color: green, count: 3 } },
      ],
      "How does the number of shapes change from the left box to the right box?",
      "Going from left to right doubles the count from 1 to 2 while keeping the same shape and color. So the missing tile has 2 green triangles.",
      2,
    ),
    // 3. 2x2 solid vs hollow x shape (Band 3)
    matrixQuestion(
      "cog-mat-2x2-fill-shape",
      [
        [{ shape: "diamond", color: purple, hollow: false }, { shape: "diamond", color: purple, hollow: true }],
        [{ shape: "circle", color: blue, hollow: false }, null],
      ],
      { label: "Hollow blue circle", spec: { shape: "circle", color: blue, hollow: true } },
      [
        { label: "Solid blue circle", spec: { shape: "circle", color: blue, hollow: false } },
        { label: "Hollow purple circle", spec: { shape: "circle", color: purple, hollow: true } },
        { label: "Hollow blue diamond", spec: { shape: "diamond", color: blue, hollow: true } },
      ],
      "Compare the left column and right column: one is filled in and the other is hollow.",
      "The left column has solid shapes and the right column has hollow shapes. Keeping the bottom row's blue circle gives a hollow blue circle.",
      3,
    ),
    // 4. 3x3 shape by row, color by column (Band 3)
    matrixQuestion(
      "cog-mat-3x3-shape-color",
      [
        [{ shape: "circle", color: red }, { shape: "circle", color: blue }, { shape: "circle", color: green }],
        [{ shape: "square", color: red }, { shape: "square", color: blue }, { shape: "square", color: green }],
        [{ shape: "triangle", color: red }, { shape: "triangle", color: blue }, null],
      ],
      { label: "Green triangle", spec: { shape: "triangle", color: green } },
      [
        { label: "Blue triangle", spec: { shape: "triangle", color: blue } },
        { label: "Green square", spec: { shape: "square", color: green } },
        { label: "Red triangle", spec: { shape: "triangle", color: red } },
      ],
      "Check which shape belongs in the bottom row and which color belongs in the right column.",
      "Every tile in row 3 is a triangle, and every tile in column 3 is green. So the missing tile is a green triangle.",
      3,
    ),
    // 5. 3x3 count 1, 2, 3 across rows x shape down rows (Band 3)
    matrixQuestion(
      "cog-mat-3x3-count-row",
      [
        [{ shape: "circle", color: red, count: 1 }, { shape: "circle", color: red, count: 2 }, { shape: "circle", color: red, count: 3 }],
        [{ shape: "square", color: blue, count: 1 }, { shape: "square", color: blue, count: 2 }, { shape: "square", color: blue, count: 3 }],
        [{ shape: "star", color: gold, count: 1 }, { shape: "star", color: gold, count: 2 }, null],
      ],
      { label: "3 gold stars", spec: { shape: "star", color: gold, count: 3 } },
      [
        { label: "2 gold stars", spec: { shape: "star", color: gold, count: 2 } },
        { label: "4 gold stars", spec: { shape: "star", color: gold, count: 4 } },
        { label: "3 blue squares", spec: { shape: "square", color: blue, count: 3 } },
      ],
      "Count how many shapes are in column 1, column 2 and column 3.",
      "Each row goes 1, 2, 3 of its shape. Row 3 has gold stars, so the third box needs 3 gold stars.",
      3,
    ),
    // 6. 3x3 90-degree clockwise arrow rotation across columns (Band 4)
    matrixQuestion(
      "cog-mat-3x3-rotate-arrows",
      [
        [{ shape: "arrow", color: red, rotate: 0 }, { shape: "arrow", color: red, rotate: 90 }, { shape: "arrow", color: red, rotate: 180 }],
        [{ shape: "arrow", color: blue, rotate: 90 }, { shape: "arrow", color: blue, rotate: 180 }, { shape: "arrow", color: blue, rotate: 270 }],
        [{ shape: "arrow", color: green, rotate: 180 }, { shape: "arrow", color: green, rotate: 270 }, null],
      ],
      { label: "Green arrow pointing up", spec: { shape: "arrow", color: green, rotate: 0 } },
      [
        { label: "Green arrow pointing right", spec: { shape: "arrow", color: green, rotate: 90 } },
        { label: "Green arrow pointing down", spec: { shape: "arrow", color: green, rotate: 180 } },
        { label: "Blue arrow pointing up", spec: { shape: "arrow", color: blue, rotate: 0 } },
      ],
      "Watch which way each arrow turns as you move one box to the right: up, right, down, left...",
      "Moving right turns the arrow one quarter-turn clockwise. In row 3, down turns to left, and left turns one quarter-turn clockwise to point up. Keeping green gives a green arrow pointing up.",
      4,
    ),
    // 7. 3x3 Latin square: each row & column has circle, square, triangle AND red, blue, green (Band 4)
    matrixQuestion(
      "cog-mat-3x3-latin-shapes",
      [
        [{ shape: "circle", color: red }, { shape: "square", color: blue }, { shape: "triangle", color: green }],
        [{ shape: "square", color: green }, { shape: "triangle", color: red }, { shape: "circle", color: blue }],
        [{ shape: "triangle", color: blue }, { shape: "circle", color: green }, null],
      ],
      { label: "Red square", spec: { shape: "square", color: red } },
      [
        { label: "Red triangle", spec: { shape: "triangle", color: red } },
        { label: "Blue square", spec: { shape: "square", color: blue } },
        { label: "Green square", spec: { shape: "square", color: green } },
      ],
      "Every row uses each shape once (circle, square, triangle) and each color once (red, blue, green). Which shape and color are missing in row 3?",
      "Row 3 already has a triangle and a circle, so it needs a square. It already has blue and green, so it needs red. The missing tile is a red square.",
      4,
    ),
    // 8. 3x3 additive dot counts: col 0 + col 1 = col 2 (Raven's classic, Band 5)
    matrixQuestion(
      "cog-mat-3x3-add-counts",
      [
        [{ shape: "circle", color: blue, count: 1 }, { shape: "circle", color: blue, count: 2 }, { shape: "circle", color: blue, count: 3 }],
        [{ shape: "circle", color: red, count: 2 }, { shape: "circle", color: red, count: 2 }, { shape: "circle", color: red, count: 4 }],
        [{ shape: "circle", color: green, count: 2 }, { shape: "circle", color: green, count: 3 }, null],
      ],
      { label: "5 green circles", spec: { shape: "circle", color: green, count: 5 } },
      [
        { label: "4 green circles", spec: { shape: "circle", color: green, count: 4 } },
        { label: "6 green circles", spec: { shape: "circle", color: green, count: 6 } },
        { label: "3 green circles", spec: { shape: "circle", color: green, count: 3 } },
      ],
      "Add the number of circles in the first two boxes of each row. What do you notice?",
      "In every row, the first two boxes add up to the third box: 1 + 2 = 3, 2 + 2 = 4, so in row 3, 2 + 3 = 5 green circles.",
      5,
    ),
    // 9. 3x3 outer shape by row, inner shape by column (Band 5)
    matrixQuestion(
      "cog-mat-3x3-nested",
      [
        [{ shape: "circle", color: red, hollow: true, inner: "circle" }, { shape: "circle", color: red, hollow: true, inner: "square" }, { shape: "circle", color: red, hollow: true, inner: "triangle" }],
        [{ shape: "square", color: blue, hollow: true, inner: "circle" }, { shape: "square", color: blue, hollow: true, inner: "square" }, { shape: "square", color: blue, hollow: true, inner: "triangle" }],
        [{ shape: "diamond", color: green, hollow: true, inner: "circle" }, { shape: "diamond", color: green, hollow: true, inner: "square" }, null],
      ],
      { label: "Green diamond with triangle inside", spec: { shape: "diamond", color: green, hollow: true, inner: "triangle" } },
      [
        { label: "Green diamond with square inside", spec: { shape: "diamond", color: green, hollow: true, inner: "square" } },
        { label: "Blue square with triangle inside", spec: { shape: "square", color: blue, hollow: true, inner: "triangle" } },
        { label: "Green diamond with circle inside", spec: { shape: "diamond", color: green, hollow: true, inner: "circle" } },
      ],
      "Look at the big outer shape along row 3, and look at the tiny inner shape down column 3.",
      "Row 3 always has a green diamond on the outside, and column 3 always has a small triangle on the inside.",
      5,
    ),
    // 10. 3x3 fill alternates + count Latin square (Band 4)
    matrixQuestion(
      "cog-mat-3x3-hollow-count",
      [
        [{ shape: "square", color: red, count: 1, hollow: false }, { shape: "square", color: red, count: 2, hollow: true }, { shape: "square", color: red, count: 3, hollow: false }],
        [{ shape: "square", color: blue, count: 2, hollow: false }, { shape: "square", color: blue, count: 3, hollow: true }, { shape: "square", color: blue, count: 1, hollow: false }],
        [{ shape: "square", color: purple, count: 3, hollow: false }, { shape: "square", color: purple, count: 1, hollow: true }, null],
      ],
      { label: "2 solid purple squares", spec: { shape: "square", color: purple, count: 2, hollow: false } },
      [
        { label: "2 hollow purple squares", spec: { shape: "square", color: purple, count: 2, hollow: true } },
        { label: "3 solid purple squares", spec: { shape: "square", color: purple, count: 3, hollow: false } },
        { label: "1 solid purple square", spec: { shape: "square", color: purple, count: 1, hollow: false } },
      ],
      "Check two rules: each row has counts 1, 2 and 3, and column 3 is always solid.",
      "Row 3 already has 3 and 1, so it needs 2 purple squares. Column 3 is always solid, so the answer is 2 solid purple squares.",
      4,
    ),
  ];
}

/** CogAT Quantitative: Symbolic Balance Scales & Number Analogies (OA 350+). */
function analogiesAndBalances(): Draft[] {
  // Verify every balance equation in code.
  const car1 = 6;
  const suv1 = 9;
  assert(car1 + car1 === 12 && car1 + suv1 === 15, "balance 1");

  const taxi2 = 5;
  const bus2 = 9;
  assert(taxi2 * 3 === 15 && taxi2 + bus2 === 14, "balance 2");

  const star3 = 8;
  const gem3 = 4;
  assert(star3 + star3 === 16 && star3 + gem3 + gem3 === 16, "balance 3");

  const car4 = 7;
  const truck4 = 11;
  const moto4 = 3;
  assert(car4 + car4 === 14 && car4 + truck4 === 18 && truck4 + moto4 === 14, "balance 4");

  const red5 = 9;
  const blue5 = 6;
  assert(red5 + red5 + red5 === 27 && red5 + blue5 === 15, "balance 5");

  return [
    {
      id: "cog-bal-car-suv",
      skills: ["LOGIC-ANALOGY", "MATH-OA-UNKNOWN"],
      prompt: "Both scales are balanced. How much does one blue car (🚙) weigh?",
      speech: "Both scales are balanced. Two race cars weigh 12. One race car and one blue car weigh 15. How much does one blue car weigh?",
      visual: { kind: "balance", scales: [{ left: ["🏎️", "🏎️"], right: ["12"] }, { left: ["🏎️", "🚙"], right: ["15"] }] },
      hint: "Use the top scale first: if 2 race cars equal 12, what is 1 race car?",
      answer: numeric(suv1),
      explanation: `From the top scale, 2 race cars = 12, so 1 race car = ${car1}. Put ${car1} into the bottom scale: ${car1} + blue car = 15, so the blue car = 15 - ${car1} = ${suv1}.`,
      band: 3,
    },
    {
      id: "cog-bal-taxi-bus",
      skills: ["LOGIC-ANALOGY", "MATH-OA-DIVIDE"],
      prompt: "Both scales are balanced. What number is one bus (🚌) worth?",
      speech: "Three taxis equal 15. One taxi and one bus equal 14. What is one bus worth?",
      visual: { kind: "balance", scales: [{ left: ["🚕", "🚕", "🚕"], right: ["15"] }, { left: ["🚕", "🚌"], right: ["14"] }] },
      hint: "Share 15 equally among 3 taxis first.",
      answer: numeric(bus2),
      explanation: `3 taxis = 15, so 1 taxi = 15 ÷ 3 = ${taxi2}. Then ${taxi2} + bus = 14, so the bus = 14 - ${taxi2} = ${bus2}.`,
      band: 3,
    },
    {
      id: "cog-bal-star-gem",
      skills: ["LOGIC-ANALOGY", "MATH-OA-DIVIDE"],
      prompt: "Both scales are balanced. What number is one diamond (💎) worth?",
      speech: "Two stars equal 16. One star and two diamonds equal 16. What is one diamond worth?",
      visual: { kind: "balance", scales: [{ left: ["⭐", "⭐"], right: ["16"] }, { left: ["⭐", "💎", "💎"], right: ["16"] }] },
      hint: "Compare the two scales! Replacing 1 star with 2 diamonds kept the total at 16.",
      answer: numeric(gem3),
      explanation: `2 stars = 16, so 1 star = ${star3}. That means 2 diamonds also equal ${star3}, so 1 diamond = ${star3} ÷ 2 = ${gem3}.`,
      band: 4,
    },
    {
      id: "cog-bal-three-scales",
      skills: ["LOGIC-ANALOGY", "MATH-OA-UNKNOWN"],
      prompt: "All three scales are balanced. What number is one scooter (🛵) worth?",
      speech: "Two race cars equal 14. One race car and one truck equal 18. One truck and one scooter equal 14. What is one scooter worth?",
      visual: {
        kind: "balance",
        scales: [
          { left: ["🏎️", "🏎️"], right: ["14"] },
          { left: ["🏎️", "🚚"], right: ["18"] },
          { left: ["🚚", "🛵"], right: ["14"] },
        ],
      },
      hint: "Work from top to bottom: find the race car first, then the truck, then the scooter.",
      answer: numeric(moto4),
      explanation: `Race car = 14 ÷ 2 = ${car4}. Truck = 18 - ${car4} = ${truck4}. Scooter = 14 - ${truck4} = ${moto4}.`,
      band: 5,
    },
    {
      id: "cog-bal-three-cars-27",
      skills: ["LOGIC-ANALOGY", "MATH-OA-DIVIDE"],
      prompt: "Both scales are balanced. What number is one blue car (🚙) worth?",
      speech: "Three red cars equal 27. One red car and one blue car equal 15. What is one blue car worth?",
      visual: { kind: "balance", scales: [{ left: ["🚗", "🚗", "🚗"], right: ["27"] }, { left: ["🚗", "🚙"], right: ["15"] }] },
      hint: "Find 27 divided by 3 first to get one red car.",
      answer: numeric(blue5),
      explanation: `3 red cars = 27, so 1 red car = 27 ÷ 3 = ${red5}. Then ${red5} + blue car = 15, so the blue car = 15 - ${red5} = ${blue5}.`,
      band: 4,
    },
    // Number Analogies (CogAT Quantitative)
    {
      id: "cog-num-ana-times3",
      skills: ["LOGIC-ANALOGY", "MATH-OA-MULT"],
      prompt: "Find the rule that links each pair: [3 -> 9], [5 -> 15], [7 -> ?]. What number replaces the question mark?",
      speech: "Find the rule that links each pair: 3 goes to 9, 5 goes to 15, 7 goes to what number?",
      hint: "What can you multiply the first number by to get the second number in both pairs?",
      answer: numeric(7 * 3),
      explanation: "The rule is multiply by 3: 3 × 3 = 9, 5 × 3 = 15, so 7 × 3 = 21.",
      band: 3,
    },
    {
      id: "cog-num-ana-plus6",
      skills: ["LOGIC-ANALOGY", "MATH-OA-ADD-SUB"],
      prompt: "Find the rule that links each pair: [4 -> 10], [9 -> 15], [13 -> ?]. What number replaces the question mark?",
      speech: "Find the rule that links each pair: 4 goes to 10, 9 goes to 15, 13 goes to what number?",
      answer: numeric(13 + 6),
      explanation: "The rule is add 6: 4 + 6 = 10, 9 + 6 = 15, so 13 + 6 = 19.",
      band: 3,
    },
    {
      id: "cog-num-ana-half",
      skills: ["LOGIC-ANALOGY", "MATH-OA-DIVIDE"],
      prompt: "Find the rule that links each pair: [20 -> 10], [16 -> 8], [14 -> ?]. What number replaces the question mark?",
      speech: "Find the rule that links each pair: 20 goes to 10, 16 goes to 8, 14 goes to what number?",
      answer: numeric(14 / 2),
      explanation: "The rule is cut in half (divide by 2): half of 20 is 10, half of 16 is 8, so half of 14 is 7.",
      band: 3,
    },
    {
      id: "cog-num-ana-double-plus1",
      skills: ["LOGIC-ANALOGY", "MATH-OA-MULT"],
      prompt: "Find the two-step rule: [2 -> 5], [4 -> 9], [6 -> ?]. What number replaces the question mark?",
      speech: "Find the two-step rule: 2 goes to 5, 4 goes to 9, 6 goes to what number?",
      hint: "Try doubling the first number, then see how close you are to the second number.",
      answer: numeric(6 * 2 + 1),
      explanation: "The rule is double and add 1: (2 × 2) + 1 = 5, (4 × 2) + 1 = 9, so (6 × 2) + 1 = 13.",
      band: 5,
    },
    {
      id: "cog-num-ana-double-plus2",
      skills: ["LOGIC-ANALOGY", "MATH-OA-MULT"],
      prompt: "Find the two-step rule: [3 -> 8], [5 -> 12], [8 -> ?]. What number replaces the question mark?",
      speech: "Find the two-step rule: 3 goes to 8, 5 goes to 12, 8 goes to what number?",
      hint: "Double each starting number, then check how much more you need to add.",
      answer: numeric(8 * 2 + 2),
      explanation: "The rule is double and add 2: (3 × 2) + 2 = 8, (5 × 2) + 2 = 12, so (8 × 2) + 2 = 18.",
      band: 5,
    },
  ];
}

type Clue = (order: string[]) => boolean;
const before = (a: string, b: string): Clue => (o) => o.indexOf(a) < o.indexOf(b);
const at = (a: string, index: number): Clue => (o) => o.indexOf(a) === index;
const notAt = (a: string, index: number): Clue => (o) => o.indexOf(a) !== index;
const rightAfter = (a: string, b: string): Clue => (o) => o.indexOf(a) === o.indexOf(b) + 1;

function orderPuzzle(
  id: string,
  items: string[],
  clues: Clue[],
  slots: string[],
  prompt: string,
  hint: string,
  explanation: (solution: string[]) => string,
  band: 3 | 4 | 5,
): Draft {
  const solutions = permutations(items).filter((o) => clues.every((c) => c(o)));
  assert(solutions.length === 1, `${id}: clues must give exactly one order, found ${solutions.length}`);
  const correctOrder = solutions[0];
  // Present tray items in a deterministic shuffled order that never equals the answer.
  const tray = [...items].sort((a, b) => hash(`${id}:${a}`) - hash(`${id}:${b}`));
  if (tray.every((x, i) => x === correctOrder[i])) tray.reverse();
  return {
    id,
    skills: ["LOGIC-ORDER"],
    prompt,
    hint,
    answer: { type: "order", items: tray, correctOrder, slots },
    explanation: explanation(correctOrder),
    band,
  };
}

/** Interactive tap-to-place ordering boards (car races, robotics, country parade). */
function interactiveOrders(): Draft[] {
  return [
    orderPuzzle(
      "cog-ord-grand-prix-4",
      ["Ferrari", "Porsche", "Toyota", "BMW"],
      [at("Toyota", 0), before("Ferrari", "BMW"), at("Porsche", 3)],
      ["1st", "2nd", "3rd", "4th"],
      "Put the 4 cars in race finish order! Toyota finished 1st. Porsche finished 4th. Ferrari finished ahead of BMW.",
      "Place Toyota in 1st and Porsche in 4th first. Only 2nd and 3rd are left!",
      (s) => `Toyota is 1st and Porsche is 4th. Since Ferrari beat BMW, Ferrari takes 2nd and BMW takes 3rd. Order: ${s.join(" -> ")}.`,
      3,
    ),
    orderPuzzle(
      "cog-ord-rally-5",
      ["Red", "Blue", "Green", "Yellow", "White"],
      [at("White", 2), at("Yellow", 4), rightAfter("Blue", "Green"), before("Blue", "Red")],
      ["1st", "2nd", "3rd", "4th", "5th"],
      "Put all 5 rally cars in finish order! White finished 3rd. Yellow finished 5th. Blue finished right behind Green. Red finished after Blue.",
      "Start by putting White in 3rd and Yellow in 5th. Which two open spots sit right next to each other for Green and Blue?",
      (s) => `White is 3rd and Yellow is 5th, leaving 1st, 2nd and 4th. Only 1st and 2nd are side by side, so Green is 1st and Blue is 2nd. Red takes 4th. Order: ${s.join(" -> ")}.`,
      5,
    ),
    orderPuzzle(
      "cog-ord-sphero-4",
      ["Bolt", "Dash", "Nova", "Spark"],
      [at("Nova", 1), notAt("Bolt", 0), rightAfter("Spark", "Bolt")],
      ["1st", "2nd", "3rd", "4th"],
      "Four robots (Bolt, Dash, Nova and Spark) raced through a maze! Nova finished 2nd. Bolt did not finish 1st. Spark finished right behind Bolt. Place all 4 robots in finish order.",
      "Put Nova in 2nd. Since Spark must sit right behind Bolt, Bolt and Spark need two open spots next to each other.",
      (s) => `Nova is 2nd. The only two side-by-side spots left are 3rd and 4th, so Bolt is 3rd and Spark is 4th. Dash takes 1st. Order: ${s.join(" -> ")}.`,
      4,
    ),
    orderPuzzle(
      "cog-ord-bridges-4",
      ["Car", "Van", "Truck", "Bus"],
      [before("Car", "Van"), before("Van", "Bus"), at("Truck", 3)],
      ["Lightest", "2nd", "3rd", "Heaviest"],
      "Order the 4 vehicles from lightest to heaviest! The Truck is the heaviest. The Car is lighter than the Van. The Van is lighter than the Bus.",
      "Put the Truck in Heaviest first, then line up Car, Van and Bus from lightest to heaviest.",
      (s) => `Truck is heaviest (4th). Car < Van < Bus fills the first three spots. Order: ${s.join(" -> ")}.`,
      3,
    ),
    orderPuzzle(
      "cog-ord-parade-4",
      ["India", "Canada", "Japan", "Brazil"],
      [at("Canada", 0), rightAfter("Japan", "India"), notAt("Brazil", 1)],
      ["1st", "2nd", "3rd", "4th"],
      "Four country flags march in a parade! Canada goes 1st. Japan marches right behind India. Brazil is not 2nd. Put the 4 countries in parade order.",
      "Put Canada 1st. Can India and Japan be 2nd and 3rd, or 3rd and 4th? Check where Brazil is allowed to go!",
      (s) => `Canada is 1st. Brazil cannot be 2nd, so Brazil must be 4th (if Brazil were 3rd, India and Japan could not sit side by side). That puts India 2nd and Japan 3rd. Order: ${s.join(" -> ")}.`,
      4,
    ),
    orderPuzzle(
      "cog-ord-garage-5",
      ["Audi", "Honda", "Mini", "Tesla", "Volvo"],
      [at("Tesla", 0), at("Mini", 4), rightAfter("Volvo", "Audi"), before("Honda", "Audi")],
      ["Spot 1", "Spot 2", "Spot 3", "Spot 4", "Spot 5"],
      "Park all 5 cars in order from Spot 1 to Spot 5! Tesla is in Spot 1. Mini is in Spot 5. Volvo is parked right after Audi. Honda is parked before Audi.",
      "Put Tesla in Spot 1 and Mini in Spot 5. Now arrange Honda, Audi and Volvo in Spots 2, 3 and 4.",
      (s) => `Tesla is in Spot 1 and Mini is in Spot 5. Honda comes before Audi, and Volvo is right after Audi, so Spots 2, 3 and 4 are Honda, Audi, Volvo. Order: ${s.join(" -> ")}.`,
      4,
    ),
  ];
}

export const cognitiveQuestions = (): Question[] =>
  [...visualMatrices(), ...analogiesAndBalances(), ...interactiveOrders()].map((d) => question(FILE, d));
