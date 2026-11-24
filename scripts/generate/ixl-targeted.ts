import type { Question } from "../../src/content/schema";
import { assert, choices, numeric, question, timeLabel, type Draft } from "./helpers";

const FILE = "ixl-targeted.ts";
const INK = "#1d2f4b";
const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

/** Measurement & Data: comparing two objects on the same ruler (IXL DMP). */
function compareRulers(): Draft[] {
  type Spec = {
    id: string;
    unit: "in" | "cm";
    length: number;
    a: { start: number; end: number; object: "car" | "pencil" | "crayon" | "truck" | "key" | "bus" };
    b: { start: number; end: number; object: "car" | "pencil" | "crayon" | "truck" | "key" | "bus" };
    band: 2 | 3 | 4;
  };
  const specs: Spec[] = [
    { id: "ixl-cmp-bus-car-in", unit: "in", length: 10, a: { start: 0, end: 8, object: "bus" }, b: { start: 0, end: 5, object: "car" }, band: 2 },
    { id: "ixl-cmp-truck-car-offset-in", unit: "in", length: 10, a: { start: 1, end: 9, object: "truck" }, b: { start: 2, end: 6, object: "car" }, band: 3 },
    { id: "ixl-cmp-pencil-crayon-in", unit: "in", length: 9, a: { start: 1, end: 8, object: "pencil" }, b: { start: 3, end: 7, object: "crayon" }, band: 3 },
    { id: "ixl-cmp-bus-truck-offset-in", unit: "in", length: 10, a: { start: 2, end: 10, object: "bus" }, b: { start: 1, end: 6, object: "truck" }, band: 4 },
    { id: "ixl-cmp-pencil-key-cm", unit: "cm", length: 14, a: { start: 2, end: 13, object: "pencil" }, b: { start: 4, end: 9, object: "key" }, band: 3 },
  ];
  return specs.map((s) => {
    const lenA = s.a.end - s.a.start;
    const lenB = s.b.end - s.b.start;
    const diff = lenA - lenB;
    assert(diff > 0, `${s.id}: first object must be longer`);
    const unitWord = s.unit === "in" ? "inches" : "centimeters";
    return {
      id: s.id,
      skills: ["MATH-MD-LENGTH", "MATH-OA-ADD-SUB"],
      prompt: `How many ${unitWord} longer is the ${s.a.object} than the ${s.b.object}?`,
      visual: { kind: "ruler", unit: s.unit, length: s.length, start: s.a.start, end: s.a.end, object: s.a.object, compare: s.b },
      hint: `Measure the ${s.a.object} first (${s.a.start} to ${s.a.end}), then measure the ${s.b.object} (${s.b.start} to ${s.b.end}), then subtract.`,
      answer: numeric(diff, unitWord),
      explanation: `The ${s.a.object} is ${s.a.end} - ${s.a.start} = ${lenA} ${unitWord} long. The ${s.b.object} is ${s.b.end} - ${s.b.start} = ${lenB} ${unitWord} long. ${lenA} - ${lenB} = ${diff} ${unitWord} longer.`,
      band: s.band,
    };
  });
}

/** Measurement & Data: multi-step scaled bar graphs (IXL 8CH, Bar Graphs II). */
function barGraphsTwo(): Draft[] {
  const laps = [
    { label: "Red", value: 14 },
    { label: "Blue", value: 10 },
    { label: "Green", value: 18 },
    { label: "Yellow", value: 8 },
  ];
  const books = [
    { label: "Cars", value: 16 },
    { label: "Maps", value: 12 },
    { label: "Robots", value: 20 },
    { label: "Space", value: 10 },
  ];
  const redPlusBlue = laps[0].value + laps[1].value;
  const diffRBvsG = redPlusBlue - laps[2].value;
  const totalLaps = laps.reduce((s, b) => s + b.value, 0);
  const robotsAndCars = books[2].value + books[0].value;
  const mapsAndSpace = books[1].value + books[3].value;
  const bookDiff = robotsAndCars - mapsAndSpace;
  return [
    {
      id: "ixl-bar2-laps-combined",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many more laps did Red and Blue drive together than Green?",
      visual: { kind: "barChart", title: "Race laps driven", unit: "laps", bars: laps },
      hint: "Add Red and Blue first, then subtract Green.",
      answer: numeric(diffRBvsG, "laps"),
      explanation: `Red drove ${laps[0].value} and Blue drove ${laps[1].value}, so together they drove ${redPlusBlue} laps. Green drove ${laps[2].value}. ${redPlusBlue} - ${laps[2].value} = ${diffRBvsG} more laps.`,
      band: 3,
    },
    {
      id: "ixl-bar2-laps-total",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many laps did all four race cars drive altogether?",
      visual: { kind: "barChart", title: "Race laps driven", unit: "laps", bars: laps },
      hint: "Read each bar on the scale, then add them in pairs.",
      answer: numeric(totalLaps, "laps"),
      explanation: `Add all four bars: ${laps.map((b) => b.value).join(" + ")} = ${totalLaps} laps.`,
      band: 3,
    },
    {
      id: "ixl-bar2-laps-fewest-to-most",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many more laps did the tallest bar (Green) have than the shortest bar (Yellow)?",
      visual: { kind: "barChart", title: "Race laps driven", unit: "laps", bars: laps },
      answer: numeric(laps[2].value - laps[3].value, "laps"),
      explanation: `Green has ${laps[2].value} laps and Yellow has ${laps[3].value} laps. ${laps[2].value} - ${laps[3].value} = ${laps[2].value - laps[3].value} laps.`,
      band: 2,
    },
    {
      id: "ixl-bar2-books-two-groups",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many more books are about Robots and Cars together than about Maps and Space together?",
      visual: { kind: "barChart", title: "Library books checked out", unit: "books", bars: books },
      hint: "Find Robots + Cars first, then Maps + Space, then subtract.",
      answer: numeric(bookDiff, "books"),
      explanation: `Robots (${books[2].value}) + Cars (${books[0].value}) = ${robotsAndCars}. Maps (${books[1].value}) + Space (${books[3].value}) = ${mapsAndSpace}. ${robotsAndCars} - ${mapsAndSpace} = ${bookDiff} more books.`,
      band: 4,
    },
    {
      id: "ixl-bar2-books-equalize",
      skills: ["MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many more Maps books need to be checked out to match the Robots bar?",
      visual: { kind: "barChart", title: "Library books checked out", unit: "books", bars: books },
      answer: numeric(books[2].value - books[1].value, "books"),
      explanation: `Robots has ${books[2].value} books and Maps has ${books[1].value} books. ${books[2].value} - ${books[1].value} = ${books[2].value - books[1].value} more books.`,
      band: 3,
    },
  ];
}

/** Measurement & Data: matching analog and digital clocks (IXL L5U, 3rd grade). */
function analogDigitalClocks(): Draft[] {
  const specs: [string, number, number, string[], 2 | 3 | 4][] = [
    ["ixl-clk-3-45", 3, 45, ["4:45", "3:09", "9:15"], 3],
    ["ixl-clk-7-15", 7, 15, ["7:03", "3:35", "8:15"], 2],
    ["ixl-clk-11-55", 11, 55, ["12:55", "11:11", "12:11"], 4],
    ["ixl-clk-6-35", 6, 35, ["7:35", "6:07", "7:06"], 3],
    ["ixl-clk-8-05", 8, 5, ["8:01", "1:40", "8:50"], 3],
  ];
  return specs.map(([id, h, m, wrong, band]) => {
    const right = timeLabel(h, m);
    return {
      id,
      skills: ["MATH-MD-TIME-5MIN"],
      prompt: "Which digital clock shows the exact same time as this analog clock?",
      visual: { kind: "clock", hour: h, minute: m },
      hint: "Check which hour number the short hand has already passed, then count by 5s to the long hand.",
      answer: choices(id, right, wrong),
      explanation: `The short hand has passed ${h} (not reached ${h === 12 ? 1 : h + 1} yet), and the long hand points to ${m / 5}, which is ${m} minutes. On a digital clock that is ${right}.`,
      band,
    };
  });
}

/** Number & Base Ten: rounding to nearest 10 or 100 on a number line (IXL 6ST, 3rd grade). */
function roundingNumberLine(): Draft[] {
  const tens: [string, number, number, number, 2 | 3][] = [
    ["ixl-round10-43", 40, 50, 43, 2],
    ["ixl-round10-68", 60, 70, 68, 2],
    ["ixl-round10-85", 80, 90, 85, 3],
    ["ixl-round10-124", 120, 130, 124, 3],
  ];
  const hundreds: [string, number, number, number, 3 | 4][] = [
    ["ixl-round100-240", 200, 300, 240, 3],
    ["ixl-round100-370", 300, 400, 370, 3],
    ["ixl-round100-550", 500, 600, 550, 4],
    ["ixl-round100-785", 700, 800, 785, 4],
  ];
  const round10 = (n: number) => Math.floor((n + 5) / 10) * 10;
  const round100 = (n: number) => Math.floor((n + 50) / 100) * 100;
  return [
    ...tens.map(([id, min, max, mark, band]) => {
      const right = round10(mark);
      const mid = (min + max) / 2;
      return {
        id,
        skills: ["MATH-NBT-ROUNDING", "MATH-NBT-PLACE-VALUE"],
        prompt: `A race car stops at mile ${mark}. Round ${mark} to the nearest ten.`,
        visual: { kind: "numberLine" as const, min, max, step: 1, mark, label: `🏎️ ${mark}` },
        hint:
          mark === mid
            ? `Look at the halfway mark (${mid}). When a number lands right on the halfway mark, it rounds up to the next ten.`
            : `Look at the halfway mark (${mid}). Is ${mark} below ${mid}, or at/above ${mid}?`,
        answer: choices(id, right, [right === min ? max : min, mark, min - 10]),
        explanation:
          mark === mid
            ? `${mark} is right at the halfway point ${mid}. By the rounding rule, halfway numbers round up to ${max}.`
            : `On the number line, ${mark} is closer to ${right} than to ${right === min ? max : min}, so it rounds to ${right}.`,
        band,
      };
    }),
    ...hundreds.map(([id, min, max, mark, band]) => {
      const right = round100(mark);
      const mid = (min + max) / 2;
      return {
        id,
        skills: ["MATH-NBT-ROUNDING", "MATH-NBT-PLACE-VALUE"],
        prompt: `A rally route is ${mark} kilometers long. Round ${mark} to the nearest hundred.`,
        visual: { kind: "numberLine" as const, min, max, step: 10, mark, label: `${mark} km` },
        hint:
          mark === mid
            ? `Find ${mid} in the middle of the number line. When a number lands right on the halfway mark, it rounds up to the next hundred.`
            : `Find ${mid} in the middle of the number line. Is ${mark} closer to ${min} or ${max}?`,
        answer: choices(id, right, [right === min ? max : min, mid, max + 100]),
        explanation:
          mark === mid
            ? `${mark} is right at the halfway point ${mid}, and halfway numbers round up to ${max}.`
            : `On the number line, ${mark} is closer to ${right} than to ${right === min ? max : min}, so ${mark} rounds to ${right}.`,
        band,
      };
    }),
  ];
}

/** Number & Base Ten / Fractions: equivalent fractions using fraction strips (IXL LXP, 3rd grade). */
function equivalentFractions(): Draft[] {
  const specs: [string, number, number, number, number, string[], 3 | 4][] = [
    ["ixl-eqf-half-quarters", 2, 1, 4, 2, ["1/4", "3/4", "2/2"], 3],
    ["ixl-eqf-half-sixths", 2, 1, 6, 3, ["2/6", "4/6", "1/6"], 3],
    ["ixl-eqf-twothirds-sixths", 3, 2, 6, 4, ["2/6", "3/6", "5/6"], 4],
    ["ixl-eqf-onethird-sixths", 3, 1, 6, 2, ["1/6", "3/6", "4/6"], 3],
    ["ixl-eqf-threequarters-eighths", 4, 3, 8, 6, ["4/8", "5/8", "7/8"], 4],
  ];
  return specs.map(([id, p1, s1, p2, s2, wrong, band]) => {
    assert(s1 * p2 === s2 * p1, `${id}: fractions must be equal`);
    const topLabel = `${s1}/${p1}`;
    const rightLabel = `${s2}/${p2}`;
    return {
      id,
      skills: ["MATH-NF-FRACTIONS"],
      prompt: `Look at the two fraction strips. Which fraction matches ${topLabel} on the bottom strip?`,
      visual: {
        kind: "fractionStrip",
        strips: [
          { parts: p1, shaded: s1, label: topLabel },
          { parts: p2, shaded: s2, label: "?" },
        ],
      },
      hint: `Count how many shaded pieces are on the bottom strip, and how many equal pieces make the whole bottom strip.`,
      answer: choices(id, rightLabel, wrong),
      explanation: `Both shaded bars reach the exact same spot. The bottom strip has ${p2} equal pieces and ${s2} are shaded, so ${topLabel} equals ${rightLabel}.`,
      band,
    };
  });
}

/** Geometry: quadrilaterals and shape-attribute classification (IXL L9K + CogAT Figural Classification). */
function quadrilaterals(): Draft[] {
  const quadSvg = (points: string, fill = "#b7d3f6") =>
    svg(220, 140, `<polygon points="${points}" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`);
  const multiSvg = (shapes: string[]) =>
    svg(
      360,
      110,
      shapes
        .map(
          (body, i) =>
            `<g transform="translate(${i * 90}, 0)"><rect x="6" y="6" width="78" height="98" rx="10" fill="#ffffff" stroke="${INK}" stroke-opacity="0.2" stroke-width="2"/>${body}<text x="45" y="96" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="800" fill="${INK}">${"ABCD"[i]}</text></g>`,
        )
        .join(""),
    );

  return [
    {
      id: "ixl-quad-trapezoid",
      skills: ["MATH-GEO-QUADRILATERALS", "MATH-GEO-SHAPES"],
      prompt: "This 4-sided shape has only one pair of parallel sides (top and bottom). What is it called?",
      visual: { kind: "svg", alt: "A trapezoid with a shorter top edge parallel to a longer bottom edge.", svg: quadSvg("65,25 155,25 190,115 30,115") },
      answer: choices("ixl-quad-trapezoid", "Trapezoid", ["Square", "Triangle", "Pentagon"]),
      explanation: "A trapezoid is a quadrilateral (4-sided shape) with one pair of parallel sides.",
      band: 2,
    },
    {
      id: "ixl-quad-rhombus",
      skills: ["MATH-GEO-QUADRILATERALS", "MATH-GEO-SHAPES"],
      prompt: "All 4 sides of this shape are the same length, and its corners are slanted (not square corners). What is it called?",
      visual: { kind: "svg", alt: "A slanted diamond-like rhombus with four equal sides.", svg: quadSvg("110,18 185,70 110,122 35,70", "#ffe08a") },
      answer: choices("ixl-quad-rhombus", "Rhombus", ["Rectangle", "Pentagon", "Hexagon"]),
      explanation: "A rhombus is a 4-sided shape where all 4 sides have equal length.",
      band: 3,
    },
    {
      id: "ixl-quad-parallelogram",
      skills: ["MATH-GEO-QUADRILATERALS", "MATH-GEO-SHAPES"],
      prompt: "Both pairs of opposite sides are parallel and equal in length, and the shape leans sideways. What is it called?",
      visual: { kind: "svg", alt: "A leaning parallelogram with two pairs of parallel sides.", svg: quadSvg("60,28 190,28 160,112 30,112", "#c8f2dc") },
      answer: choices("ixl-quad-parallelogram", "Parallelogram", ["Triangle", "Circle", "Pentagon"]),
      explanation: "A parallelogram is a quadrilateral whose opposite sides are parallel and equal in length.",
      band: 3,
    },
    {
      id: "ixl-quad-not-a-quad",
      skills: ["MATH-GEO-QUADRILATERALS", "MATH-GEO-SHAPES"],
      prompt: "A quadrilateral has exactly 4 straight sides. Which shape is NOT a quadrilateral?",
      visual: {
        kind: "svg",
        alt: "Four shapes labeled A through D: a square, a trapezoid, a pentagon with 5 sides, and a rectangle.",
        svg: multiSvg([
          `<rect x="22" y="22" width="46" height="46" fill="#b7d3f6" stroke="${INK}" stroke-width="3"/>`,
          `<polygon points="28,24 62,24 72,68 18,68" fill="#ffe08a" stroke="${INK}" stroke-width="3"/>`,
          `<polygon points="45,16 72,36 62,68 28,68 18,36" fill="#f7b7be" stroke="${INK}" stroke-width="3"/>`,
          `<rect x="16" y="30" width="58" height="36" fill="#c8f2dc" stroke="${INK}" stroke-width="3"/>`,
        ]),
      },
      hint: "Count the straight sides on each shape. Which one does not have 4?",
      answer: choices("ixl-quad-not-a-quad", "Shape C", ["Shape A", "Shape B", "Shape D"]),
      explanation: "Shapes A, B and D each have 4 sides, so they are quadrilaterals. Shape C is a pentagon with 5 sides, so it is not a quadrilateral.",
      band: 2,
    },
    {
      id: "ixl-quad-all-square-corners",
      skills: ["MATH-GEO-QUADRILATERALS", "MATH-GEO-SHAPES"],
      prompt: "Which statement is ALWAYS true about every square and every rectangle?",
      answer: choices(
        "ixl-quad-all-square-corners",
        "They have 4 straight sides and 4 square corners",
        ["All 4 sides must be the same length", "They have 3 corners", "They have no parallel sides"],
      ),
      explanation: "Both squares and rectangles have 4 straight sides and 4 square (right-angle) corners. A rectangle can have two longer sides and two shorter sides, so its sides do not all have to match.",
      band: 3,
    },
    {
      id: "ixl-quad-classification-group",
      skills: ["MATH-GEO-QUADRILATERALS", "LOGIC-PATTERN"],
      prompt: "Square, Rectangle and Rhombus all belong to the same shape family. Which shape belongs in their group too?",
      hint: "Ask what a square, a rectangle and a rhombus all have in common: how many sides?",
      answer: choices("ixl-quad-classification-group", "Trapezoid", ["Hexagon", "Triangle", "Octagon"]),
      explanation: "Squares, rectangles, rhombuses and trapezoids all have 4 sides, so they are all quadrilaterals. Triangles (3), hexagons (6) and octagons (8) have a different number of sides.",
      band: 4,
    },
  ];
}

/** Operations & Algebraic Thinking: multiplication up to 10 & division by equal groups (IXL PNV / UYK, OA 350). */
function multAndDivide(): Draft[] {
  return [
    {
      id: "ixl-oa-mult-7x8",
      skills: ["MATH-OA-MULT", "MATH-OA-ARRAYS"],
      prompt: "A racing garage has 7 rows with 8 cars in each row. How many cars are in the garage?",
      hint: "7 groups of 8 is 5 groups of 8 (40) plus 2 more groups of 8 (16).",
      answer: numeric(7 * 8, "cars"),
      explanation: "7 × 8 = 56. You can split it as (5 × 8) + (2 × 8) = 40 + 16 = 56 cars.",
      band: 4,
    },
    {
      id: "ixl-oa-mult-9x6",
      skills: ["MATH-OA-MULT"],
      prompt: "A pit crew stacks 9 piles of tires with 6 tires in each pile. How many tires is that?",
      hint: "10 piles of 6 would be 60. Take away 1 pile of 6.",
      answer: numeric(9 * 6, "tires"),
      explanation: "9 × 6 = 54. Ten 6s is 60, minus one 6 is 54 tires.",
      band: 4,
    },
    {
      id: "ixl-oa-mult-8x8",
      skills: ["MATH-OA-MULT", "MATH-OA-ARRAYS"],
      prompt: "A chessboard has 8 rows with 8 squares in each row. How many squares are on a chessboard?",
      answer: numeric(8 * 8, "squares"),
      explanation: "8 rows of 8 is 8 × 8 = 64 squares.",
      band: 4,
    },
    {
      id: "ixl-oa-div-54-by-6",
      skills: ["MATH-OA-DIVIDE", "MATH-OA-EQUAL-GROUPS"],
      prompt: "54 race cars line up in equal heats of 6 cars each. How many heats are there?",
      hint: "Ask yourself: 6 times what number equals 54?",
      answer: numeric(54 / 6, "heats"),
      explanation: "54 ÷ 6 = 9, because 9 groups of 6 make 54. There are 9 heats.",
      band: 4,
    },
    {
      id: "ixl-oa-div-63-by-9",
      skills: ["MATH-OA-DIVIDE", "MATH-OA-MULT"],
      prompt: "63 flag stickers are shared equally across 9 album pages. How many stickers go on each page?",
      hint: "Think of the 9s facts: 9 × ? = 63.",
      answer: numeric(63 / 9, "stickers"),
      explanation: "63 ÷ 9 = 7, because 9 × 7 = 63. Each page gets 7 stickers.",
      band: 4,
    },
    {
      id: "ixl-oa-twostep-garage",
      skills: ["MATH-OA-MULT", "MATH-OA-ADD-SUB"],
      prompt: "A toy store has 4 shelves with 8 race cars on each shelf, plus 5 more race cars in the window. How many race cars are there in all?",
      hint: "Multiply 4 × 8 first, then add the 5 cars in the window.",
      answer: numeric(4 * 8 + 5, "cars"),
      explanation: "4 shelves of 8 cars is 4 × 8 = 32 cars. Adding the 5 window cars gives 32 + 5 = 37 cars.",
      band: 5,
    },
  ];
}

/** ELA 300+: prefixes/suffixes by meaning (IXL LDS) + CogAT Verbal Analogies. */
function wordPartsAndAnalogies(): Draft[] {
  return [
    {
      id: "ixl-ela-prefix-re",
      skills: ["LANG-EN-WORD-PARTS"],
      prompt: 'The words "rebuild", "replay" and "reread" all start with "re-". What does the prefix "re-" mean?',
      answer: choices("ixl-ela-prefix-re", "Do again", ["Not", "Before", "Very small"]),
      explanation: 'Rebuild means build again, replay means play again, and reread means read again. The prefix "re-" means again.',
      band: 2,
    },
    {
      id: "ixl-ela-prefix-un",
      skills: ["LANG-EN-WORD-PARTS"],
      prompt: 'Which word uses the prefix "un-" to mean "not" or "the opposite of"?',
      answer: choices("ixl-ela-prefix-un", "Unfair", ["Under", "Uncle", "Unit"]),
      explanation: 'Unfair means not fair ("un-" + "fair"). In under, uncle and unit, "un" is just part of the root word, not a prefix.',
      band: 3,
    },
    {
      id: "ixl-ela-prefix-pre",
      skills: ["LANG-EN-WORD-PARTS"],
      prompt: 'A "preview" lets you view a movie early, and you "preheat" an oven early. What does the prefix "pre-" mean?',
      answer: choices("ixl-ela-prefix-pre", "Before", ["After", "Without", "Together"]),
      explanation: 'Preview means view before, and preheat means heat before. The prefix "pre-" means before.',
      band: 3,
    },
    {
      id: "ixl-ela-suffix-less",
      skills: ["LANG-EN-WORD-PARTS"],
      prompt: '"Fearless" means having no fear, and "cloudless" means having no clouds. What does "wireless" mean?',
      answer: choices("ixl-ela-suffix-less", "Without wires", ["Full of wires", "Made of wire", "A tiny wire"]),
      explanation: 'The suffix "-less" means without, so wireless means without wires.',
      band: 2,
    },
    {
      id: "ixl-ela-suffix-ful",
      skills: ["LANG-EN-WORD-PARTS"],
      prompt: 'Which pair of words BOTH use the suffix "-ful" to mean "full of"?',
      answer: choices("ixl-ela-suffix-ful", "Careful and cheerful", ["Colorful and fell", "Helpful and full", "Playful and pull"]),
      explanation: 'Careful (full of care) and cheerful (full of cheer) both add "-ful" to a base word.',
      band: 3,
    },
    {
      id: "ixl-ela-analogy-car",
      skills: ["LANG-EN-WORD-PARTS", "LOGIC-ANALOGY"],
      prompt: "Handlebars are to a bicycle as a steering wheel is to a ___.",
      hint: "What do handlebars do for a bicycle? What vehicle uses a steering wheel the same way?",
      answer: choices("ixl-ela-analogy-car", "Car", ["Road", "Helmet", "Garage"]),
      explanation: "Handlebars steer a bicycle, and a steering wheel steers a car.",
      band: 2,
    },
    {
      id: "ixl-ela-analogy-pilot",
      skills: ["LANG-EN-WORD-PARTS", "LOGIC-ANALOGY"],
      prompt: "Pilot is to airplane as captain is to ___.",
      answer: choices("ixl-ela-analogy-pilot", "Ship", ["Ocean", "Compass", "Anchor"]),
      explanation: "A pilot is in charge of an airplane, and a captain is in charge of a ship.",
      band: 3,
    },
    {
      id: "ixl-ela-analogy-clock",
      skills: ["LANG-EN-WORD-PARTS", "LOGIC-ANALOGY"],
      prompt: "Ruler is to length as clock is to ___.",
      hint: "Think about what each tool measures.",
      answer: choices("ixl-ela-analogy-clock", "Time", ["Numbers", "Hands", "Wall"]),
      explanation: "A ruler measures length, and a clock measures time.",
      band: 3,
    },
  ];
}

/** ELA 300+: Lexile 320L-470L independent passages + choosing reasons to support an opinion (IXL CXD). */
function readingAndEvidence(): Draft[] {
  const electricCars =
    "Electric cars run on big batteries instead of burning gas. Because they have no tailpipe, they do not puff exhaust smoke into the street. Their motors are very quiet, so some electric cars play a gentle hum at low speeds to help walkers hear them coming. Drivers charge them at home overnight or at fast charging stations along the highway.";
  const pitCrew =
    "During a Formula 1 race, a car pulls into the pit lane for fresh tires. More than twenty crew members wait in exact spots. One lifts the front of the car with a jack, while others remove the old wheels and lock on new ones with fast air guns. When all four tires are tight, a green light flashes and the driver zooms back out in about two seconds.";
  const bridges =
    "Engineers love using triangles when they build bridges. If you push on the corner of a square made of sticks, it can lean over into a slanted shape. A triangle cannot lean unless a stick breaks, because its three sides lock each other in place. That is why many metal train bridges are full of triangle frames called trusses.";
  const robots =
    "A delivery robot rolls along sidewalks to bring groceries to people's doors. Cameras and sensors help it spot curbs, bikes and puddles before it gets too close. If a path is blocked, the robot pauses and plans a new route around the obstacle. People unlock the lid with a code on their phone when the robot arrives.";

  return [
    {
      id: "ixl-read-ev-why-hum",
      skills: ["LANG-EN-READ-DETAIL"],
      passage: electricCars,
      prompt: "Why do some electric cars play a gentle hum at low speeds?",
      answer: choices("ixl-read-ev-why-hum", "So walkers can hear them coming", ["To charge the battery faster", "Because the engine is broken", "To scare birds off the highway"]),
      explanation: "The passage says electric motors are very quiet, so some play a gentle hum at low speeds to help walkers hear them coming.",
      band: 2,
    },
    {
      id: "ixl-read-ev-opinion",
      skills: ["LANG-EN-OPINION-EVIDENCE"],
      passage: electricCars,
      prompt: 'Maya says, "Electric cars help keep city air cleaner." Which reason from the passage best supports her opinion?',
      hint: "Look for a sentence about air or smoke.",
      answer: choices(
        "ixl-read-ev-opinion",
        "They have no tailpipe and do not puff exhaust smoke into the street",
        ["Drivers can charge them overnight at home", "Some play a gentle hum at low speeds", "They have big batteries"],
      ),
      explanation: "Not puffing exhaust smoke into the street directly explains why electric cars help keep city air cleaner.",
      band: 3,
    },
    {
      id: "ixl-read-pit-opinion",
      skills: ["LANG-EN-OPINION-EVIDENCE"],
      passage: pitCrew,
      prompt: 'Leo says, "A Formula 1 pit stop needs careful teamwork." Which detail best supports his opinion?',
      answer: choices(
        "ixl-read-pit-opinion",
        "Over twenty crew members wait in exact spots and work together to finish in about two seconds",
        ["The car drives down the pit lane", "A green light flashes at the end", "The old tires are removed"],
      ),
      explanation: "Over twenty people doing exact jobs together in two seconds is strong evidence of careful teamwork.",
      band: 3,
    },
    {
      id: "ixl-read-pit-infer",
      skills: ["LANG-EN-READ-INFER"],
      passage: pitCrew,
      prompt: "Why does the driver wait for the green light before zooming out?",
      answer: choices("ixl-read-pit-infer", "To make sure all four tires are tight and safe first", ["Because the track is closed", "To let the engine cool down", "Because it is raining"]),
      explanation: "The passage says the green light flashes once all four tires are tight, telling the driver it is safe to leave.",
      band: 3,
    },
    {
      id: "ixl-read-bridge-opinion",
      skills: ["LANG-EN-OPINION-EVIDENCE"],
      passage: bridges,
      prompt: 'Ava says, "Triangles are stronger than squares for building bridge frames." Which reason from the passage best supports her opinion?',
      answer: choices(
        "ixl-read-bridge-opinion",
        "A square can lean over when pushed, but a triangle's three sides lock each other in place",
        ["Many train bridges are made of metal", "Triangle frames are called trusses", "Engineers enjoy drawing shapes"],
      ),
      explanation: "The passage explains that pushing a square makes it lean, while a triangle's sides lock in place so it stays rigid.",
      band: 3,
    },
    {
      id: "ixl-read-robot-opinion",
      skills: ["LANG-EN-OPINION-EVIDENCE"],
      passage: robots,
      prompt: 'Sam says, "Delivery robots are built to travel safely on busy sidewalks." Which reason best supports his opinion?',
      answer: choices(
        "ixl-read-robot-opinion",
        "Cameras and sensors help it spot curbs, bikes and puddles and go around blocked paths",
        ["People unlock the lid with a phone code", "It carries groceries to doors", "It rolls on wheels"],
      ),
      explanation: "Spotting hazards with cameras and sensors and planning around blocked paths directly supports the claim that it travels safely.",
      band: 3,
    },
    {
      id: "ixl-read-opinion-robotics",
      skills: ["LANG-EN-OPINION-EVIDENCE"],
      prompt: 'Opinion: "Every elementary school should have a robotics club." Which reason BEST supports this opinion?',
      hint: "Pick the reason that explains a real benefit of a robotics club, not just a random fact.",
      answer: choices(
        "ixl-read-opinion-robotics",
        "Students learn to solve problems step by step and work together as a team",
        ["Robots are often painted blue or gray", "Some schools have red brick walls", "Recess happens after lunch"],
      ),
      explanation: "Learning step-by-step problem solving and teamwork is a strong, relevant reason to have a robotics club.",
      band: 3,
    },
    {
      id: "ixl-read-opinion-helmets",
      skills: ["LANG-EN-OPINION-EVIDENCE"],
      prompt: 'Opinion: "Kids should always wear a helmet when riding a bike." Which reason BEST supports this opinion?',
      answer: choices(
        "ixl-read-opinion-helmets",
        "A helmet protects your head if you fall off the bike",
        ["Bicycles have two pedals and a chain", "Helmets come in lots of cool colors", "Some parks have smooth bike trails"],
      ),
      explanation: "Protecting your head during a fall directly explains why wearing a helmet matters.",
      band: 2,
    },
  ];
}

export const ixlTargetedQuestions = (): Question[] =>
  [
    ...compareRulers(),
    ...barGraphsTwo(),
    ...analogDigitalClocks(),
    ...roundingNumberLine(),
    ...equivalentFractions(),
    ...quadrilaterals(),
    ...multAndDivide(),
    ...wordPartsAndAnalogies(),
    ...readingAndEvidence(),
  ].map((d) => question(FILE, d));
