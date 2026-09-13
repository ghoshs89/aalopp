import type { Question } from "../../src/content/schema";
import { assert, choices, numeric, question, type Draft } from "./helpers";
import { latinSolutions, permutations } from "./logic";

const FILE = "batch2.ts";
const INK = "#1d2f4b";
const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

function multiplication(): Draft[] {
  const words: [string, number, number, string, string, 2 | 3 | 4][] = [
    ["b2m-wheels-on-cars", 6, 4, "Each toy car has 4 wheels. How many wheels do 6 cars have?", "wheels", 3],
    ["b2m-soccer-teams-seven", 3, 7, "There are 3 soccer teams with 7 players each. How many players are there?", "players", 3],
    ["b2m-chess-boards-pieces", 5, 8, "Each chess set has 8 white pawns. How many white pawns are in 5 sets?", "white pawns", 4],
    ["b2m-race-laps", 4, 9, "A race car drives 9 laps every day for 4 days. How many laps is that?", "laps", 4],
  ];
  const drafts: Draft[] = words.map(([id, a, b, prompt, unit, band]) => ({
    id,
    skills: ["MATH-OA-MULT", "MATH-OA-EQUAL-GROUPS"],
    prompt,
    answer: numeric(a * b, unit),
    explanation: `That is ${a} groups of ${b}, or ${a} × ${b}. Count by ${b}s ${a} times: ${Array.from({ length: a }, (_, i) => (i + 1) * b).join(", ")}. The answer is ${a * b}.`,
    band,
  }));
  drafts.push(
    {
      id: "b2m-match-the-array",
      skills: ["MATH-OA-MULT", "MATH-OA-ARRAYS"],
      prompt: "Which multiplication matches the picture?",
      visual: { kind: "grid", rows: Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => "🏎️")) },
      answer: choices("b2m-match-the-array", "3 × 5", ["3 + 5", "5 × 5", "3 × 3"]),
      explanation: "There are 3 rows with 5 race cars in each row. 3 rows of 5 is 3 × 5, which makes 15.",
      band: 3,
    },
    {
      id: "b2m-missing-factor",
      skills: ["MATH-OA-MULT", "MATH-OA-UNKNOWN"],
      prompt: "What number goes in the box? 4 × ☐ = 28",
      speech: "4 times what number equals 28?",
      answer: numeric(28 / 4),
      explanation: "Count by 4s until you reach 28: 4, 8, 12, 16, 20, 24, 28. That took 7 fours, so the missing number is 7.",
      band: 4,
    },
    {
      id: "b2m-times-ten",
      skills: ["MATH-OA-MULT", "MATH-NBT-PLACE-VALUE"],
      prompt: "A pack has 10 stickers. How many stickers are in 6 packs?",
      answer: numeric(6 * 10, "stickers"),
      explanation: "6 packs of 10 is 6 tens, and 6 tens is 60.",
      band: 3,
    },
    {
      id: "b2m-order-does-not-matter",
      skills: ["MATH-OA-MULT"],
      prompt: "7 × 3 = 21. What is 3 × 7?",
      answer: choices("b2m-order-does-not-matter", 21, [10, 37, 73]),
      explanation: "Turning an array sideways does not change how many things are in it. 7 rows of 3 and 3 rows of 7 both have 21.",
      band: 3,
    },
  );
  return drafts;
}

function division(): Draft[] {
  return [
    {
      id: "b2d-share-cars",
      skills: ["MATH-OA-DIVIDE", "MATH-OA-EQUAL-GROUPS"],
      prompt: "24 toy cars are shared equally between 4 friends. How many cars does each friend get?",
      answer: numeric(24 / 4, "cars"),
      explanation: "Think: 4 times what makes 24? Count by 4s: 4, 8, 12, 16, 20, 24. That is 6 fours, so each friend gets 6 cars.",
      band: 3,
    },
    {
      id: "b2d-groups-of-three",
      skills: ["MATH-OA-DIVIDE"],
      prompt: "21 soccer players get into teams of 3. How many teams are there?",
      answer: numeric(21 / 3, "teams"),
      explanation: "Count by 3s until you reach 21: 3, 6, 9, 12, 15, 18, 21. That is 7 threes, so there are 7 teams.",
      band: 3,
    },
    {
      id: "b2d-full-boxes-leftover",
      skills: ["MATH-OA-DIVIDE"],
      prompt: "Cookies are packed 6 to a box. There are 20 cookies. How many boxes can be filled all the way?",
      answer: numeric(Math.floor(20 / 6), "boxes"),
      explanation: "Count by 6s: 6, 12, 18. The next box would need 24 cookies, which is more than 20. So 3 boxes are full, and 2 cookies are left over.",
      band: 5,
    },
    {
      id: "b2d-seats-in-vans",
      skills: ["MATH-OA-DIVIDE"],
      prompt: "A van holds 5 children. 23 children are going on a trip. How many vans are needed so everyone can go?",
      answer: numeric(Math.ceil(23 / 5), "vans"),
      explanation: "4 vans hold 4 × 5 = 20 children, which leaves 3 children without a seat. They need one more van, so 5 vans.",
      band: 5,
    },
    {
      id: "b2d-fact-family",
      skills: ["MATH-OA-DIVIDE", "MATH-OA-MULT"],
      prompt: "8 × 5 = 40. What is 40 ÷ 5?",
      speech: "8 times 5 equals 40. What is 40 divided by 5?",
      answer: choices("b2d-fact-family", 8, [5, 35, 45]),
      explanation: "Division undoes multiplication. If 8 groups of 5 make 40, then 40 split into groups of 5 makes 8 groups.",
      band: 4,
    },
  ];
}

/** A shape split into equal parts with some parts shaded. */
function fractionSvg(kind: "bar" | "circle", parts: number, shaded: number): string {
  if (kind === "bar") {
    const w = 240;
    const step = w / parts;
    const cells = Array.from({ length: parts }, (_, i) => `<rect x="${10 + i * step}" y="10" width="${step}" height="60" fill="${i < shaded ? "#2878e3" : "#ffffff"}" stroke="${INK}" stroke-width="3"/>`).join("");
    return svg(260, 80, cells);
  }
  const r = 60;
  const c = 70;
  const slices = Array.from({ length: parts }, (_, i) => {
    const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    const p = (a: number) => `${(c + r * Math.cos(a)).toFixed(1)} ${(c + r * Math.sin(a)).toFixed(1)}`;
    return `<path d="M ${c} ${c} L ${p(a0)} A ${r} ${r} 0 ${parts === 1 ? 1 : 0} 1 ${p(a1)} Z" fill="${i < shaded ? "#2878e3" : "#ffffff"}" stroke="${INK}" stroke-width="3"/>`;
  }).join("");
  return svg(140, 140, slices);
}

function fractions(): Draft[] {
  const name = (n: number) => ({ 2: "half", 3: "third", 4: "quarter" })[n as 2 | 3 | 4];
  const shaded: [string, "bar" | "circle", number, 2 | 3][] = [
    ["b2f-bar-one-quarter", "bar", 4, 2],
    ["b2f-circle-one-third", "circle", 3, 2],
    ["b2f-bar-one-half", "bar", 2, 2],
  ];
  const drafts: Draft[] = shaded.map(([id, kind, parts, band]) => ({
    id,
    skills: ["MATH-NF-FRACTIONS"],
    prompt: `The ${kind === "bar" ? "bar" : "circle"} is cut into equal parts. What fraction is shaded blue?`,
    visual: { kind: "svg", alt: `A ${kind} split into ${parts} equal parts with 1 part shaded.`, svg: fractionSvg(kind, parts, 1) },
    answer: choices(id, `One ${name(parts)}`, ["One half", "One third", "One quarter"].filter((c) => c !== `One ${name(parts)}`).concat([`${parts} parts`])),
    explanation: `There are ${parts} equal parts and 1 is shaded, so 1 out of ${parts} is shaded. That is one ${name(parts)}.`,
    band,
  }));
  drafts.push(
    {
      id: "b2f-three-quarters",
      skills: ["MATH-NF-FRACTIONS"],
      prompt: "The bar is cut into 4 equal parts. How many quarters are shaded?",
      visual: { kind: "svg", alt: "A bar split into 4 equal parts with 3 parts shaded.", svg: fractionSvg("bar", 4, 3) },
      answer: choices("b2f-three-quarters", "3 quarters", ["1 quarter", "4 quarters", "3 halves"]),
      explanation: "Each part is one quarter because there are 4 equal parts. 3 parts are shaded, so 3 quarters are shaded.",
      band: 3,
    },
    {
      id: "b2f-half-of-twelve",
      skills: ["MATH-NF-FRACTIONS", "MATH-OA-EQUAL-GROUPS"],
      prompt: "There are 12 cars in the parking lot. Half of them are red. How many cars are red?",
      answer: numeric(12 / 2, "cars"),
      explanation: "Half means 2 equal groups. 12 split into 2 equal groups is 6 and 6, so 6 cars are red.",
      band: 3,
    },
    {
      id: "b2f-third-of-nine",
      skills: ["MATH-NF-FRACTIONS", "MATH-OA-DIVIDE"],
      prompt: "Maya has 9 stickers. She gives away one third of them. How many stickers does she give away?",
      answer: numeric(9 / 3, "stickers"),
      explanation: "One third means 1 of 3 equal groups. 9 split into 3 equal groups is 3, 3 and 3, so she gives away 3.",
      band: 4,
    },
    {
      id: "b2f-bigger-slice",
      skills: ["MATH-NF-FRACTIONS"],
      prompt: "Two pizzas are the same size. Sam eats one half of his pizza. Mia eats one quarter of hers. Who eats more pizza?",
      answer: choices("b2f-bigger-slice", "Sam", ["Mia", "They eat the same"]),
      explanation: "Cutting a pizza into 2 pieces makes bigger pieces than cutting the same pizza into 4 pieces. One half is more than one quarter, so Sam eats more.",
      band: 4,
    },
    {
      id: "b2f-not-equal-parts",
      skills: ["MATH-NF-FRACTIONS", "MATH-GEO-SHAPES"],
      prompt: "Leo says the shaded part is one half. Is he right?",
      visual: {
        kind: "svg",
        alt: "A bar split into 2 parts that are not equal: a small shaded part on the left and a big white part on the right.",
        svg: svg(260, 80, `<rect x="10" y="10" width="70" height="60" fill="#2878e3" stroke="${INK}" stroke-width="3"/><rect x="80" y="10" width="170" height="60" fill="#ffffff" stroke="${INK}" stroke-width="3"/>`),
      },
      answer: choices("b2f-not-equal-parts", "No, the 2 parts are not equal", ["Yes, there are 2 parts", "Yes, one part is shaded"]),
      explanation: "A half is 1 of 2 equal parts. These 2 parts are not the same size, so the shaded part is not a half. It is less than half.",
      band: 4,
    },
  );
  return drafts;
}

function areaPerimeter(): Draft[] {
  // Touching squares, so the picture reads as one rectangle covered by unit squares.
  const block = (w: number, h: number) => ({
    kind: "svg" as const,
    alt: `A rectangle ${w} squares long and ${h} squares wide, covered by ${w * h} equal squares.`,
    svg: svg(
      w * 40 + 20,
      h * 40 + 20,
      Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => `<rect x="${10 + c * 40}" y="${10 + r * 40}" width="40" height="40" fill="#b7d3f6" stroke="${INK}" stroke-width="2"/>`).join("")).join(""),
    ),
  });
  const rectSvg = (w: number, h: number, unit: string) =>
    svg(
      280,
      190,
      `<rect x="50" y="30" width="${w * 30}" height="${h * 30}" fill="#fff4c9" stroke="${INK}" stroke-width="4"/>` +
        `<text x="${50 + (w * 30) / 2}" y="20" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="${INK}">${w} ${unit}</text>` +
        `<text x="${40}" y="${30 + (h * 30) / 2}" text-anchor="end" dominant-baseline="central" font-family="sans-serif" font-size="16" font-weight="700" fill="${INK}">${h} ${unit}</text>`,
    );
  const perims: [string, number, number, 3 | 4][] = [
    ["b2a-perimeter-garden", 6, 3, 4],
    ["b2a-perimeter-rug", 5, 4, 4],
  ];
  const drafts: Draft[] = [
    ...([
      ["b2a-area-count-4x3", 4, 3, 3],
      ["b2a-area-count-5x2", 5, 2, 3],
    ] as const).map(([id, w, h, band]) => ({
      id,
      skills: ["MATH-MD-AREA-PERIMETER", "MATH-OA-ARRAYS"],
      prompt: "Area is how many squares cover a shape. What is the area of this rectangle, in squares?",
      visual: block(w, h),
      answer: numeric(w * h, "squares"),
      explanation: `There are ${h} rows with ${w} squares in each row. ${Array.from({ length: h }, () => w).join(" + ")} = ${w * h}, so the area is ${w * h} squares.`,
      band,
    })),
    ...perims.map(([id, w, h, band]) => ({
      id,
      skills: ["MATH-MD-AREA-PERIMETER", "MATH-OA-ADD-SUB"],
      prompt: "Perimeter is the distance all the way around a shape. What is the perimeter of this rectangle?",
      visual: { kind: "svg" as const, alt: `A rectangle ${w} meters long and ${h} meters wide.`, svg: rectSvg(w, h, "m") },
      answer: numeric(2 * (w + h), "meters"),
      explanation: `A rectangle has 4 sides: two long sides of ${w} and two short sides of ${h}. ${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} meters.`,
      band,
    })),
    {
      id: "b2a-square-perimeter",
      skills: ["MATH-MD-AREA-PERIMETER", "MATH-OA-MULT"],
      prompt: "A square sticker has sides that are 7 centimeters long. What is its perimeter?",
      answer: numeric(4 * 7, "centimeters"),
      explanation: "All 4 sides of a square are the same length. 7 + 7 + 7 + 7 = 28, or 4 × 7 = 28 centimeters.",
      band: 4,
    },
    {
      id: "b2a-same-area-different-shape",
      skills: ["MATH-MD-AREA-PERIMETER", "MATH-OA-ARRAYS"],
      prompt: "A rectangle is 6 squares by 2 squares. Which other rectangle covers the same number of squares?",
      answer: choices("b2a-same-area-different-shape", "4 squares by 3 squares", ["6 squares by 3 squares", "4 squares by 4 squares", "8 squares by 2 squares"]),
      explanation: "The first rectangle covers 6 × 2 = 12 squares. 4 × 3 is also 12. The others cover 18, 16 and 16 squares.",
      band: 5,
    },
  ];
  return drafts;
}

function harderLogic(): Draft[] {
  // Five racers, clues checked by trying every possible order.
  const racers = ["Red", "Blue", "Green", "Yellow", "White"];
  const orders = permutations(racers).filter(
    (o) =>
      o.indexOf("White") === 2 &&
      o.indexOf("Red") > o.indexOf("Blue") &&
      o.indexOf("Blue") === o.indexOf("Green") + 1 &&
      o.indexOf("Yellow") === 4,
  );
  assert(orders.length === 1, `five-car race must have one order, found ${orders.length}`);
  const race = orders[0];

  const sudoku = [
    ["2", null, null, "3"],
    [null, "3", null, null],
    [null, null, "4", null],
    ["4", null, null, "2"],
  ];
  const solutions = latinSolutions(sudoku, ["1", "2", "3", "4"]);
  assert(solutions.length === 1, `4x4 puzzle must have one solution, found ${solutions.length}`);
  const q = solutions[0][1][2];

  const arrangements = permutations(["🚗", "🚕", "🚙"]).length;
  const people = ["Ann", "Ben", "Cal", "Dee"];
  const handshakes = people.flatMap((p, i) => people.slice(i + 1).map((o) => `${p}-${o}`)).length;
  const outfits = 3 * 2;
  const squares = [1, 4, 9, 16];

  return [
    {
      id: "b2l-five-car-race",
      skills: ["LOGIC-ORDER"],
      prompt: "Five toy cars had a race. White finished in the middle. Yellow finished last. Blue finished right behind Green. Red finished after Blue. Which car won?",
      answer: choices("b2l-five-car-race", race[0], racers.filter((r) => r !== race[0])),
      explanation: `White is 3rd and Yellow is 5th, so spots 1, 2 and 4 are left for Red, Green and Blue. Green and Blue must be next to each other, and the only two spots next to each other are 1 and 2, so Green is 1st and Blue is 2nd. Red takes 4th. The order is ${race.join(", ")}, so ${race[0]} won.`,
      band: 5,
    },
    {
      id: "b2l-four-by-four-hard",
      skills: ["LOGIC-GRID"],
      prompt: "Every row and every column needs the numbers 1, 2, 3 and 4 once each. What number goes in the box with the question mark?",
      visual: { kind: "grid", rows: sudoku.map((r, i) => r.map((x, j) => (i === 1 && j === 2 ? "?" : (x ?? " ")))), highlight: { row: 1, col: 2 } },
      answer: choices("b2l-four-by-four-hard", q, ["1", "2", "3", "4"]),
      explanation: `Fill in the boxes that have only one choice first. When the grid is finished, the second row is ${solutions[0][1].join(", ")}, so the question mark is ${q}.`,
      band: 5,
    },
    {
      id: "b2l-arrange-three-cars",
      skills: ["LOGIC-COUNT-WAYS"],
      prompt: "In how many different orders can a red car, a taxi and a blue car park in a row of 3 spaces?",
      visual: { kind: "emoji", lines: ["🚗 🚕 🚙"] },
      answer: numeric(arrangements, "orders"),
      explanation: "Any of the 3 cars can park first. Then 2 cars are left for the second space, and 1 for the last. 3 × 2 × 1 = 6 orders. You can list them: red taxi blue, red blue taxi, taxi red blue, taxi blue red, blue red taxi, blue taxi red.",
      band: 4,
    },
    {
      id: "b2l-handshakes-four",
      skills: ["LOGIC-COUNT-WAYS"],
      prompt: "Ann, Ben, Cal and Dee meet. Every person shakes hands with every other person once. How many handshakes are there?",
      answer: numeric(handshakes, "handshakes"),
      explanation: "Ann shakes 3 hands. Ben already shook Ann's, so he shakes 2 new hands. Cal shakes 1 new hand (Dee). Dee has shaken everyone. 3 + 2 + 1 = 6 handshakes.",
      band: 5,
    },
    {
      id: "b2l-jersey-outfits",
      skills: ["LOGIC-COUNT-WAYS", "MATH-OA-MULT"],
      prompt: "A soccer player has 3 shirts and 2 pairs of shorts. How many different shirt and shorts outfits can she make?",
      answer: numeric(outfits, "outfits"),
      explanation: "Each of the 3 shirts can go with either of the 2 pairs of shorts. That is 3 groups of 2, or 3 × 2 = 6 outfits.",
      band: 4,
    },
    {
      id: "b2l-square-numbers-pattern",
      skills: ["LOGIC-PATTERN", "MATH-OA-ARRAYS"],
      prompt: "Squares are made from dots: 1 dot, then 4 dots, then 9 dots, then 16 dots. How many dots are in the next square?",
      visual: {
        kind: "svg",
        alt: "Four squares of dots: 1 dot, 2 by 2 dots, 3 by 3 dots and 4 by 4 dots.",
        svg: svg(
          330,
          110,
          [1, 2, 3, 4]
            .map((n, k) => {
              const x0 = [14, 56, 122, 214][k];
              return Array.from({ length: n * n }, (_, i) => `<circle cx="${x0 + (i % n) * 20 + 8}" cy="${20 + Math.floor(i / n) * 20}" r="7" fill="${INK}"/>`).join("");
            })
            .join(""),
        ),
      },
      answer: numeric(25, "dots"),
      explanation: `The squares are 1 by 1, 2 by 2, 3 by 3 and 4 by 4 (${squares.join(", ")} dots). The next is 5 by 5, which is 5 × 5 = 25 dots.`,
      band: 5,
    },
  ];
}

function moreBugs(): Draft[] {
  const bug = (id: string, skills: string[], solver: string, task: string, steps: string[], bugIndex: number, fix: string, right: string, band: 3 | 4): Draft => {
    assert(steps[bugIndex] !== fix && new Set(steps).size === steps.length, `${id}: invalid bug`);
    return {
      id,
      skills: ["CS-DEBUG", ...skills],
      prompt: `${solver} worked out ${task}. One step has a mistake. Tap the first step that is wrong.`,
      answer: { type: "findTheBug", solver, steps, bugIndex, fix },
      explanation: `Step ${bugIndex + 1} should say: ${fix}${bugIndex < steps.length - 1 ? " Any step after it that used the mistake is wrong too." : ""} The right answer is ${right}.`,
      band,
    };
  };
  return [
    bug("b2b-times-as-plus", ["MATH-OA-MULT"], "Zoe", "how many wheels 4 bikes have", ["Each bike has 2 wheels.", "There are 4 bikes.", "4 bikes with 2 wheels each is 4 + 2 = 6 wheels."], 2, `4 bikes with 2 wheels each is 4 × 2 = ${4 * 2} wheels.`, `${4 * 2} wheels`, 3),
    bug("b2b-bigger-number-bigger-piece", ["MATH-NF-FRACTIONS"], "Kai", "which is bigger, one half or one quarter of the same sandwich", ["One half means 1 of 2 equal pieces.", "One quarter means 1 of 4 equal pieces.", "4 is bigger than 2, so a quarter is the bigger piece."], 2, "Cutting into 4 pieces makes smaller pieces than cutting into 2, so a half is the bigger piece.", "one half", 4),
    bug("b2b-perimeter-two-sides", ["MATH-MD-AREA-PERIMETER"], "Noah", "the perimeter of a rectangle 5 meters long and 3 meters wide", ["A rectangle has 4 sides.", "The long sides are 5 meters and the short sides are 3 meters.", "Add the sides: 5 + 3 = 8 meters."], 2, `Add all 4 sides: 5 + 3 + 5 + 3 = ${2 * (5 + 3)} meters.`, `${2 * (5 + 3)} meters`, 4),
    bug("b2b-area-as-perimeter", ["MATH-MD-AREA-PERIMETER"], "Lily", "the area of a rectangle 4 squares long and 3 squares wide", ["Area is how many squares cover the shape.", "There are 3 rows of 4 squares.", "Add the sides: 4 + 3 + 4 + 3 = 14 squares."], 2, `Add the rows: 4 + 4 + 4 = ${4 * 3} squares.`, `${4 * 3} squares`, 4),
    bug("b2b-share-wrong-count", ["MATH-OA-DIVIDE"], "Sam", "how many cars each of 3 friends gets when sharing 18 cars", ["Share 18 cars equally between 3 friends.", "Count by 3s: 3, 6, 9, 12, 15, 18.", "That is 5 threes, so each friend gets 5 cars."], 2, `That is ${18 / 3} threes, so each friend gets ${18 / 3} cars.`, `${18 / 3} cars`, 4),
    bug("b2b-handshakes-double", ["LOGIC-COUNT-WAYS"], "Mia", "how many handshakes 3 friends make if each pair shakes once", ["Each of the 3 friends shakes hands with 2 others.", "3 × 2 = 6.", "So there are 6 handshakes."], 2, `Each handshake was counted twice, once for each person, so there are 6 ÷ 2 = ${3} handshakes.`, "3 handshakes", 4),
  ];
}

export const batch2Questions = (): Question[] =>
  [...multiplication(), ...division(), ...fractions(), ...areaPerimeter(), ...harderLogic(), ...moreBugs()].map((d) => question(FILE, d));
