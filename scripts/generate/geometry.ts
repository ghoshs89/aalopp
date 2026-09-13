import type { Question } from "../../src/content/schema";
import { assert, choices, numeric, question, type Draft } from "./helpers";

const FILE = "geometry.ts";
const INK = "#1d2f4b";

const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

function countingShapes(): Draft[] {
  const drafts: Draft[] = [];
  // A triangle whose base is split into s parts by lines from the top corner: s(s+1)/2 triangles.
  for (const [s, band] of [[2, 2], [3, 3], [4, 4]] as const) {
    const total = (s * (s + 1)) / 2;
    const xs = Array.from({ length: s + 1 }, (_, i) => 20 + (260 * i) / s);
    const lines = xs.map((x) => `<line x1="150" y1="15" x2="${x}" y2="185" stroke="${INK}" stroke-width="3"/>`).join("");
    const id = `gs-fan-triangles-${s}`;
    drafts.push({
      id,
      skills: ["MATH-GEO-SHAPES"],
      prompt: "How many triangles can you find in this picture? Remember to count the big ones made of smaller pieces.",
      visual: { kind: "svg", alt: `A big triangle split into ${s} thinner triangles by lines from the top corner.`, svg: svg(300, 200, `<polygon points="150,15 20,185 280,185" fill="#fff4c9" stroke="${INK}" stroke-width="3"/>${lines}`) },
      answer: choices(id, total, [s, total - 1, total + 1, s + 1]),
      explanation: `Count by size. There are ${s} small triangles. ${Array.from({ length: s - 1 }, (_, k) => `Triangles made of ${k + 2} pieces side by side: ${s - k - 1}.`).join(" ")} Altogether: ${Array.from({ length: s }, (_, k) => s - k).join(" + ")} = ${total}.`,
      band,
    });
  }
  // Squares in an n by n grid: 1 + 4 + 9 + ... + n squared.
  for (const [n, band] of [[2, 3], [3, 5]] as const) {
    const total = Array.from({ length: n }, (_, k) => (k + 1) ** 2).reduce((a, b) => a + b, 0);
    const size = 180;
    const step = size / n;
    const grid = Array.from({ length: n + 1 }, (_, i) => `<line x1="${10 + i * step}" y1="10" x2="${10 + i * step}" y2="${10 + size}" stroke="${INK}" stroke-width="3"/><line x1="10" y1="${10 + i * step}" x2="${10 + size}" y2="${10 + i * step}" stroke="${INK}" stroke-width="3"/>`).join("");
    const id = `gs-squares-in-grid-${n}`;
    const sizes = Array.from({ length: n }, (_, k) => ({ side: k + 1, count: (n - k) ** 2 }));
    drafts.push({
      id,
      skills: ["MATH-GEO-SHAPES"],
      prompt: "How many squares are in this picture? Count squares of every size.",
      visual: { kind: "svg", alt: `A square split into a ${n} by ${n} grid of small squares.`, svg: svg(200, 200, `<rect x="10" y="10" width="${size}" height="${size}" fill="#e3f1ff"/>${grid}`) },
      answer: choices(id, total, [n * n, total - 1, total + 1, n * n + 1]),
      explanation: `${sizes.map(({ side, count }) => `Squares ${side} by ${side}: ${count}.`).join(" ")} Add them: ${sizes.map((s) => s.count).join(" + ")} = ${total}.`,
      band,
    });
  }
  return drafts;
}

function symmetry(): Draft[] {
  const mirrorSame = new Set("AHIMOTUVWXY".split(""));
  const sets: [string, string[], 1 | 2 | 3][] = [
    ["gsy-mirror-letter-a", ["A", "F", "G", "J"], 1],
    ["gsy-mirror-letter-t", ["R", "P", "T", "L"], 2],
    ["gsy-mirror-letter-w", ["S", "N", "W", "Z"], 3],
  ];
  const drafts: Draft[] = sets.map(([id, letters, band]) => {
    const same = letters.filter((l) => mirrorSame.has(l));
    assert(same.length === 1, `${id}: exactly one symmetric letter`);
    return {
      id,
      skills: ["MATH-GEO-SYMMETRY"],
      prompt: "Which letter looks exactly the same when you hold it up to a mirror?",
      visual: { kind: "emoji", lines: [letters.join("   ")] },
      answer: choices(id, same[0], letters.filter((l) => l !== same[0])),
      explanation: `Imagine a line straight down the middle of each letter. ${same[0]} has the same shape on both sides of that line, so its mirror picture matches. ${letters
        .filter((l) => l !== same[0])
        .join(", ")} would face the other way in a mirror.${band === 3 ? " S, N and Z look the same when you spin them halfway around, but not in a mirror." : ""}`,
      band,
    };
  });
  drafts.push(
    {
      id: "gsy-square-lines",
      skills: ["MATH-GEO-SYMMETRY"],
      prompt: "A line of symmetry folds a shape into two matching halves. How many lines of symmetry does a square have?",
      visual: { kind: "svg", alt: "A square.", svg: svg(160, 160, `<rect x="20" y="20" width="120" height="120" fill="#e3f1ff" stroke="${INK}" stroke-width="4"/>`) },
      answer: choices("gsy-square-lines", 4, [2, 1, 8]),
      explanation: "A square folds into matching halves 4 ways: top to bottom, side to side, and along both diagonals from corner to corner. Try it with a paper square!",
      band: 3,
    },
    {
      id: "gsy-rectangle-lines",
      skills: ["MATH-GEO-SYMMETRY"],
      prompt: "How many lines of symmetry does this long rectangle have?",
      visual: { kind: "svg", alt: "A rectangle twice as wide as it is tall.", svg: svg(260, 150, `<rect x="20" y="35" width="220" height="80" fill="#e3f1ff" stroke="${INK}" stroke-width="4"/>`) },
      answer: choices("gsy-rectangle-lines", 2, [4, 1, 0]),
      explanation: "It folds into matching halves top to bottom and side to side. Folding corner to corner does not work for a long rectangle: the halves do not line up. So it has 2 lines of symmetry.",
      band: 4,
    },
  );
  return drafts;
}

function cubes(): Draft[] {
  const heightMaps: [string, number[][], 2 | 3 | 4][] = [
    ["g3d-map-small", [[2, 1], [1, 1]], 2],
    ["g3d-map-steps", [[3, 2, 1], [2, 1, 1]], 3],
    ["g3d-map-hill", [[1, 2, 1], [2, 3, 2], [1, 2, 1]], 4],
  ];
  const drafts: Draft[] = heightMaps.map(([id, map, band]) => {
    const flat = map.flat();
    const total = flat.reduce((a, b) => a + b, 0);
    return {
      id,
      skills: ["MATH-GEO-3D-COUNT", "MATH-GEO-VIEWS"],
      prompt: "This is a cube building seen from above. Each number tells how many cubes are stacked on that square. How many cubes are there in all?",
      visual: { kind: "grid", rows: map.map((r) => r.map(String)) },
      answer: choices(id, total, [flat.length, total - 1, total + 2, Math.max(...flat)]),
      explanation: `Add the stacks: ${flat.join(" + ")} = ${total}. The number of squares (${flat.length}) is not the answer, because some stacks are taller than 1.`,
      band,
    };
  });
  drafts.push(
    {
      id: "g3d-map-tallest-front",
      skills: ["MATH-GEO-VIEWS"],
      prompt: "This map shows a cube building from above. Each number is how many cubes are stacked there. From the front, how many cubes tall does the building look?",
      visual: { kind: "grid", rows: [["1", "3", "2"], ["2", "1", "1"]] },
      answer: numeric(3, "cubes"),
      explanation: "From the front you see the tallest stack in each column. The tallest stack anywhere is 3, so the building looks 3 cubes tall.",
      band: 3,
    },
    {
      id: "g3d-layers-box",
      skills: ["MATH-GEO-3D-COUNT", "MATH-OA-EQUAL-GROUPS"],
      prompt: "A box of cubes has 3 layers. Each layer is 2 cubes long and 2 cubes wide. How many cubes are in the box?",
      answer: numeric(3 * 2 * 2, "cubes"),
      explanation: "One layer is 2 rows of 2, which is 4 cubes. There are 3 layers: 4 + 4 + 4 = 12 cubes.",
      band: 3,
    },
    {
      id: "g3d-long-box",
      skills: ["MATH-GEO-3D-COUNT", "MATH-OA-ARRAYS"],
      prompt: "A block is built from cubes. It is 3 cubes long, 2 cubes wide and 2 cubes tall. How many cubes does it use?",
      answer: numeric(3 * 2 * 2, "cubes"),
      explanation: "The bottom layer is 3 long and 2 wide: 3 + 3 = 6 cubes. It is 2 layers tall: 6 + 6 = 12 cubes.",
      band: 4,
    },
    {
      id: "gvw-can-from-top",
      skills: ["MATH-GEO-VIEWS"],
      prompt: "You look straight down at a soup can from the top. What shape do you see?",
      visual: { kind: "emoji", lines: ["🥫"] },
      answer: choices("gvw-can-from-top", "A circle", ["A rectangle", "A triangle", "A square"]),
      explanation: "The top of a can is round, so from straight above you see a circle. From the side, you would see a rectangle.",
      band: 1,
    },
    {
      id: "gvw-cone-from-side",
      skills: ["MATH-GEO-VIEWS"],
      prompt: "A traffic cone is standing on the road. What shape does it look like from the side?",
      answer: choices("gvw-cone-from-side", "A triangle", ["A circle", "A square", "A rectangle"]),
      explanation: "A cone is wide at the bottom and comes to a point at the top. From the side, that looks like a triangle. From the top, it would look like a circle.",
      band: 2,
    },
  );
  return drafts;
}

function matchsticks(): Draft[] {
  // Each stick is drawn a little short at both ends so sticks that meet still look like separate sticks to count.
  const stick = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const gap = 6 / len;
    const a = [x1 + (x2 - x1) * gap, y1 + (y2 - y1) * gap].map((v) => v.toFixed(1));
    const b = [x2 - (x2 - x1) * gap, y2 - (y2 - y1) * gap].map((v) => v.toFixed(1));
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#9a5b2a" stroke-width="7" stroke-linecap="round"/>`;
  };
  const rowOfSquares = (n: number) => {
    const s = 60;
    let body = "";
    for (let i = 0; i < n; i++) body += stick(10 + i * s, 10, 10 + (i + 1) * s, 10) + stick(10 + i * s, 10 + s, 10 + (i + 1) * s, 10 + s);
    for (let i = 0; i <= n; i++) body += stick(10 + i * s, 10, 10 + i * s, 10 + s);
    return svg(20 + n * s, 20 + s, body);
  };
  const threeInRow = 3 * 3 + 1;
  const fiveInRow = 3 * 5 + 1;
  // 2 by 2 grid: 3 horizontal lines of 2 sticks and 3 vertical lines of 2 sticks.
  const twoByTwo = 3 * 2 + 3 * 2;
  const triangles = 4;
  const triangleSticks = 2 * triangles + 1;
  const tri = (() => {
    const w = 70;
    const h = 60;
    // Neighboring triangles share a side; keep each stick once so the drawing has exactly the sticks being counted.
    const seen = new Set<string>();
    let body = "";
    const once = (a: number[], b: number[]) => {
      const k = [a.join(","), b.join(",")].sort().join("|");
      if (seen.has(k)) return "";
      seen.add(k);
      return stick(a[0], a[1], b[0], b[1]);
    };
    for (let i = 0; i < triangles; i++) {
      const up = i % 2 === 0;
      const x0 = 10 + (i * w) / 2;
      const pts = up ? [[x0, 10 + h], [x0 + w / 2, 10], [x0 + w, 10 + h]] : [[x0, 10], [x0 + w / 2, 10 + h], [x0 + w, 10]];
      body += once(pts[0], pts[1]) + once(pts[1], pts[2]) + once(pts[0], pts[2]);
    }
    assert(seen.size === triangleSticks, "drawing has exactly the counted sticks");
    return svg(20 + ((triangles + 1) * w) / 2, 20 + h, body);
  })();
  assert(threeInRow === 10 && fiveInRow === 16 && twoByTwo === 12 && triangleSticks === 9, "matchstick formulas");
  return [
    {
      id: "gse-three-squares-count",
      skills: ["MATH-GEO-SHARED-EDGES", "MATH-NBT-COUNTING"],
      prompt: "How many sticks were used to make these 3 squares?",
      visual: { kind: "svg", alt: "Three squares in a row made of sticks, sharing sides.", svg: rowOfSquares(3) },
      answer: choices("gse-three-squares-count", threeInRow, [12, 9, 11]),
      explanation: "Count the top sticks (3), the bottom sticks (3), and the standing sticks (4). 3 + 3 + 4 = 10. It is not 12, because squares next to each other share a stick.",
      band: 2,
    },
    {
      id: "gse-five-squares-no-picture",
      skills: ["MATH-GEO-SHARED-EDGES"],
      prompt: "3 squares in a row, sharing sides, use 10 sticks. How many sticks do 5 squares in a row use?",
      answer: numeric(fiveInRow, "sticks"),
      explanation: "The first square needs 4 sticks. Every new square shares one side, so it only needs 3 more. 4 + 3 + 3 + 3 + 3 = 16 sticks.",
      band: 4,
    },
    {
      id: "gse-two-by-two-grid",
      skills: ["MATH-GEO-SHARED-EDGES"],
      prompt: "How many sticks make this 2 by 2 window?",
      visual: {
        kind: "svg",
        alt: "Four squares arranged in a 2 by 2 grid, made of sticks.",
        svg: svg(140, 140, [0, 1, 2].flatMap((i) => [0, 1].map((j) => stick(10 + j * 60, 10 + i * 60, 70 + j * 60, 10 + i * 60) + stick(10 + i * 60, 10 + j * 60, 10 + i * 60, 70 + j * 60))).join("")),
      },
      answer: choices("gse-two-by-two-grid", twoByTwo, [16, 6, 10]),
      explanation: "Each long line across is 2 sticks, and there are 3 lines across: 6 sticks. Each long line down is also 2 sticks, and there are 3 lines down: 6 sticks. 6 + 6 = 12.",
      band: 3,
    },
    {
      id: "gse-two-triangles",
      skills: ["MATH-GEO-SHARED-EDGES"],
      prompt: "One triangle needs 3 sticks. Two triangles that share one side make a diamond. How many sticks does the diamond need?",
      answer: choices("gse-two-triangles", 5, [6, 4, 3]),
      explanation: "The first triangle uses 3 sticks. The second triangle borrows the shared side, so it needs only 2 new sticks. 3 + 2 = 5 sticks.",
      band: 2,
    },
    {
      id: "gse-triangle-row",
      skills: ["MATH-GEO-SHARED-EDGES"],
      prompt: "How many sticks were used to make this row of 4 triangles?",
      visual: { kind: "svg", alt: "Four triangles in a row, alternating point up and point down, sharing sides.", svg: tri },
      answer: choices("gse-triangle-row", triangleSticks, [12, 8, 10]),
      explanation: "The first triangle needs 3 sticks. Each new triangle shares a side with the one before, so it only needs 2 more. 3 + 2 + 2 + 2 = 9 sticks.",
      band: 3,
    },
  ];
}

function turnsAndFlips(): Draft[] {
  const dirs = [
    { word: "up", arrow: "⬆️" },
    { word: "right", arrow: "➡️" },
    { word: "down", arrow: "⬇️" },
    { word: "left", arrow: "⬅️" },
  ];
  const label = (i: number) => `${dirs[i].arrow} ${dirs[i].word[0].toUpperCase()}${dirs[i].word.slice(1)}`;
  const turnItems: [string, number, number, string, 1 | 2 | 3 | 4][] = [
    ["gtu-quarter-clockwise", 0, 1, "a quarter turn clockwise, the way clock hands move", 2],
    ["gtu-half-turn", 1, 2, "a half turn", 2],
    ["gtu-quarter-counter", 3, -1, "a quarter turn counterclockwise, the opposite way from clock hands", 3],
    ["gtu-three-quarter", 0, 3, "three quarter turns clockwise", 4],
  ];
  const drafts: Draft[] = turnItems.map(([id, start, quarters, how, band]) => {
    const end = (((start + quarters) % 4) + 4) % 4;
    const steps = Array.from({ length: Math.abs(quarters) }, (_, k) => dirs[(((start + Math.sign(quarters) * (k + 1)) % 4) + 4) % 4].word);
    return {
      id,
      skills: ["MATH-GEO-TURNS"],
      prompt: `The arrow points ${dirs[start].word}. It makes ${how}. Which way does it point now?`,
      visual: { kind: "emoji", lines: [dirs[start].arrow] },
      answer: choices(id, label(end), [0, 1, 2, 3].filter((i) => i !== end).map(label)),
      explanation: `Turn one quarter at a time: ${steps.join(", then ")}. It ends up pointing ${dirs[end].word}.`,
      band,
    };
  });
  drafts.push(
    {
      id: "gtu-race-car-two-rights",
      skills: ["MATH-GEO-TURNS", "LOGIC-VISUALIZE"],
      prompt: "A race car drives north. It turns right, and then turns right again. Which way is it driving now?",
      answer: choices("gtu-race-car-two-rights", "South", ["North", "East", "West"]),
      explanation: "Facing north, a right turn faces east. Another right turn faces south. Two right turns make a half turn, so the car now drives the opposite way.",
      band: 3,
    },
    {
      id: "gtu-minute-hand-quarter",
      skills: ["MATH-GEO-TURNS", "MATH-MD-TIME-HALF-QUARTER"],
      prompt: "The minute hand points to 12. It makes a quarter turn clockwise, the way clock hands move. Which number does it point to now?",
      visual: { kind: "clock", hour: 12, minute: 0 },
      answer: choices("gtu-minute-hand-quarter", 3, [6, 9, 4]),
      explanation: "A whole turn goes all the way around the clock. A quarter turn is one of four equal parts: from 12 to 3. That is also why 15 minutes is called a quarter of an hour.",
      band: 2,
    },
    {
      id: "gfl-b-left-right",
      skills: ["MATH-GEO-TURNS", "MATH-GEO-SYMMETRY"],
      prompt: "Flip the letter b over, left to right, like looking in a mirror. Which letter do you get?",
      visual: { kind: "emoji", lines: ["b"] },
      answer: choices("gfl-b-left-right", "d", ["p", "q", "b"]),
      explanation: "In b, the round part is on the right. A left to right flip moves the round part to the left, and the tall line stays tall. That is d.",
      band: 3,
    },
    {
      id: "gfl-p-top-bottom",
      skills: ["MATH-GEO-TURNS", "MATH-GEO-SYMMETRY"],
      prompt: "Flip the letter p over, top to bottom. Which letter do you get?",
      visual: { kind: "emoji", lines: ["p"] },
      answer: choices("gfl-p-top-bottom", "b", ["d", "q", "p"]),
      explanation: "In p, the line hangs down and the round part is on the right. A top to bottom flip makes the line go up, and the round part stays on the right. That is b.",
      band: 4,
    },
  );
  return drafts;
}

function folding(): Draft[] {
  const holes = (folds: number, punches: number) => punches * 2 ** folds;
  return [
    {
      id: "gfo-one-fold-one-hole",
      skills: ["MATH-GEO-FOLDING"],
      prompt: "Fold a paper in half once. Punch 1 hole through both layers. Unfold it. How many holes are there?",
      visual: { kind: "emoji", lines: ["📄 ➔ fold ➔ 🕳️ ➔ unfold"] },
      speech: "Fold a paper in half once. Punch 1 hole through both layers. Unfold it. How many holes are there?",
      answer: numeric(holes(1, 1), "holes"),
      explanation: "Folding once makes 2 layers. The hole goes through both layers, so there are 2 holes when you unfold it.",
      band: 1,
    },
    {
      id: "gfo-two-folds-one-hole",
      skills: ["MATH-GEO-FOLDING"],
      prompt: "Fold a paper in half, then in half again. Punch 1 hole through all the layers. Unfold it. How many holes are there?",
      answer: numeric(holes(2, 1), "holes"),
      explanation: "The first fold makes 2 layers. Folding again doubles that to 4 layers. One punch goes through all 4, so there are 4 holes.",
      band: 3,
    },
    {
      id: "gfo-three-folds-one-hole",
      skills: ["MATH-GEO-FOLDING", "MATH-OA-EQUAL-GROUPS"],
      prompt: "Fold a paper in half 3 times. Punch 1 hole through all the layers. Unfold it. How many holes are there?",
      answer: numeric(holes(3, 1), "holes"),
      explanation: "Each fold doubles the layers: 1 fold makes 2, 2 folds make 4, 3 folds make 8. One punch makes a hole in all 8 layers.",
      band: 4,
    },
    {
      id: "gfo-two-folds-two-holes",
      skills: ["MATH-GEO-FOLDING", "MATH-OA-EQUAL-GROUPS"],
      prompt: "Fold a paper in half, then in half again. Punch 2 holes through all the layers. Unfold it. How many holes are there?",
      answer: numeric(holes(2, 2), "holes"),
      explanation: "Two folds make 4 layers. Each punch goes through all 4 layers, and there are 2 punches: 4 + 4 = 8 holes.",
      band: 4,
    },
    {
      id: "gfo-corner-to-corner",
      skills: ["MATH-GEO-FOLDING", "MATH-GEO-SHAPES"],
      prompt: "Fold a square napkin in half from one corner to the opposite corner. What shape do you get?",
      answer: choices("gfo-corner-to-corner", "A triangle", ["A smaller square", "A rectangle", "A circle"]),
      explanation: "A fold from corner to corner goes along the diagonal. Half of a square cut along its diagonal is a triangle.",
      band: 2,
    },
    {
      id: "gfo-edge-to-edge",
      skills: ["MATH-GEO-FOLDING", "MATH-GEO-SHAPES"],
      prompt: "Fold a square napkin in half so one edge meets the opposite edge. What shape do you get?",
      answer: choices("gfo-edge-to-edge", "A rectangle", ["A triangle", "A smaller square", "A circle"]),
      explanation: "Folding edge to edge keeps the full width but makes it half as tall. A shape that is longer one way than the other, with square corners, is a rectangle.",
      band: 2,
    },
  ];
}

export const geometryQuestions = (): Question[] =>
  [...countingShapes(), ...symmetry(), ...cubes(), ...matchsticks(), ...turnsAndFlips(), ...folding()].map((d) => question(FILE, d));
