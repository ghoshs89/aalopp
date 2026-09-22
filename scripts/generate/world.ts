import type { Question } from "../../src/content/schema";
import { choices, numeric, pickSpread, question } from "./helpers";

const FILE = "world.ts";

/**
 * Countries, starting with the three the family cares most about: Canada, India and the United States.
 *
 * Every fact here needs checking against a source before these ship, so they are drafts until then. Flags are the
 * downloaded files in public/flags, not drawings, because a hand drawn flag quietly gets the number of stars wrong.
 */
type Country = {
  code: string;
  name: string;
  capital: string;
  continent: string;
  /** What the flag looks like, for the teach card. Checked against the committed file in public/flags. */
  flagWords: string;
  /**
   * Only facts[0] is ever shown, on the teach card and as the answer to the culture question. Each one names its own
   * country so it cannot accidentally be true as a distractor for another. All checked against Wikipedia 2026-09-21.
   */
  facts: string[];
  /** One thing about the flag itself, with the answer and three wrong options. */
  flagDetail?: { question: string; answer: string; wrong: [string, string, string]; why: string };
};

const FOCUS = ["ca", "in", "us"];

const COUNTRIES: Country[] = [
  {
    code: "ca", name: "Canada", capital: "Ottawa", continent: "North America",
    flagWords: "Red on both sides, white in the middle, with a red maple leaf.",
    facts: ["Canada has two official languages, English and French.", "Canada is the second biggest country in the world by total area."],
    flagDetail: { question: "What is in the middle of Canada's flag?", answer: "A maple leaf", wrong: ["A star", "A moon", "A bear"], why: "The red maple leaf in the white middle band is Canada's best known symbol." },
  },
  {
    code: "in", name: "India", capital: "New Delhi", continent: "Asia",
    flagWords: "Orange on top, white in the middle, green at the bottom, with a navy blue wheel.",
    facts: ["India has more people than any other country.", "Diwali, the festival of lights, is celebrated across India."],
    flagDetail: { question: "What is in the middle of India's flag?", answer: "A blue wheel", wrong: ["A red circle", "A white star", "A green leaf"], why: "The navy blue wheel in the white band is called the Ashoka Chakra." },
  },
  {
    code: "us", name: "United States", capital: "Washington, D.C.", continent: "North America",
    flagWords: "Red and white stripes, with white stars on a blue square in the corner.",
    facts: ["There is one star on the flag for each of the fifty states.", "The Grand Canyon and Yellowstone are in the United States."],
    flagDetail: { question: "What is on the blue square of the United States flag?", answer: "Stars", wrong: ["Stripes", "A leaf", "A wheel"], why: "Fifty white stars sit on the blue square, one for each state." },
  },
  {
    code: "gb", name: "United Kingdom", capital: "London", continent: "Europe",
    flagWords: "Red and white crosses on a dark blue background.",
    facts: ["Big Ben and Buckingham Palace are in London.", "The United Kingdom is made up of England, Scotland, Wales and Northern Ireland."],
  },
  {
    code: "fr", name: "France", capital: "Paris", continent: "Europe",
    flagWords: "Three stripes standing up: blue, white and red.",
    facts: ["The Eiffel Tower is in Paris.", "People in France speak French."],
  },
  {
    code: "de", name: "Germany", capital: "Berlin", continent: "Europe",
    flagWords: "Three stripes lying down: black, red and gold.",
    facts: ["Germany builds many famous cars, including BMW, Audi and Volkswagen."],
  },
  {
    code: "it", name: "Italy", capital: "Rome", continent: "Europe",
    flagWords: "Three stripes standing up: green, white and red.",
    facts: ["Pizza and pasta come from Italy.", "Ferrari and Lamborghini are Italian."],
  },
  {
    code: "jp", name: "Japan", capital: "Tokyo", continent: "Asia",
    flagWords: "A red circle in the middle of a white flag.",
    facts: ["Japan is famous for very fast trains called bullet trains.", "Toyota, Honda and Nissan are Japanese."],
    flagDetail: { question: "What is in the middle of Japan's flag?", answer: "A red circle", wrong: ["A red star", "A red leaf", "A red cross"], why: "The red circle stands for the sun. Japan is sometimes called the land of the rising sun." },
  },
  {
    code: "cn", name: "China", capital: "Beijing", continent: "Asia",
    flagWords: "A red flag with five yellow stars in the corner.",
    facts: ["The Great Wall of China is thousands of kilometres long.", "Giant pandas live in China."],
  },
  {
    code: "kr", name: "South Korea", capital: "Seoul", continent: "Asia",
    flagWords: "A white flag with a red and blue circle in the middle and four black marks around it.",
    facts: ["Hyundai and Kia are from South Korea."],
  },
  {
    code: "br", name: "Brazil", capital: "Brasilia", continent: "South America",
    flagWords: "Green with a yellow diamond and a blue globe in the middle.",
    facts: ["Most of the Amazon rainforest is in Brazil.", "People in Brazil speak Portuguese."],
  },
  {
    code: "mx", name: "Mexico", capital: "Mexico City", continent: "North America",
    flagWords: "Three stripes standing up: green, white and red, with an eagle in the middle.",
    facts: ["Mexico shares a long border with the United States.", "People in Mexico speak Spanish."],
  },
  {
    code: "au", name: "Australia", capital: "Canberra", continent: "Australia",
    flagWords: "Dark blue with a small Union Jack in the corner and white stars.",
    facts: ["Kangaroos and koalas live in Australia.", "Australia is a country and a continent at the same time."],
  },
  {
    code: "es", name: "Spain", capital: "Madrid", continent: "Europe",
    flagWords: "Red, yellow, red stripes lying down, with a badge on the yellow band.",
    facts: ["People in Spain speak Spanish."],
  },
  {
    code: "se", name: "Sweden", capital: "Stockholm", continent: "Europe",
    flagWords: "A blue flag with a yellow cross.",
    facts: ["Volvo cars come from Sweden."],
  },
];

const flagPicture = (c: Country) => ({ kind: "image" as const, src: `/flags/${c.code}.svg`, alt: `The flag of ${c.name}` });
const bandFor = (c: Country): 1 | 2 | 3 => (FOCUS.includes(c.code) ? 1 : ["gb", "fr", "jp", "it", "de"].includes(c.code) ? 2 : 3);

function card(c: Country): Question["teach"] {
  return { title: c.name, lines: [c.flagWords, `The capital city is ${c.capital}.`, c.facts[0]], visual: flagPicture(c) };
}

const others = (c: Country, n: number) =>
  pickSpread(COUNTRIES.filter((o) => o.code !== c.code && o.continent !== c.continent), n, c.code);

export function worldQuestions(): Question[] {
  const out: Question[] = [];

  for (const c of COUNTRIES) {
    const band = bandFor(c);
    const decoys = others(c, 3);

    out.push(
      question(FILE, {
        id: `world-flag-name-${c.code}`,
        skills: ["WORLD-FLAGS"],
        prompt: "Which country's flag is this?",
        visual: flagPicture(c),
        teach: card(c),
        answer: choices(`world-flag-name-${c.code}`, c.name, decoys.map((o) => o.name)),
        explanation: `This is the flag of ${c.name}. ${c.flagWords}`,
        band,
      }),
      question(FILE, {
        id: `world-flag-pick-${c.code}`,
        skills: ["WORLD-FLAGS"],
        prompt: `Which one of these is the flag of ${c.name}?`,
        teach: card(c),
        answer: (() => {
          const picked = choices(`world-flag-pick-${c.code}`, c.name, decoys.map((o) => o.name));
          if (picked.type !== "choice") throw new Error("expected choices");
          return { ...picked, choiceVisuals: picked.choices.map((name) => flagPicture(COUNTRIES.find((o) => o.name === name)!)) };
        })(),
        explanation: `${c.name}'s flag: ${c.flagWords.toLowerCase()}`,
        band,
      }),
      question(FILE, {
        id: `world-capital-${c.code}`,
        skills: ["WORLD-CAPITALS"],
        prompt: `What is the capital city of ${c.name}?`,
        visual: flagPicture(c),
        teach: card(c),
        answer: choices(`world-capital-${c.code}`, c.capital, decoys.map((o) => o.capital)),
        explanation: `The capital of ${c.name} is ${c.capital}.`,
        band: (band === 1 ? 2 : 3) as 2 | 3,
      }),
      question(FILE, {
        id: `world-continent-${c.code}`,
        skills: ["WORLD-MAP"],
        prompt: `Which continent is ${c.name} in?`,
        visual: flagPicture(c),
        teach: card(c),
        answer: choices(`world-continent-${c.code}`, c.continent, [...new Set(decoys.map((o) => o.continent))]),
        explanation: `${c.name} is in ${c.continent}.`,
        band: (band === 1 ? 1 : 2) as 1 | 2,
      }),
    );

    if (c.flagDetail) {
      out.push(
        question(FILE, {
          id: `world-flag-detail-${c.code}`,
          skills: ["WORLD-FLAGS-DETAIL"],
          prompt: c.flagDetail.question,
          visual: flagPicture(c),
          teach: card(c),
          answer: choices(`world-flag-detail-${c.code}`, c.flagDetail.answer, c.flagDetail.wrong),
          explanation: c.flagDetail.why,
          band: (band === 1 ? 1 : 2) as 1 | 2,
        }),
      );
    }

    for (const [i, fact] of c.facts.entries()) {
      if (i > 0) continue;
      out.push(
        question(FILE, {
          id: `world-culture-${c.code}`,
          skills: ["WORLD-CULTURE"],
          prompt: `Which of these is true about ${c.name}?`,
          visual: flagPicture(c),
          teach: card(c),
          answer: choices(
            `world-culture-${c.code}`,
            fact,
            decoys.map((o) => o.facts[0]),
          ),
          explanation: fact,
          band: (band === 1 ? 2 : 3) as 2 | 3,
        }),
      );
    }
  }

  // Reading a chart about countries. Counted from a made up class survey, so nothing claims a real world statistic.
  const survey = { kind: "barChart" as const, title: "Countries our class has visited", unit: "children", bars: [
    { label: "Canada", value: 9 }, { label: "India", value: 6 }, { label: "USA", value: 7 }, { label: "Japan", value: 2 },
  ] };
  out.push(
    question(FILE, {
      id: "world-chart-most",
      skills: ["WORLD-NUMBERS", "MATH-MD-BAR-GRAPH"],
      prompt: "Which country have the most children visited?",
      visual: survey,
      answer: choices("world-chart-most", "Canada", ["India", "USA", "Japan"]),
      explanation: "Canada's bar is the tallest, at 9 children.",
      band: 2,
    }),
    question(FILE, {
      id: "world-chart-difference",
      skills: ["WORLD-NUMBERS", "MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many more children have visited Canada than Japan?",
      visual: survey,
      answer: numeric(7),
      explanation: "Canada has 9 and Japan has 2. 9 - 2 = 7.",
      band: 3,
    }),
  );

  return out;
}
