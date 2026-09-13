import type { Question } from "../../src/content/schema";
import { assert, choices, numeric, question, type Draft } from "./helpers";

const FILE = "numbers.ts";

function tallySvg(groups: number[]): string {
  let x = 16;
  let body = "";
  for (const size of groups) {
    const start = x;
    for (let i = 0; i < Math.min(size, 4); i++, x += 16) body += `<line x1="${x}" y1="14" x2="${x}" y2="76" stroke="#1d2f4b" stroke-width="5" stroke-linecap="round"/>`;
    if (size === 5) body += `<line x1="${start - 8}" y1="66" x2="${x - 8}" y2="24" stroke="#d84957" stroke-width="5" stroke-linecap="round"/>`;
    x += 22;
  }
  return `<svg viewBox="0 0 ${x} 90" width="${x}" height="90" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

function counting(): Draft[] {
  const rows = (icon: string, sizes: number[]) => sizes.map((n) => icon.repeat(n));
  const items: [string, string, number[], string, 1 | 2 | 3][] = [
    ["nco-soccer-balls-fives", "⚽", [5, 5, 3], "How many soccer balls are there? The rows can help you count.", 1],
    ["nco-cars-tens", "🚗", [10, 10, 4], "How many cars are in the parking lot? Each full row has 10.", 2],
    ["nco-stars-pairs", "⭐", [2, 2, 2, 2, 2, 1], "How many stars are there? Try counting by 2s.", 1],
  ];
  const drafts: Draft[] = items.map(([id, icon, sizes, prompt, band]) => {
    const total = sizes.reduce((a, b) => a + b, 0);
    let running = 0;
    return {
      id,
      skills: ["MATH-NBT-COUNTING", "MATH-NBT-SKIP-COUNT"],
      prompt,
      visual: { kind: "emoji", lines: rows(icon, sizes) },
      answer: numeric(total),
      explanation: `Count one row at a time and keep a running total: ${sizes.map((n) => (running += n)).join(", ")}. There are ${total}.`,
      band,
    };
  });
  drafts.push({
    id: "nco-tally-marks",
    skills: ["MATH-NBT-COUNTING", "MATH-MD-PICTURE-GRAPH"],
    prompt: "Tally marks are drawn in groups of 5: four marks, then a fifth mark across them. How many cars do these tally marks count?",
    visual: { kind: "svg", alt: "Tally marks: two groups of five, each with four lines crossed by a fifth, then three more lines.", svg: tallySvg([5, 5, 3]) },
    answer: numeric(2 * 5 + 3, "cars"),
    explanation: "Each full group is 5. Two groups make 10. Three more marks make 11, 12, 13. The tally shows 13 cars.",
    band: 2,
  });
  return drafts;
}

function skipCounting(): Draft[] {
  const items: [string, number[], number, 1 | 2 | 3 | 4, string][] = [
    ["nsc-by-twos", [14, 16, 18, 20], 2, 1, "Count by 2s. Which number is missing?"],
    ["nsc-by-fives", [35, 40, 45, 50], 3, 1, "Count by 5s. Which number comes next?"],
    ["nsc-by-tens", [70, 80, 90, 100], 2, 1, "Count by 10s. Which number is missing?"],
    ["nsc-back-by-fives", [60, 55, 50, 45], 2, 2, "Count backwards by 5s. Which number is missing?"],
    ["nsc-by-threes", [3, 6, 9, 12, 15], 3, 3, "These numbers go up by the same amount each time. Which number is missing?"],
    ["nsc-by-quarters", [25, 50, 75, 100], 3, 2, "Count by 25s, like counting quarters. Which number comes next?"],
  ];
  return items.map(([id, seq, hide, band, prompt]) => {
    const step = seq[1] - seq[0];
    const cells = seq.map((n, i) => (i === hide ? "?" : String(n)));
    const answer = seq[hide];
    const sign = step > 0 ? "+" : "-";
    return {
      id,
      skills: ["MATH-NBT-SKIP-COUNT"],
      prompt,
      visual: { kind: "grid", rows: [cells], highlight: { row: 0, col: hide } },
      answer: numeric(answer),
      explanation: `Each number is ${Math.abs(step)} ${step > 0 ? "more" : "less"} than the one before it. ${seq[hide - 1]} ${sign} ${Math.abs(step)} = ${answer}.`,
      band,
    };
  });
}

function oddEven(): Draft[] {
  const isEven = (n: number) => n % 2 === 0;
  const oddPick = [14, 22, 37, 50];
  const evenPick = [9, 15, 28, 33];
  const between = Array.from({ length: 19 - 11 - 1 }, (_, i) => 12 + i).filter(isEven);
  const jerseys: [string, number][] = [["Maya", 8], ["Leo", 12], ["Sam", 7], ["Ava", 20]];
  const redPlayer = jerseys.filter(([, n]) => !isEven(n));
  assert(oddPick.filter((n) => !isEven(n)).length === 1 && evenPick.filter(isEven).length === 1 && redPlayer.length === 1, "exactly one match");
  return [
    {
      id: "noe-which-is-odd",
      skills: ["MATH-NBT-ODD-EVEN"],
      prompt: `Which number is odd?`,
      answer: choices("noe-which-is-odd", oddPick.find((n) => !isEven(n))!, oddPick.filter(isEven)),
      explanation: "Look at the ones digit. Numbers ending in 1, 3, 5, 7 or 9 are odd. 37 ends in 7, so it is odd. The others end in 0, 2 or 4, so they are even.",
      band: 1,
    },
    {
      id: "noe-which-is-even",
      skills: ["MATH-NBT-ODD-EVEN"],
      prompt: "Which number is even?",
      answer: choices("noe-which-is-even", evenPick.find(isEven)!, evenPick.filter((n) => !isEven(n))),
      explanation: "Even numbers end in 0, 2, 4, 6 or 8. 28 ends in 8, so it is even.",
      band: 1,
    },
    {
      id: "noe-socks-in-pairs",
      skills: ["MATH-NBT-ODD-EVEN"],
      prompt: "Can you put 7 soccer socks into pairs with none left over?",
      visual: { kind: "emoji", lines: ["🧦🧦🧦🧦🧦🧦🧦"] },
      answer: choices("noe-socks-in-pairs", "No, one sock is left over", ["Yes, they all make pairs"]),
      explanation: "Make pairs: 2, 4, 6. That uses 6 socks, and 1 sock has no partner. 7 is an odd number, and odd numbers always have one left over.",
      band: 1,
    },
    {
      id: "noe-red-jersey",
      skills: ["MATH-NBT-ODD-EVEN"],
      prompt: `Players with odd jersey numbers wear red. ${jerseys.map(([name, n]) => `${name} is number ${n}`).join(", ")}. Who wears red?`,
      answer: choices("noe-red-jersey", redPlayer[0][0], jerseys.map(([name]) => name)),
      explanation: `${redPlayer[0][0]} is number ${redPlayer[0][1]}, which is odd. ${jerseys.filter(([, n]) => isEven(n)).map(([, n]) => n).join(", ")} are all even.`,
      band: 2,
    },
    {
      id: "noe-odd-plus-odd",
      skills: ["MATH-NBT-ODD-EVEN", "MATH-OA-ADD-SUB"],
      prompt: "3 and 5 are both odd. Is 3 + 5 odd or even?",
      answer: choices("noe-odd-plus-odd", isEven(3 + 5) ? "Even" : "Odd", ["Odd", "Even"]),
      explanation: "3 + 5 = 8, and 8 is even. Try it with dots: the extra dot from 3 and the extra dot from 5 make a pair. Odd plus odd is always even.",
      band: 3,
    },
    {
      id: "noe-evens-between",
      skills: ["MATH-NBT-ODD-EVEN"],
      prompt: "How many even numbers are there between 11 and 19?",
      answer: numeric(between.length),
      explanation: `The numbers between 11 and 19 are 12 to 18. The even ones are ${between.join(", ")}. That is ${between.length}.`,
      band: 3,
    },
  ];
}

function placeValue(): Draft[] {
  const cards = [4, 0, 7];
  const largest = Number([...cards].sort((a, b) => b - a).join(""));
  const ascending = [...cards].sort((a, b) => a - b);
  const firstNonZero = ascending.findIndex((d) => d !== 0);
  const smallestDigits = [ascending[firstNonZero], ...ascending.filter((_, i) => i !== firstNonZero)];
  const smallest = Number(smallestDigits.join(""));
  const biggestPick = [389, 398, 839, 893];
  return [
    {
      id: "npv-value-of-four",
      skills: ["MATH-NBT-PLACE-VALUE"],
      prompt: "In the number 347, what is the 4 worth?",
      answer: choices("npv-value-of-four", 40, [4, 400, 7]),
      explanation: "In 347, the 3 is in the hundreds place, the 4 is in the tens place, and the 7 is in the ones place. 4 tens is 40.",
      band: 2,
    },
    {
      id: "npv-build-528",
      skills: ["MATH-NBT-PLACE-VALUE"],
      prompt: "What number has 5 hundreds, 2 tens and 8 ones?",
      answer: numeric(5 * 100 + 2 * 10 + 8),
      explanation: "5 hundreds is 500, 2 tens is 20, and 8 ones is 8. 500 + 20 + 8 = 528.",
      band: 1,
    },
    {
      id: "npv-biggest-number",
      skills: ["MATH-NBT-PLACE-VALUE"],
      prompt: "Which number is the biggest?",
      answer: choices("npv-biggest-number", Math.max(...biggestPick), biggestPick.filter((n) => n !== Math.max(...biggestPick))),
      explanation: "Compare the hundreds first. 839 and 893 both have 8 hundreds, more than the others. Then compare the tens: 9 tens is more than 3 tens, so 893 is the biggest.",
      band: 2,
    },
    {
      id: "npv-ten-more-495",
      skills: ["MATH-NBT-PLACE-VALUE", "MATH-OA-ADD-SUB"],
      prompt: "What is 10 more than 495?",
      answer: numeric(495 + 10),
      explanation: "Adding 10 adds one to the tens. 495 has 9 tens, and one more ten makes 10 tens, which is another hundred. So 495 becomes 505.",
      band: 3,
    },
    {
      id: "npv-hundred-less-612",
      skills: ["MATH-NBT-PLACE-VALUE", "MATH-OA-ADD-SUB"],
      prompt: "What is 100 less than 612?",
      answer: numeric(612 - 100),
      explanation: "Taking away 100 takes one from the hundreds. 6 hundreds becomes 5 hundreds, and the tens and ones stay the same. 612 becomes 512.",
      band: 2,
    },
    {
      id: "npv-largest-from-cards",
      skills: ["MATH-NBT-PLACE-VALUE"],
      prompt: `Use each card once: ${cards.join(", ")}. What is the largest 3-digit number you can make?`,
      visual: { kind: "grid", rows: [cards.map(String)] },
      answer: numeric(largest),
      explanation: `Put the biggest digit in the hundreds place, then the next biggest, then the smallest. That makes ${largest}.`,
      band: 2,
    },
    {
      id: "npv-smallest-with-zero",
      skills: ["MATH-NBT-PLACE-VALUE"],
      prompt: `Use each card once: ${cards.join(", ")}. What is the smallest 3-digit number you can make?`,
      visual: { kind: "grid", rows: [cards.map(String)] },
      answer: numeric(smallest),
      explanation: `The smallest digit is 0, but a 3-digit number cannot start with 0 (${ascending.join("")} is really just ${Number(ascending.join(""))}). So start with the next smallest, ${smallestDigits[0]}, then put 0, then ${smallestDigits[2]}. That makes ${smallest}.`,
      band: 4,
    },
  ];
}

function addSubtract(): Draft[] {
  const items: [string, string, number, string, 1 | 2 | 3 | 4][] = [
    ["nas-47-plus-38", "What is 47 + 38?", 47 + 38, "Add the ones: 7 + 8 = 15. Write 5 and carry 1 ten. Add the tens: 4 + 3 + 1 = 8. The answer is 85.", 2],
    ["nas-63-minus-27", "What is 63 - 27?", 63 - 27, "You cannot take 7 from 3, so trade 1 ten for 10 ones: 13 - 7 = 6. Now there are 5 tens: 5 - 2 = 3. The answer is 36.", 3],
    ["nas-125-plus-46", "What is 125 + 46?", 125 + 46, "Ones: 5 + 6 = 11, write 1 and carry 1. Tens: 2 + 4 + 1 = 7. Hundreds: 1. The answer is 171.", 3],
    ["nas-200-minus-85", "What is 200 - 85?", 200 - 85, "Count up from 85: 15 more gets to 100, and 100 more gets to 200. 15 + 100 = 115.", 4],
    ["nas-car-miles", "A car drove 58 miles in the morning and 47 miles in the afternoon. How many miles did it drive in all?", 58 + 47, "58 + 47: 58 + 40 = 98, then 98 + 7 = 105 miles.", 3],
    ["nas-empty-seats", "A small soccer stadium has 150 seats. 68 seats have people in them. How many seats are empty?", 150 - 68, "150 - 68: count up from 68. 2 more is 70, 30 more is 100, 50 more is 150. 2 + 30 + 50 = 82 empty seats.", 4],
  ];
  return items.map(([id, prompt, value, explanation, band]) => ({ id, skills: ["MATH-OA-ADD-SUB"], prompt, answer: numeric(value), explanation, band }));
}

function missingNumbers(): Draft[] {
  return [
    {
      id: "nmu-blank-plus-17",
      skills: ["MATH-OA-UNKNOWN"],
      prompt: "What number goes in the box? ☐ + 17 = 40",
      speech: "What number plus 17 equals 40?",
      answer: numeric(40 - 17),
      explanation: "Think: what plus 17 makes 40? Take 17 away from 40: 40 - 17 = 23. Check: 23 + 17 = 40.",
      band: 3,
    },
    {
      id: "nmu-52-minus-blank",
      skills: ["MATH-OA-UNKNOWN"],
      prompt: "What number goes in the box? 52 - ☐ = 30",
      speech: "52 minus what number equals 30?",
      answer: numeric(52 - 30),
      explanation: "How far is it from 30 up to 52? 52 - 30 = 22. Check: 52 - 22 = 30.",
      band: 3,
    },
    {
      id: "nmu-balance-blocks",
      skills: ["MATH-OA-UNKNOWN", "MATH-OA-EQUAL-GROUPS"],
      prompt: "A balance scale is level. One side has two blue blocks and a 5 gram weight. The other side has a 13 gram weight. Both blue blocks weigh the same. How many grams does one blue block weigh?",
      visual: { kind: "emoji", lines: ["🟦 🟦 + 5 g   ⚖️   13 g"] },
      answer: numeric((13 - 5) / 2, "grams"),
      explanation: "Take the 5 gram weight off the left side, and take 5 grams off the right side too, so it stays level: two blocks balance 13 - 5 = 8 grams. Two equal blocks make 8 grams, so one block weighs 4 grams.",
      band: 4,
    },
    {
      id: "nmu-think-of-a-number",
      skills: ["MATH-OA-UNKNOWN"],
      prompt: "I think of a number. I add 9 and get 25. What was my number?",
      answer: numeric(25 - 9),
      explanation: "Undo the adding by taking away: 25 - 9 = 16. Check: 16 + 9 = 25.",
      band: 2,
    },
  ];
}

function arrays(): Draft[] {
  const grid = (rows: number, cols: number, icon: string) => ({ kind: "grid" as const, rows: Array.from({ length: rows }, () => Array.from({ length: cols }, () => icon)) });
  const arrayItems: [string, number, number, string, string, 1 | 2 | 3][] = [
    ["nar-parked-3-by-4", 3, 4, "🚗", "The cars are parked in rows. How many cars are there?", 1],
    ["nar-balls-2-by-6", 2, 6, "⚽", "The soccer balls are in 2 rows. How many balls are there?", 2],
    ["nar-pawns-5-by-3", 5, 3, "♟️", "The chess pawns are lined up in rows. How many pawns are there?", 2],
  ];
  const drafts: Draft[] = arrayItems.map(([id, r, c, icon, prompt, band]) => ({
    id,
    skills: ["MATH-OA-ARRAYS"],
    prompt,
    visual: grid(r, c, icon),
    answer: numeric(r * c),
    explanation: `There are ${r} rows with ${c} in each row. Count by ${c}s, one row at a time: ${Array.from({ length: r }, (_, i) => (i + 1) * c).join(", ")}. That is ${r * c}.`,
    band,
  }));
  drafts.push(
    {
      id: "nar-parking-lot-rows",
      skills: ["MATH-OA-ARRAYS"],
      prompt: "A parking lot has 4 rows. Each row has 5 cars. How many cars are in the parking lot?",
      answer: numeric(4 * 5),
      explanation: "Count by 5s for each row: 5, 10, 15, 20. There are 20 cars.",
      band: 2,
    },
    {
      id: "nar-share-rows",
      skills: ["MATH-OA-ARRAYS", "MATH-OA-EQUAL-GROUPS"],
      prompt: "18 toy cars are put into 3 equal rows. How many cars are in each row?",
      answer: numeric(18 / 3),
      explanation: "Try counting by the same number 3 times until you reach 18. Counting by 6s: 6, 12, 18. So each row has 6 cars.",
      band: 4,
    },
    {
      id: "nar-same-as-4-rows-of-3",
      skills: ["MATH-OA-ARRAYS"],
      prompt: "Which is the same as 4 rows with 3 cars in each row?",
      answer: choices("nar-same-as-4-rows-of-3", "3 + 3 + 3 + 3", ["4 + 3", "4 + 4 + 4 + 4", "3 + 4 + 3"]),
      explanation: "Each row has 3 cars, and there are 4 rows. So add 3 four times: 3 + 3 + 3 + 3 = 12.",
      band: 3,
    },
    {
      id: "neg-soccer-teams",
      skills: ["MATH-OA-EQUAL-GROUPS"],
      prompt: "There are 4 soccer teams. Each team has 5 players. How many players are there?",
      answer: numeric(4 * 5),
      explanation: "Add 5 for each team: 5 + 5 + 5 + 5 = 20 players.",
      band: 2,
    },
    {
      id: "neg-share-cars",
      skills: ["MATH-OA-EQUAL-GROUPS"],
      prompt: "15 toy cars are shared equally between 3 friends. How many cars does each friend get?",
      answer: numeric(15 / 3),
      explanation: "Hand out one car at a time to each friend. After 5 rounds, all 15 cars are gone: 5 + 5 + 5 = 15. Each friend gets 5.",
      band: 3,
    },
  );
  return drafts;
}

export const numberQuestions = (): Question[] =>
  [...counting(), ...skipCounting(), ...oddEven(), ...placeValue(), ...addSubtract(), ...missingNumbers(), ...arrays()].map((d) => question(FILE, d));
