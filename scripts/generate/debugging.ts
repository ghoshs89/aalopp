import type { Question, Visual } from "../../src/content/schema";
import { addMinutes, assert, pad2, question, timeLabel, type Draft } from "./helpers";

const FILE = "debugging.ts";
const SOLVERS = ["Sam", "Mia", "Leo", "Ava", "Kai", "Zoe", "Noah", "Lily"];

type Bug = {
  id: string;
  skills: string[];
  task: string;
  visual?: Visual;
  /** The steps as the solver wrote them, including the mistake. */
  steps: string[];
  bugIndex: number;
  /** What the wrong step should have said. */
  fix: string;
  /** The right final answer, said in the explanation. */
  rightAnswer: string;
  band: 2 | 3 | 4;
};

let solverTurn = 0;

function toDraft(b: Bug): Draft {
  assert(b.steps[b.bugIndex] !== b.fix, `${b.id}: fix must differ from the wrong step`);
  assert(new Set(b.steps).size === b.steps.length, `${b.id}: steps must be unique`);
  const solver = SOLVERS[solverTurn++ % SOLVERS.length];
  const after = b.steps.length - 1 - b.bugIndex;
  return {
    id: b.id,
    skills: ["CS-DEBUG", ...b.skills],
    prompt: `${solver} worked out ${b.task}. One step has a mistake. Tap the first step that is wrong.`,
    visual: b.visual,
    answer: { type: "findTheBug", solver, steps: b.steps, bugIndex: b.bugIndex, fix: b.fix },
    explanation: `Step ${b.bugIndex + 1} should say: ${b.fix}${after > 0 ? " Any step after it that used the mistake is wrong too." : ""} The right answer is ${b.rightAnswer}.`,
    band: b.band,
  };
}

function additionWithCarry(id: string, a: number, b: number, bug: "forgot-carry" | "ones-wrong", band: 2 | 3): Bug {
  const [at, ao, bt, bo] = [Math.floor(a / 10), a % 10, Math.floor(b / 10), b % 10];
  const ones = ao + bo;
  assert(ones >= 11 && ones <= 18, `${id}: ones must need a carry`);
  const right = a + b;
  const step1 = (o: number) => `Add the ones: ${ao} + ${bo} = ${o}.`;
  const step2 = (o: number) => `${o} ones is 1 ten and ${o - 10} ones. Write ${o - 10} and carry 1 ten.`;
  const step3 = (carry: boolean) => (carry ? `Add the tens: ${at} + ${bt} + 1 = ${at + bt + 1}.` : `Add the tens: ${at} + ${bt} = ${at + bt}.`);
  if (bug === "forgot-carry") {
    return {
      id,
      skills: ["MATH-OA-ADD-SUB", "MATH-NBT-PLACE-VALUE"],
      task: `${a} + ${b}`,
      steps: [step1(ones), step2(ones), step3(false), `So ${a} + ${b} = ${(at + bt) * 10 + ones - 10}.`],
      bugIndex: 2,
      fix: step3(true),
      rightAnswer: String(right),
      band,
    };
  }
  const wrongOnes = ones - 1;
  return {
    id,
    skills: ["MATH-OA-ADD-SUB"],
    task: `${a} + ${b}`,
    steps: [step1(wrongOnes), step2(wrongOnes), step3(true), `So ${a} + ${b} = ${(at + bt + 1) * 10 + wrongOnes - 10}.`],
    bugIndex: 0,
    fix: step1(ones),
    rightAnswer: String(right),
    band,
  };
}

function subtractionWithTrade(id: string, a: number, b: number, bug: "flipped" | "forgot-trade", band: 3 | 4): Bug {
  const [at, ao, bt, bo] = [Math.floor(a / 10), a % 10, Math.floor(b / 10), b % 10];
  assert(ao < bo && at > bt, `${id}: needs a trade`);
  const right = a - b;
  const trade = `You cannot take ${bo} from ${ao}, so trade 1 ten for 10 ones.`;
  const onesStep = `Now there are ${ao + 10} ones: ${ao + 10} - ${bo} = ${ao + 10 - bo}.`;
  const tensRight = `There are ${at - 1} tens left: ${at - 1} - ${bt} = ${at - 1 - bt}.`;
  if (bug === "flipped") {
    return {
      id,
      skills: ["MATH-OA-ADD-SUB"],
      task: `${a} - ${b}`,
      steps: [`Take the smaller from the bigger in the ones: ${bo} - ${ao} = ${bo - ao}.`, `Take away the tens: ${at} - ${bt} = ${at - bt}.`, `So ${a} - ${b} = ${(at - bt) * 10 + (bo - ao)}.`],
      bugIndex: 0,
      fix: `${trade} Then ${ao + 10} - ${bo} = ${ao + 10 - bo}.`,
      rightAnswer: String(right),
      band,
    };
  }
  return {
    id,
    skills: ["MATH-OA-ADD-SUB", "MATH-NBT-PLACE-VALUE"],
    task: `${a} - ${b}`,
    steps: [trade, onesStep, `Take away the tens: ${at} - ${bt} = ${at - bt}.`, `So ${a} - ${b} = ${(at - bt) * 10 + (ao + 10 - bo)}.`],
    bugIndex: 2,
    fix: tensRight,
    rightAnswer: String(right),
    band,
  };
}

function skipCountingCoins(): Bug[] {
  const nickels = [5, 10, 20, 25, 30];
  const dimes = [10, 25, 35, 45];
  return [
    {
      id: "dbg-count-nickels",
      skills: ["MATH-MD-COINS", "MATH-NBT-SKIP-COUNT"],
      task: "how much 5 nickels are worth, counting by 5s",
      visual: { kind: "coins", currency: "USD", coins: ["nickel", "nickel", "nickel", "nickel", "nickel"] },
      steps: nickels.map((c, i) => `${i + 1} nickel${i ? "s" : ""}: ${c} cents.`),
      bugIndex: 2,
      fix: "3 nickels: 15 cents.",
      rightAnswer: "25 cents",
      band: 2,
    },
    {
      id: "dbg-count-dimes",
      skills: ["MATH-MD-COINS", "MATH-NBT-SKIP-COUNT"],
      task: "how much 4 dimes are worth, counting by 10s",
      visual: { kind: "coins", currency: "USD", coins: ["dime", "dime", "dime", "dime"] },
      steps: dimes.map((c, i) => `${i + 1} dime${i ? "s" : ""}: ${c} cents.`),
      bugIndex: 1,
      fix: "2 dimes: 20 cents.",
      rightAnswer: "40 cents",
      band: 2,
    },
  ];
}

function coinValues(): Bug[] {
  return [
    {
      id: "dbg-us-coin-values",
      skills: ["MATH-MD-COINS"],
      task: "how much a quarter, a dime and a nickel are worth together",
      visual: { kind: "coins", currency: "USD", coins: ["quarter", "dime", "nickel"] },
      steps: ["A quarter is 25 cents.", "A dime is 5 cents.", "A nickel is 5 cents.", "Together: 25 + 5 + 5 = 35 cents."],
      bugIndex: 1,
      fix: "A dime is 10 cents.",
      rightAnswer: `${25 + 10 + 5} cents`,
      band: 2,
    },
    {
      id: "dbg-ca-coin-values",
      skills: ["MATH-MD-COINS", "MATH-MD-MONEY"],
      task: "how much a loonie, a toonie and a quarter are worth together",
      visual: { kind: "coins", currency: "CAD", coins: ["loonie", "toonie", "quarter"] },
      steps: ["A quarter is 25 cents.", "A loonie is 1 dollar.", "A toonie is 1 dollar too.", "Together: $1 + $1 + 25 cents = $2.25."],
      bugIndex: 2,
      fix: "A toonie is 2 dollars.",
      rightAnswer: "$3.25",
      band: 3,
    },
  ];
}

function clocks(): Bug[] {
  const minutesAsNumber = (id: string, h: number, m: number, band: 2 | 3): Bug => ({
    id,
    skills: ["MATH-MD-TIME-5MIN"],
    task: "what time this clock shows",
    visual: { kind: "clock", hour: h, minute: m },
    steps: [
      m < 30 ? `The short hand is just past ${h}, so the hour is ${h}.` : `The short hand is past ${h} but has not reached ${h + 1}, so the hour is ${h}.`,
      `The long hand points to ${m / 5}.`, `That means ${m / 5} minutes.`, `So the time is ${h}:${pad2(m / 5)}.`],
    bugIndex: 2,
    fix: `Count by 5s for each number up to ${m / 5}: that means ${m} minutes.`,
    rightAnswer: timeLabel(h, m),
    band,
  });
  const next = 3;
  return [
    minutesAsNumber("dbg-clock-minutes-4-20", 4, 20, 2),
    minutesAsNumber("dbg-clock-minutes-9-35", 9, 35, 3),
    {
      id: "dbg-clock-hour-too-soon",
      skills: ["MATH-MD-TIME-5MIN", "MATH-MD-TIME-HALF-QUARTER"],
      task: "what time this clock shows",
      visual: { kind: "clock", hour: 2, minute: 50 },
      steps: ["The long hand points to 10. Counting by 5s, that is 50 minutes.", `The short hand is almost at ${next}, so the hour is ${next}.`, `So the time is ${timeLabel(next, 50)}.`],
      bugIndex: 1,
      fix: `The short hand has not reached ${next} yet, so the hour is still 2.`,
      rightAnswer: timeLabel(2, 50),
      band: 3,
    },
    {
      id: "dbg-elapsed-past-sixty",
      skills: ["MATH-MD-TIME-ELAPSED"],
      task: "what time a 30 minute race ends if it starts at 3:45",
      visual: { kind: "clock", hour: 3, minute: 45 },
      steps: ["The race starts at 3:45.", "Add 30 minutes to the minutes: 45 + 30 = 75.", "So the race ends at 3:75."],
      bugIndex: 2,
      fix: `75 minutes is 1 hour and 15 minutes past 3:00, so the race ends at ${timeLabel(addMinutes(3, 45, 30).hour, addMinutes(3, 45, 30).minute)}.`,
      rightAnswer: timeLabel(addMinutes(3, 45, 30).hour, addMinutes(3, 45, 30).minute),
      band: 4,
    },
  ];
}

function rulers(): Bug[] {
  return [
    {
      id: "dbg-ruler-truck-offset",
      skills: ["MATH-MD-LENGTH"],
      task: "how long the truck is",
      visual: { kind: "ruler", unit: "in", length: 8, start: 2, end: 7, object: "truck" },
      steps: ["The truck starts at 2.", "The truck ends at 7.", "So the truck is 7 inches long."],
      bugIndex: 2,
      fix: "Count the jumps from 2 to 7: the truck is 5 inches long.",
      rightAnswer: `${7 - 2} inches`,
      band: 2,
    },
    {
      id: "dbg-ruler-bus-cm-offset",
      skills: ["MATH-MD-LENGTH", "MATH-OA-ADD-SUB"],
      task: "how long the bus is",
      visual: { kind: "ruler", unit: "cm", length: 12, start: 3, end: 11, object: "bus" },
      steps: ["The bus starts at 3.", "The bus ends at 11.", "11 + 3 = 14, so the bus is 14 centimeters long."],
      bugIndex: 2,
      fix: "11 - 3 = 8, so the bus is 8 centimeters long.",
      rightAnswer: `${11 - 3} centimeters`,
      band: 3,
    },
  ];
}

function others(): Bug[] {
  const rows = 3;
  const cols = 4;
  return [
    {
      id: "dbg-array-cars",
      skills: ["MATH-OA-ARRAYS"],
      task: "how many cars are parked",
      visual: { kind: "grid", rows: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "🚗")) },
      steps: [`There are ${rows} rows with ${cols} cars in each row.`, `Add ${cols} three times: ${cols} + ${cols} + ${cols}.`, `${cols} + ${cols} = ${cols * 2}, and ${cols * 2} + ${cols} = 16.`, "So there are 16 cars."],
      bugIndex: 2,
      fix: `${cols} + ${cols} = ${cols * 2}, and ${cols * 2} + ${cols} = ${rows * cols}.`,
      rightAnswer: `${rows * cols} cars`,
      band: 2,
    },
    {
      id: "dbg-calendar-week-later",
      skills: ["MATH-MD-CALENDAR", "MATH-OA-ADD-SUB"],
      task: "the date of the next soccer game, which is one week after the game on October 17",
      steps: ["The soccer game is on October 17.", "One week is 7 days.", "17 + 7 = 23, so the next game is on October 23."],
      bugIndex: 2,
      fix: `17 + 7 = ${17 + 7}, so the next game is on October ${17 + 7}.`,
      rightAnswer: `October ${17 + 7}`,
      band: 2,
    },
    {
      id: "dbg-bead-pattern",
      skills: ["LOGIC-PATTERN"],
      task: "which bead comes next in the pattern",
      visual: { kind: "emoji", lines: ["🔴 🔵 🔵 🔴 🔵 🔵 🔴 ❓"] },
      steps: ["The pattern starts red, blue, blue.", "Then red, blue, blue repeats again.", "After a red bead comes another red bead.", "So the next bead is red."],
      bugIndex: 2,
      fix: "After a red bead comes a blue bead.",
      rightAnswer: "blue",
      band: 2,
    },
    {
      id: "dbg-change-from-ten",
      skills: ["MATH-MD-MONEY"],
      task: "the change from $10 for a toy that costs $6.50",
      steps: ["The toy costs $6.50.", "You pay with a $10 bill.", "10 - 6 = 4, so the change is $4.50."],
      bugIndex: 2,
      fix: "Count up from $6.50: 50 cents makes $7, then $3 more makes $10. The change is $3.50.",
      rightAnswer: "$3.50",
      band: 4,
    },
    {
      id: "dbg-place-value-zero",
      skills: ["MATH-NBT-PLACE-VALUE"],
      task: "what the number 406 means",
      steps: ["In 406, the 4 is in the hundreds place.", "The 0 is in the tens place, so there are no tens.", "The 6 is in the ones place.", "So 406 = 400 + 60."],
      bugIndex: 3,
      fix: "So 406 = 400 + 6.",
      rightAnswer: "400 + 6",
      band: 3,
    },
  ];
}

export const debuggingQuestions = (): Question[] => {
  solverTurn = 0;
  const bugs: Bug[] = [
    additionWithCarry("dbg-add-47-38-carry", 47, 38, "forgot-carry", 2),
    additionWithCarry("dbg-add-35-49-ones", 35, 49, "ones-wrong", 2),
    additionWithCarry("dbg-add-68-25-carry", 68, 25, "forgot-carry", 3),
    subtractionWithTrade("dbg-sub-63-27-flipped", 63, 27, "flipped", 3),
    subtractionWithTrade("dbg-sub-52-18-trade", 52, 18, "forgot-trade", 4),
    subtractionWithTrade("dbg-sub-81-46-flipped", 81, 46, "flipped", 3),
    ...skipCountingCoins(),
    ...coinValues(),
    ...clocks(),
    ...rulers(),
    ...others(),
  ];
  return bugs.map((b) => question(FILE, toDraft(b)));
};
