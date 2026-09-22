import type { Question } from "../../src/content/schema";
import { choices, numeric, pickSpread, question } from "./helpers";

const FILE = "cars.ts";

/**
 * Car makers, for a five year old who already knows most of these by sight.
 *
 * The rule this table exists to enforce: `country` is always where the brand was FOUNDED, and that is the only thing
 * a question ever asks for. `ownerNote` is where it sits today, which for Jaguar, Land Rover and Volvo is a different
 * country entirely. Keeping them in separate fields means a question can never be built from the wrong one.
 *
 * Every fact here needs checking against a source before these ship; they are drafts until then.
 */
type Maker = {
  id: string;
  name: string;
  logo: string;
  country: string;
  flag: string;
  /**
   * Kept as provenance only, never shown. Wikidata and Wikipedia disagree on several of these because they date
   * different legal entities: Lamborghini 1948 is the tractor company, Tata 2024 a demerger, Rolls-Royce 1998 the
   * BMW era. Not a claim worth making to a five year old.
   */
  founded: number;
  /** One line for the teach card. Every one of these was checked against its Wikipedia article on 2026-09-21. */
  fact: string;
  /** Who owns the brand now, when that is somewhere else. Teach card only, never an answer. */
  ownerNote?: string;
};

const MAKERS: Maker[] = [
  { id: "toyota", name: "Toyota", logo: "toyota", country: "Japan", flag: "jp", founded: 1937, fact: "Toyota builds more cars than anyone else in the world." },
  { id: "honda", name: "Honda", logo: "honda", country: "Japan", flag: "jp", founded: 1948, fact: "Honda makes cars, motorbikes and even little robots." },
  { id: "nissan", name: "Nissan", logo: "nissan", country: "Japan", flag: "jp", founded: 1933, fact: "Nissan made one of the first popular electric cars, the Leaf." },
  { id: "mazda", name: "Mazda", logo: "mazda", country: "Japan", flag: "jp", founded: 1920, fact: "Mazda is named after Ahura Mazda, an ancient god of wisdom." },
  { id: "subaru", name: "Subaru", logo: "subaru", country: "Japan", flag: "jp", founded: 1953, fact: "The six stars in the Subaru logo are a group of stars called the Pleiades." },
  { id: "suzuki", name: "Suzuki", logo: "suzuki", country: "Japan", flag: "jp", founded: 1909, fact: "Suzuki started out making machines for weaving cloth." },

  { id: "bmw", name: "BMW", logo: "bmw", country: "Germany", flag: "de", founded: 1916, fact: "BMW is short for Bayerische Motoren Werke, which means Bavarian Motor Works." },
  { id: "audi", name: "Audi", logo: "audi", country: "Germany", flag: "de", founded: 1909, fact: "The four rings stand for four car companies that joined together." },
  { id: "volkswagen", name: "Volkswagen", logo: "volkswagen", country: "Germany", flag: "de", founded: 1937, fact: "Volkswagen means people's car in German." },
  { id: "porsche", name: "Porsche", logo: "porsche", country: "Germany", flag: "de", founded: 1931, fact: "Porsche is famous for fast sports cars like the 911." },
  { id: "mercedes", name: "Mercedes-Benz", logo: "mercedes-benz", country: "Germany", flag: "de", founded: 1926, fact: "The three points of the star stand for engines on land, at sea and in the air." },

  { id: "ferrari", name: "Ferrari", logo: "ferrari", country: "Italy", flag: "it", founded: 1939, fact: "Ferrari's badge is a prancing horse. On a real Ferrari it sits on a yellow shield." },
  { id: "lamborghini", name: "Lamborghini", logo: "lamborghini", country: "Italy", flag: "it", founded: 1963, fact: "The Lamborghini badge is a charging bull.", ownerNote: "Lamborghini is owned today by the Volkswagen Group of Germany." },
  { id: "fiat", name: "Fiat", logo: "fiat", country: "Italy", flag: "it", founded: 1899, fact: "Fiat is known for small city cars like the Fiat 500." },

  { id: "ford", name: "Ford", logo: "ford", country: "United States", flag: "us", founded: 1903, fact: "Ford built the Model T, the car that first put families on the road." },
  { id: "chevrolet", name: "Chevrolet", logo: "chevrolet", country: "United States", flag: "us", founded: 1911, fact: "People call the Chevrolet badge the bowtie." },
  { id: "tesla", name: "Tesla", logo: "tesla", country: "United States", flag: "us", founded: 2003, fact: "Every Tesla is electric. None of them use petrol." },
  { id: "jeep", name: "Jeep", logo: "jeep", country: "United States", flag: "us", founded: 1941, fact: "Jeeps are built to climb rough ground and go where roads stop." },

  { id: "tata", name: "Tata", logo: "tata", country: "India", flag: "in", founded: 1945, fact: "Tata is one of India's biggest companies, and it owns Jaguar and Land Rover in Britain." },
  { id: "mahindra", name: "Mahindra", logo: "mahindra", country: "India", flag: "in", founded: 1945, fact: "Mahindra is known in India for tough vehicles that handle rough roads." },

  { id: "hyundai", name: "Hyundai", logo: "hyundai", country: "South Korea", flag: "kr", founded: 1967, fact: "Hyundai owns part of Kia, so South Korea's two big car makers are family." },
  { id: "kia", name: "Kia", logo: "kia", country: "South Korea", flag: "kr", founded: 1944, fact: "Kia began by making bicycle parts before it made cars." },

  { id: "mini", name: "Mini", logo: "mini", country: "United Kingdom", flag: "gb", founded: 1959, fact: "The original Mini was tiny, and built to fit four people anyway.", ownerNote: "Mini is owned today by BMW of Germany." },
  { id: "rollsroyce", name: "Rolls-Royce", logo: "rolls-royce", country: "United Kingdom", flag: "gb", founded: 1904, fact: "The little silver figure on the front of a Rolls-Royce is called the Spirit of Ecstasy.", ownerNote: "Rolls-Royce Motor Cars is owned today by BMW of Germany." },
  { id: "landrover", name: "Land Rover", logo: "land-rover", country: "United Kingdom", flag: "gb", founded: 1948, fact: "Land Rovers are built for mud, rivers and mountains.", ownerNote: "Land Rover is owned today by Tata Motors of India." },
  { id: "jaguar", name: "Jaguar", logo: "jaguar", country: "United Kingdom", flag: "gb", founded: 1935, fact: "Jaguar is named after the big cat, and a leaping jaguar sits on the front of the car.", ownerNote: "Jaguar is owned today by Tata Motors of India." },

  { id: "volvo", name: "Volvo", logo: "volvo", country: "Sweden", flag: "se", founded: 1927, fact: "Volvo invented the three point seat belt and let every other carmaker use it for free.", ownerNote: "Volvo Cars is owned today by Geely of China." },

  { id: "renault", name: "Renault", logo: "renault", country: "France", flag: "fr", founded: 1899, fact: "The Renault badge is a diamond shape." },
  { id: "peugeot", name: "Peugeot", logo: "peugeot", country: "France", flag: "fr", founded: 1896, fact: "The Peugeot badge is a lion, and the company made saws and coffee grinders first." },
  { id: "citroen", name: "Citroen", logo: "citroen", country: "France", flag: "fr", founded: 1919, fact: "The two arrows in the Citroen badge come from a kind of gear tooth." },
];

const COUNTRIES = [...new Set(MAKERS.map((m) => m.country))];
const logoPicture = (m: Maker) => ({ kind: "image" as const, src: `/logos/${m.logo}.svg`, alt: `The ${m.name} logo` });
const flagPicture = (code: string, name: string) => ({ kind: "image" as const, src: `/flags/${code}.svg`, alt: `The flag of ${name}` });

/** The teach card: the logo, who it is, where they are from, and one thing worth knowing. */
function card(m: Maker): Question["teach"] {
  return {
    title: m.name,
    lines: [`${m.name} is from ${m.country}.`, m.fact, ...(m.ownerNote ? [m.ownerNote] : [])],
    visual: { ...logoPicture(m), beside: { src: `/flags/${m.flag}.svg`, alt: `The flag of ${m.country}` } },
  };
}

/** Other makers to offer as wrong answers, from different countries and spread across the table so they vary. */
function otherMakers(m: Maker, count: number, salt = ""): Maker[] {
  return pickSpread(MAKERS.filter((o) => o.id !== m.id && o.country !== m.country), count, m.id + salt);
}

export function carQuestions(): Question[] {
  const out: Question[] = [];

  for (const [index, m] of MAKERS.entries()) {
    const band = ["toyota", "honda", "ford", "tesla", "bmw", "tata", "jeep"].includes(m.id) ? 1 : index % 3 === 0 ? 2 : 3;

    // Name the logo on screen.
    out.push(
      question(FILE, {
        id: `car-logo-${m.id}`,
        skills: ["CARS-LOGOS"],
        prompt: "Which car maker uses this logo?",
        visual: logoPicture(m),
        teach: card(m),
        answer: choices(`car-logo-${m.id}`, m.name, otherMakers(m, 3).map((o) => o.name)),
        explanation: `This is the ${m.name} logo. ${m.name} is from ${m.country}.`,
        band: band as 1 | 2 | 3,
      }),
    );

    // Pick the logo out of a line-up. The reverse direction, so recognising it is not just elimination.
    const decoys = otherMakers(m, 3, "-pick");
    const lineup = choices(`car-pick-${m.id}`, m.name, decoys.map((o) => o.name));
    if (lineup.type === "choice") {
      out.push(
        question(FILE, {
          id: `car-pick-${m.id}`,
          skills: ["CARS-LOGOS"],
          prompt: `Which one of these is the ${m.name} logo?`,
          teach: card(m),
          answer: {
            ...lineup,
            choiceVisuals: lineup.choices.map((name) => {
              const maker = MAKERS.find((o) => o.name === name)!;
              return logoPicture(maker);
            }),
          },
          explanation: `The ${m.name} logo is the one shown. ${m.fact}`,
          band: band as 1 | 2 | 3,
        }),
      );
    }

    // Where the maker comes from. Tagged with the flag skill too, so cars carry world knowledge along with them.
    const wrongCountries = pickSpread(COUNTRIES.filter((c) => c !== m.country), 3, `${m.id}-country`);
    out.push(
      question(FILE, {
        id: `car-from-${m.id}`,
        skills: ["CARS-ORIGIN", "WORLD-FLAGS"],
        prompt: `Which country does ${m.name} come from?`,
        visual: logoPicture(m),
        teach: card(m),
        answer: choices(`car-from-${m.id}`, m.country, wrongCountries),
        explanation: `${m.name} comes from ${m.country}.`,
        band: (band === 1 ? 2 : band) as 2 | 3,
      }),
    );

    // Match the maker to its country's flag.
    out.push(
      question(FILE, {
        id: `car-flag-${m.id}`,
        skills: ["CARS-ORIGIN", "WORLD-FLAGS"],
        prompt: `${m.name} comes from ${m.country}. Which flag is ${m.country}'s?`,
        visual: logoPicture(m),
        teach: card(m),
        answer: (() => {
          const others = wrongCountries.map((c) => MAKERS.find((o) => o.country === c)!);
          const picked = choices(`car-flag-${m.id}`, m.country, wrongCountries);
          if (picked.type !== "choice") throw new Error("expected choices");
          return {
            ...picked,
            choiceVisuals: picked.choices.map((name) => {
              const code = name === m.country ? m.flag : others.find((o) => o.country === name)!.flag;
              return flagPicture(code, name);
            }),
          };
        })(),
        explanation: `${m.country}'s flag is the one shown, and that is where ${m.name} comes from.`,
        band: 3,
      }),
    );
  }

  // Logos are made of shapes, and shape composition is exactly where he is weakest: he undercounted the triangles in
  // gs-fan-triangles twice, six days apart. These are tagged with the geometry skills as well, so the practice lands
  // where it is needed. Only questions where the geometry is genuinely the work are tagged that way.
  const shape = (id: string, maker: string, prompt: string, answer: number, wrong: number[], explanation: string, band: 1 | 2 | 3) => {
    const m = MAKERS.find((o) => o.id === maker)!;
    out.push(
      question(FILE, {
        id,
        skills: ["CARS-LOGOS", "MATH-GEO-SHAPES"],
        prompt,
        visual: logoPicture(m),
        answer: choices(id, answer, wrong),
        explanation,
        band,
      }),
    );
  };
  shape("car-shape-audi-rings", "audi", "How many rings are in the Audi logo?", 4, [3, 5, 2], "Count them left to right: 1, 2, 3, 4. There are 4 rings.", 1);
  shape("car-shape-audi-overlaps", "audi", "The Audi rings overlap each other. How many places do two rings overlap?", 3, [4, 2, 5], "Each ring overlaps the next one along. Ring 1 with 2, ring 2 with 3, ring 3 with 4. That is 3 places.", 3);
  shape("car-shape-toyota-ovals", "toyota", "The Toyota logo is made of oval shapes inside each other. How many ovals can you find?", 3, [2, 4, 1], "There is one big oval around the outside, and two more ovals crossing inside it. Altogether 3.", 2);
  shape("car-shape-mercedes-points", "mercedes", "How many points does the Mercedes-Benz star have?", 3, [4, 5, 6], "The star reaches out three times, like the letter Y. It has 3 points.", 1);
  shape("car-shape-subaru-stars", "subaru", "How many stars are in the Subaru logo?", 6, [5, 7, 4], "There is one bigger star and five smaller ones. Altogether 6.", 2);
  shape("car-shape-bmw-quarters", "bmw", "The circle in the middle of the BMW logo is split into equal pieces. How many pieces?", 4, [2, 3, 6], "Two lines cross in the middle, cutting the circle into 4 equal quarters.", 2);
  shape("car-shape-citroen-chevrons", "citroen", "How many arrow shapes are in the Citroen logo?", 2, [3, 1, 4], "There are two arrow shapes, one stacked above the other.", 1);

  // Symmetry. Only logos with a plain vertical mirror line are used, so the answer is not a matter of opinion.
  const symmetric: [string, string, boolean, string][] = [
    ["car-sym-vw", "volkswagen", true, "Fold the Volkswagen circle down the middle and both halves match. The V and the W are the same on the left and the right."],
    ["car-sym-mercedes", "mercedes", true, "Fold the Mercedes-Benz star down the middle and both halves match."],
    ["car-sym-ferrari", "ferrari", false, "The horse faces one way, so folding it down the middle does not match. It has no mirror line."],
    ["car-sym-subaru", "subaru", false, "The stars are scattered, not matched left to right, so there is no mirror line."],
  ];
  for (const [id, maker, yes, explanation] of symmetric) {
    const m = MAKERS.find((o) => o.id === maker)!;
    out.push(
      question(FILE, {
        id,
        skills: ["CARS-LOGOS", "MATH-GEO-SYMMETRY"],
        prompt: `If you folded this logo straight down the middle, would the two halves match?`,
        visual: logoPicture(m),
        answer: choices(id, yes ? "Yes, they would match" : "No, they would not match", [yes ? "No, they would not match" : "Yes, they would match"]),
        explanation,
        band: 2,
      }),
    );
  }

  // What cars are and how they work.
  const facts: [string, string, string, string[], string, 1 | 2 | 3][] = [
    ["car-fact-wheels", "How many wheels does a normal car have?", "4", ["2", "3", "6"], "A car has one wheel at each corner, so 4 altogether.", 1],
    ["car-fact-electric", "A Tesla does not need petrol. What does it run on?", "Electricity from a battery", ["Petrol", "Steam", "Water"], "Every Tesla is electric. You plug it in to charge the battery instead of filling it with petrol.", 1],
    ["car-fact-steer", "Which part of a car do you turn to make it go left or right?", "The steering wheel", ["The engine", "The boot", "The mirror"], "The steering wheel turns the front wheels, and the car follows them.", 1],
    ["car-fact-suv", "Which kind of vehicle is built to drive on rough ground away from roads?", "An off-roader like a Jeep", ["A city hatchback", "A racing car", "A limousine"], "Off-roaders sit high up with chunky tyres, so rocks and mud do not stop them. Racing cars sit low and need smooth track.", 2],
    ["car-fact-f1", "In a Formula 1 race, what does the team do in a pit stop?", "Change the tyres very fast", ["Wash the car", "Fill it with shopping", "Let the driver sleep"], "A Formula 1 pit crew can change all four tyres in a couple of seconds.", 2],
    ["car-fact-truck", "Why do big trucks have more wheels than cars?", "To carry much heavier loads", ["To go faster", "To look nice", "To use less fuel"], "Extra wheels spread the weight out, so a heavy load does not crush the tyres or the road.", 3],
  ];
  for (const [id, prompt, right, wrong, explanation, band] of facts) {
    out.push(
      question(FILE, {
        id,
        skills: ["CARS-FACTS"],
        prompt,
        answer: choices(id, right, wrong),
        explanation,
        band,
      }),
    );
  }

  // Reading a chart, counted from a scene rather than from a statistic, so nothing here claims a real world figure.
  const carPark = { kind: "barChart" as const, title: "Cars in the car park", unit: "cars", bars: [
    { label: "Toyota", value: 8 }, { label: "Ford", value: 5 }, { label: "Tesla", value: 3 }, { label: "Kia", value: 6 },
  ] };
  out.push(
    question(FILE, {
      id: "car-chart-most",
      skills: ["CARS-NUMBERS", "MATH-MD-BAR-GRAPH"],
      prompt: "Which car maker had the most cars in the car park?",
      visual: carPark,
      answer: choices("car-chart-most", "Toyota", ["Kia", "Ford", "Tesla"]),
      explanation: "Toyota's bar is the tallest, at 8 cars. Kia is next with 6.",
      band: 2,
    }),
    question(FILE, {
      id: "car-chart-difference",
      skills: ["CARS-NUMBERS", "MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many more Toyotas than Teslas were in the car park?",
      visual: carPark,
      answer: numeric(5),
      explanation: "Toyota has 8 and Tesla has 3. 8 - 3 = 5.",
      band: 3,
    }),
    question(FILE, {
      id: "car-chart-total",
      skills: ["CARS-NUMBERS", "MATH-MD-BAR-GRAPH", "MATH-OA-ADD-SUB"],
      prompt: "How many cars were in the car park altogether?",
      visual: carPark,
      answer: numeric(22),
      explanation: "Add the four bars: 8 + 5 + 3 + 6 = 22 cars.",
      band: 3,
    }),
  );

  return out;
}
