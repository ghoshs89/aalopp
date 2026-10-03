import type { Question } from "../../src/content/schema";
import { choices, numeric, pickSpread, question } from "./helpers";

const FILE = "world.ts";

/**
 * Countries, starting with the three the family cares most about: Canada, India and the United States, then 34
 * more added 2026-10-03 at the parent's request for broader world teaching: Nepal, Bangladesh, Sri Lanka, Pakistan
 * and Bhutan (India's neighbours), Egypt, Kenya, South Africa, Nigeria and Morocco (Africa), Argentina, Peru, Chile,
 * Colombia and Cuba (more of the Americas), and the Netherlands, Switzerland, Greece, Russia, Indonesia, Thailand
 * and New Zealand (more of Europe and Asia-Pacific).
 *
 * Every fact here needs checking against a source before it ships, so it is draft until then. Sources and dates are
 * in content/REVIEW.md. Flags are the downloaded files in public/flags, maps are rendered from real geographic data
 * into public/maps (see scripts/maps), neither is ever hand drawn.
 */
type Country = {
  code: string;
  name: string;
  capital: string;
  /**
   * Set when the real answer is more than one city, so the quiz question would have no single right answer: Sri
   * Lanka (its executive capital Colombo and its legislative capital Kotte) and South Africa (Pretoria, Cape Town
   * and Bloemfontein). The teach card still names the capital; only the quiz question is skipped.
   */
  skipCapitalQuestion?: true;
  continent: string;
  /** Set only for Russia, which straddles Europe and Asia with no single correct answer. */
  skipContinentQuestion?: true;
  /** What the flag looks like, for the teach card. Checked against the committed file in public/flags. */
  flagWords: string;
  /**
   * Only facts[0] is ever shown, on the teach card and as the answer to the culture question. Each one names its own
   * country so it cannot accidentally be true as a distractor for another.
   */
  facts: string[];
  /** A big city that is not the capital, for "which country is this city in" questions. */
  cities: string[];
  /** A named landmark and the city it is in. Left empty where no single well known, city-tied landmark exists. */
  landmarks?: { name: string; city: string }[];
  /**
   * Real land neighbours, by name, not necessarily countries in this table. Empty for an island nation with no land
   * border, which skips the neighbour question entirely. South Korea's only land neighbour is North Korea, which
   * this app leaves out of a young child's quiz, so it is also treated as empty here.
   */
  neighbours: string[];
  /** One thing about the flag itself, with the answer and three wrong options. */
  flagDetail?: { question: string; answer: string; wrong: [string, string, string]; why: string };
};

const FOCUS = ["ca", "in", "us"];

const COUNTRIES: Country[] = [
  // Checked against Wikipedia, 2026-09-21 (see content/REVIEW.md).
  {
    code: "ca", name: "Canada", capital: "Ottawa", continent: "North America",
    flagWords: "Red on both sides, white in the middle, with a red maple leaf.",
    facts: ["Canada has two official languages, English and French.", "Canada is the second biggest country in the world by total area."],
    cities: ["Toronto"],
    landmarks: [{ name: "The CN Tower, one of the tallest towers in the world", city: "Toronto" }],
    neighbours: ["United States"],
    flagDetail: { question: "What is in the middle of Canada's flag?", answer: "A maple leaf", wrong: ["A star", "A moon", "A bear"], why: "The red maple leaf in the white middle band is Canada's best known symbol." },
  },
  {
    code: "in", name: "India", capital: "New Delhi", continent: "Asia",
    flagWords: "Orange on top, white in the middle, green at the bottom, with a navy blue wheel.",
    facts: ["India has more people than any other country.", "Diwali, the festival of lights, is celebrated across India."],
    cities: ["Mumbai"],
    landmarks: [{ name: "The Taj Mahal, a white marble palace", city: "Agra" }],
    neighbours: ["Pakistan", "China", "Nepal", "Bangladesh", "Bhutan"],
    flagDetail: { question: "What is in the middle of India's flag?", answer: "A blue wheel", wrong: ["A red circle", "A white star", "A green leaf"], why: "The navy blue wheel in the white band is called the Ashoka Chakra." },
  },
  {
    code: "us", name: "United States", capital: "Washington, D.C.", continent: "North America",
    flagWords: "Red and white stripes, with white stars on a blue square in the corner.",
    facts: ["There is one star on the flag for each of the fifty states.", "The Grand Canyon and Yellowstone are in the United States."],
    cities: ["New York City"],
    landmarks: [{ name: "The Statue of Liberty, a huge statue holding a torch", city: "New York City" }],
    neighbours: ["Canada", "Mexico"],
    flagDetail: { question: "What is on the blue square of the United States flag?", answer: "Stars", wrong: ["Stripes", "A leaf", "A wheel"], why: "Fifty white stars sit on the blue square, one for each state." },
  },
  {
    code: "gb", name: "United Kingdom", capital: "London", continent: "Europe",
    flagWords: "Red and white crosses on a dark blue background.",
    facts: ["Big Ben and Buckingham Palace are in London.", "The United Kingdom is made up of England, Scotland, Wales and Northern Ireland."],
    cities: ["Manchester"],
    landmarks: [{ name: "Big Ben, a famous clock tower", city: "London" }],
    neighbours: ["Ireland"],
  },
  {
    code: "fr", name: "France", capital: "Paris", continent: "Europe",
    flagWords: "Three stripes standing up: blue, white and red.",
    facts: ["The Eiffel Tower is in Paris.", "People in France speak French."],
    cities: ["Marseille"],
    landmarks: [{ name: "The Eiffel Tower, a huge iron tower", city: "Paris" }],
    neighbours: ["Spain", "Germany", "Italy", "Switzerland"],
  },
  {
    code: "de", name: "Germany", capital: "Berlin", continent: "Europe",
    flagWords: "Three stripes lying down: black, red and gold.",
    facts: ["Germany builds many famous cars, including BMW, Audi and Volkswagen.", "Oktoberfest, a huge autumn festival, began in Munich, Germany."],
    cities: ["Munich"],
    landmarks: [{ name: "The Brandenburg Gate, a stone gateway with tall columns", city: "Berlin" }],
    neighbours: ["France", "Switzerland", "Netherlands", "Poland"],
  },
  {
    code: "it", name: "Italy", capital: "Rome", continent: "Europe",
    flagWords: "Three stripes standing up: green, white and red.",
    facts: ["Pizza and pasta come from Italy.", "Ferrari and Lamborghini are Italian."],
    cities: ["Venice"],
    landmarks: [{ name: "The Colosseum, a huge ancient stone arena", city: "Rome" }],
    neighbours: ["France", "Switzerland", "Austria"],
  },
  {
    code: "jp", name: "Japan", capital: "Tokyo", continent: "Asia",
    flagWords: "A red circle in the middle of a white flag.",
    facts: ["Japan is famous for very fast trains called bullet trains.", "Toyota, Honda and Nissan are Japanese."],
    cities: ["Osaka"],
    landmarks: [{ name: "Kinkaku-ji, a pavilion covered in gold leaf", city: "Kyoto" }],
    neighbours: [],
    flagDetail: { question: "What is in the middle of Japan's flag?", answer: "A red circle", wrong: ["A red star", "A red leaf", "A red cross"], why: "The red circle stands for the sun. Japan is sometimes called the land of the rising sun." },
  },
  {
    code: "cn", name: "China", capital: "Beijing", continent: "Asia",
    flagWords: "A red flag with five yellow stars in the corner.",
    facts: ["The Great Wall of China is thousands of kilometres long.", "Giant pandas live in China."],
    cities: ["Shanghai"],
    landmarks: [{ name: "The Great Wall of China, a wall that runs over mountains for thousands of kilometres", city: "Beijing" }],
    neighbours: ["India", "Russia", "Nepal", "Pakistan", "Mongolia"],
  },
  {
    code: "kr", name: "South Korea", capital: "Seoul", continent: "Asia",
    flagWords: "A white flag with a red and blue circle in the middle and four black marks around it.",
    facts: ["Hyundai and Kia are from South Korea.", "K-pop music and Korean dramas are watched and listened to all over the world."],
    cities: ["Busan"],
    landmarks: [{ name: "Gyeongbokgung, a grand old palace", city: "Seoul" }],
    neighbours: [],
  },
  {
    code: "br", name: "Brazil", capital: "Brasilia", continent: "South America",
    flagWords: "Green with a yellow diamond and a blue globe in the middle.",
    facts: ["Most of the Amazon rainforest is in Brazil.", "People in Brazil speak Portuguese."],
    cities: ["Sao Paulo"],
    landmarks: [{ name: "Christ the Redeemer, a giant statue on a mountain top", city: "Rio de Janeiro" }],
    neighbours: ["Argentina", "Peru", "Colombia", "Uruguay"],
  },
  {
    code: "mx", name: "Mexico", capital: "Mexico City", continent: "North America",
    flagWords: "Three stripes standing up: green, white and red, with an eagle in the middle.",
    facts: ["Mexico shares a long border with the United States.", "People in Mexico speak Spanish."],
    cities: ["Guadalajara"],
    landmarks: [{ name: "Chichen Itza, an ancient stone pyramid", city: "Merida" }],
    neighbours: ["United States", "Guatemala"],
  },
  {
    code: "au", name: "Australia", capital: "Canberra", continent: "Australia",
    flagWords: "Dark blue with a small Union Jack in the corner and white stars.",
    facts: ["Kangaroos and koalas live in Australia.", "Australia is a country and a continent at the same time."],
    cities: ["Melbourne"],
    landmarks: [{ name: "The Sydney Opera House, shaped like white sails", city: "Sydney" }],
    neighbours: [],
  },
  {
    code: "es", name: "Spain", capital: "Madrid", continent: "Europe",
    flagWords: "Red, yellow, red stripes lying down, with a badge on the yellow band.",
    facts: ["People in Spain speak Spanish.", "Flamenco, a passionate style of dance and guitar music, began in Spain."],
    cities: ["Barcelona"],
    landmarks: [{ name: "The Alhambra, an old palace with beautiful gardens", city: "Granada" }],
    neighbours: ["France", "Portugal"],
  },
  {
    code: "se", name: "Sweden", capital: "Stockholm", continent: "Europe",
    flagWords: "A blue flag with a yellow cross.",
    facts: ["Volvo cars come from Sweden.", "Flat-pack furniture you build yourself was made popular by IKEA, a Swedish company."],
    cities: ["Gothenburg"],
    neighbours: ["Norway", "Finland"],
  },
  // Checked against Wikidata (capital, continent) and the English Wikipedia's full article text (capital, land
  // borders, biggest city), both retrieved 2026-10-03. Landmarks and second cities are well known facts, checked
  // the same way as the six general CARS-FACTS questions in the first batch: not from one named source, but common
  // knowledge that is not in any real dispute. See content/REVIEW.md.
  {
    code: "np", name: "Nepal", capital: "Kathmandu", continent: "Asia",
    flagWords: "Shaped like two triangles stacked on top of each other, not a rectangle. Crimson red with a blue border, a white moon near the top and a white sun below it.",
    facts: ["Nepal is the only country in the world with a flag that is not a rectangle.", "Mount Everest, the tallest mountain on Earth, is on the border of Nepal and China."],
    cities: ["Pokhara"],
    landmarks: [{ name: "Mount Everest, the tallest mountain in the world", city: "Lukla" }],
    neighbours: ["China", "India"],
  },
  {
    code: "bd", name: "Bangladesh", capital: "Dhaka", continent: "Asia",
    flagWords: "Green, with a red circle set slightly toward the flagpole side.",
    facts: ["The Sundarbans, the world's largest mangrove forest, is in Bangladesh, and Royal Bengal tigers live there.", "Bangladesh has more rivers than almost any other country."],
    cities: ["Chittagong"],
    neighbours: ["India", "Myanmar"],
  },
  {
    code: "lk", name: "Sri Lanka", capital: "Colombo", skipCapitalQuestion: true, continent: "Asia",
    flagWords: "A gold border all around. On the left, stripes of green and orange. On the right, a dark red panel with a gold lion holding a sword.",
    facts: ["Sri Lanka is an island shaped a bit like a teardrop, just off the south coast of India.", "Sri Lanka grows and exports more tea than almost any other country."],
    cities: ["Kandy"],
    landmarks: [{ name: "The Temple of the Sacred Tooth Relic", city: "Kandy" }],
    neighbours: [],
  },
  {
    code: "pk", name: "Pakistan", capital: "Islamabad", continent: "Asia",
    flagWords: "Dark green with a white crescent moon and star, and a plain white stripe down the side closest to the flagpole.",
    facts: ["Pakistan is home to K2, the second tallest mountain in the world.", "The white stripe on Pakistan's flag stands for its religious minorities."],
    cities: ["Karachi"],
    landmarks: [{ name: "The Badshahi Mosque, one of the biggest mosques in the world", city: "Lahore" }],
    neighbours: ["India", "Afghanistan", "Iran", "China"],
  },
  {
    code: "bt", name: "Bhutan", capital: "Thimphu", continent: "Asia",
    flagWords: "Split diagonally: golden yellow on the top left, orange on the bottom right, with a white dragon across the middle.",
    facts: ["Bhutan is high in the Himalaya mountains, between India and China.", "Instead of only measuring money, Bhutan's government also measures Gross National Happiness."],
    cities: ["Paro"],
    landmarks: [{ name: "Paro Taktsang, the Tiger's Nest monastery, built onto the side of a cliff", city: "Paro" }],
    neighbours: ["China", "India"],
  },
  {
    code: "eg", name: "Egypt", capital: "Cairo", continent: "Africa",
    flagWords: "Red, white and black stripes lying down, with a golden eagle in the middle of the white stripe.",
    facts: ["The Great Pyramids of Giza, built thousands of years ago, are in Egypt.", "The Nile, one of the longest rivers in the world, flows through Egypt."],
    cities: ["Alexandria"],
    landmarks: [{ name: "The Great Pyramids of Giza", city: "Giza" }],
    neighbours: ["Israel", "Sudan", "Libya"],
  },
  {
    code: "ke", name: "Kenya", capital: "Nairobi", continent: "Africa",
    flagWords: "Black, red and green stripes lying down, separated by thin white lines, with a red, white and black shield and two crossed spears in the middle.",
    facts: ["The Maasai Mara reserve in Kenya is famous for lions, elephants and the wildebeest migration.", "Kenya sits right on the Equator."],
    cities: ["Mombasa"],
    neighbours: ["Ethiopia", "Somalia", "Tanzania", "Uganda"],
  },
  {
    code: "za", name: "South Africa", capital: "Pretoria", skipCapitalQuestion: true, continent: "Africa",
    flagWords: "Red on top and blue on the bottom, with a black triangle at the flagpole side outlined in gold, and a green band shaped like a Y outlined in white.",
    facts: ["South Africa has three capital cities: Pretoria, Cape Town and Bloemfontein.", "South Africa completely surrounds a small country called Lesotho."],
    cities: ["Johannesburg"],
    landmarks: [{ name: "Table Mountain, a mountain with a flat top", city: "Cape Town" }],
    neighbours: ["Namibia", "Botswana", "Zimbabwe", "Mozambique"],
  },
  {
    code: "ng", name: "Nigeria", capital: "Abuja", continent: "Africa",
    flagWords: "Green, white, green stripes standing up.",
    facts: ["Nigeria has more people than any other country in Africa.", "Nigeria's film industry, nicknamed Nollywood, makes more movies a year than almost anywhere else."],
    cities: ["Lagos"],
    neighbours: ["Niger", "Chad", "Cameroon", "Benin"],
  },
  {
    code: "ma", name: "Morocco", capital: "Rabat", continent: "Africa",
    flagWords: "Red, with a green five-pointed star outline in the middle.",
    facts: ["Morocco is in the northwest corner of Africa, just across the water from Spain.", "The Sahara, the world's largest hot desert, stretches into southern Morocco."],
    cities: ["Marrakesh"],
    landmarks: [{ name: "The Hassan II Mosque, one of the biggest mosques in the world", city: "Casablanca" }],
    neighbours: ["Algeria"],
  },
  {
    code: "ar", name: "Argentina", capital: "Buenos Aires", continent: "South America",
    flagWords: "Light blue, white, light blue stripes lying down, with a golden sun in the middle of the white stripe.",
    facts: ["Argentina stretches so far south that it reaches close to Antarctica.", "Football and tango both matter enormously in Argentina."],
    cities: ["Cordoba"],
    landmarks: [{ name: "Iguazu Falls, a huge, wide waterfall", city: "Puerto Iguazu" }],
    neighbours: ["Chile", "Bolivia", "Paraguay", "Brazil"],
  },
  {
    code: "pe", name: "Peru", capital: "Lima", continent: "South America",
    flagWords: "Red, white, red stripes standing up.",
    facts: ["Machu Picchu, an old Inca city high in the mountains, is in Peru.", "Part of the Amazon rainforest and part of the Andes mountains are both in Peru."],
    cities: ["Arequipa"],
    landmarks: [{ name: "Machu Picchu, an ancient city built high in the mountains", city: "Cusco" }],
    neighbours: ["Ecuador", "Colombia", "Brazil", "Bolivia", "Chile"],
  },
  {
    code: "cl", name: "Chile", capital: "Santiago", continent: "South America",
    flagWords: "White on the top left and red on the bottom, with a blue square in the top left corner holding a white star.",
    facts: ["Chile is a very long, thin country, running almost the whole west coast of South America.", "The Atacama Desert in Chile is one of the driest places on Earth."],
    cities: ["Valparaiso"],
    landmarks: [{ name: "The giant stone statues (moai) of Easter Island", city: "Hanga Roa" }],
    neighbours: ["Peru", "Bolivia", "Argentina"],
  },
  {
    code: "co", name: "Colombia", capital: "Bogota", continent: "South America",
    flagWords: "Yellow, blue, red stripes lying down, with the yellow stripe twice as wide as the other two.",
    facts: ["Colombia grows more coffee than almost any other country.", "Colombia has coastline on two different oceans, the Pacific and the Atlantic."],
    cities: ["Medellin"],
    neighbours: ["Panama", "Venezuela", "Brazil", "Peru", "Ecuador"],
  },
  {
    code: "cu", name: "Cuba", capital: "Havana", continent: "North America",
    flagWords: "Five stripes of blue and white, with a red triangle and a white star at the flagpole side.",
    facts: ["Cuba is the largest island in the Caribbean Sea.", "Many old classic cars from the 1950s are still driven every day in Cuba."],
    cities: ["Santiago de Cuba"],
    neighbours: [],
  },
  {
    code: "nl", name: "Netherlands", capital: "Amsterdam", continent: "Europe",
    flagWords: "Red, white, blue stripes lying down.",
    facts: ["About a quarter of the Netherlands is below sea level, held back by dikes.", "The Netherlands grows and sells more flowers, like tulips, than almost any other country."],
    cities: ["The Hague"],
    landmarks: [{ name: "The windmills of Kinderdijk", city: "Kinderdijk" }],
    neighbours: ["Germany", "Belgium"],
  },
  {
    code: "ch", name: "Switzerland", capital: "Bern", continent: "Europe",
    flagWords: "A square flag: red, with a white cross in the middle.",
    facts: ["Switzerland has four official languages: German, French, Italian and Romansh.", "The Matterhorn, one of the most famous mountains in the world, is in Switzerland."],
    cities: ["Zurich"],
    landmarks: [{ name: "The Matterhorn, a famous pointed mountain", city: "Zermatt" }],
    neighbours: ["Germany", "France", "Italy", "Austria"],
  },
  {
    code: "gr", name: "Greece", capital: "Athens", continent: "Europe",
    flagWords: "Nine stripes of blue and white lying down, with a white cross on a blue square in the corner.",
    facts: ["The Olympic Games began in ancient Greece.", "Greece has thousands of islands, though only a few hundred of them have people living on them."],
    cities: ["Thessaloniki"],
    landmarks: [{ name: "The Acropolis, an ancient hilltop with the Parthenon temple", city: "Athens" }],
    neighbours: ["Albania", "Turkey", "Bulgaria"],
  },
  {
    code: "ru", name: "Russia", capital: "Moscow", continent: "Europe and Asia", skipContinentQuestion: true,
    flagWords: "Three stripes lying down: white, blue and red.",
    facts: ["Russia is the biggest country in the world by far, so big that it crosses eleven time zones.", "Russia touches both Europe and Asia, with the Ural Mountains usually marking where one ends and the other begins."],
    cities: ["Saint Petersburg"],
    landmarks: [{ name: "Red Square, with Saint Basil's Cathedral and its colourful onion domes", city: "Moscow" }],
    neighbours: ["Norway", "Finland", "China", "Mongolia", "Ukraine"],
  },
  {
    code: "id", name: "Indonesia", capital: "Jakarta", continent: "Asia",
    flagWords: "Two stripes lying down: red on top, white on the bottom.",
    facts: ["Indonesia is made up of more islands than any other country, between thirteen and seventeen thousand of them.", "The famous island of Bali is part of Indonesia."],
    cities: ["Yogyakarta"],
    landmarks: [{ name: "Borobudur, a giant ancient stone temple", city: "Yogyakarta" }],
    neighbours: ["Malaysia", "Papua New Guinea"],
  },
  {
    code: "th", name: "Thailand", capital: "Bangkok", continent: "Asia",
    flagWords: "Five stripes lying down: red, white, a thick dark blue, white, red.",
    facts: ["Thailand is the only country in Southeast Asia that was never ruled by a European country.", "Elephants are a national symbol of Thailand."],
    cities: ["Chiang Mai"],
    landmarks: [{ name: "The Grand Palace, covered in gold", city: "Bangkok" }],
    neighbours: ["Myanmar", "Laos", "Cambodia", "Malaysia"],
  },
  {
    code: "nz", name: "New Zealand", capital: "Wellington", continent: "Oceania",
    flagWords: "Dark blue, with the Union Jack in the corner and four red stars outlined in white.",
    facts: ["New Zealand is made up of two main islands, called the North Island and the South Island.", "New Zealand was the first country where women won the right to vote, in 1893."],
    cities: ["Auckland"],
    landmarks: [{ name: "Hobbiton, a movie set built for The Hobbit and The Lord of the Rings", city: "Matamata" }],
    neighbours: [],
  },
];

const flagPicture = (c: Country) => ({ kind: "image" as const, src: `/flags/${c.code}.svg`, alt: `The flag of ${c.name}` });
const mapPicture = (c: Country) => ({ kind: "image" as const, src: `/maps/${c.code}.svg`, alt: `A map with ${c.name} coloured in` });
const bandFor = (c: Country): 1 | 2 | 3 => (FOCUS.includes(c.code) ? 1 : ["gb", "fr", "jp", "it", "de"].includes(c.code) ? 2 : 3);

function card(c: Country): Question["teach"] {
  const capitalLine = c.skipCapitalQuestion
    ? c.code === "lk"
      ? "Sri Lanka has two capitals: Colombo and Sri Jayawardenepura Kotte."
      : "South Africa has three capital cities: Pretoria, Cape Town and Bloemfontein."
    : `The capital city is ${c.capital}.`;
  return { title: c.name, lines: [c.flagWords, capitalLine, c.facts[0]], visual: { ...flagPicture(c), beside: mapPicture(c) } };
}

const others = (c: Country, n: number) =>
  pickSpread(COUNTRIES.filter((o) => o.code !== c.code && o.continent !== c.continent), n, c.code);

/** Other countries that are not a real land neighbour of c, so a "which country is next to X" decoy is never secretly true. */
const nonNeighbours = (c: Country, n: number) =>
  pickSpread(COUNTRIES.filter((o) => o.code !== c.code && o.continent !== c.continent && !c.neighbours.includes(o.name)), n, `${c.code}-neighbour`);

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
        topic: `country:${c.code}`,
        answer: choices(`world-flag-name-${c.code}`, c.name, decoys.map((o) => o.name)),
        explanation: `This is the flag of ${c.name}. ${c.flagWords}`,
        // The second fact never appears anywhere else in c's questions, so getting this one right still teaches
        // him something new rather than repeating what the explanation just said.
        didYouKnow: c.facts[1],
        band,
      }),
      question(FILE, {
        id: `world-flag-pick-${c.code}`,
        skills: ["WORLD-FLAGS"],
        prompt: `Which one of these is the flag of ${c.name}?`,
        teach: card(c),
        topic: `country:${c.code}`,
        answer: (() => {
          const picked = choices(`world-flag-pick-${c.code}`, c.name, decoys.map((o) => o.name));
          if (picked.type !== "choice") throw new Error("expected choices");
          return { ...picked, choiceVisuals: picked.choices.map((name) => flagPicture(COUNTRIES.find((o) => o.name === name)!)) };
        })(),
        explanation: `${c.name}'s flag: ${c.flagWords.toLowerCase()}`,
        band,
      }),
      question(FILE, {
        id: `world-map-${c.code}`,
        skills: ["WORLD-MAP"],
        prompt: "Which country is coloured in on this map?",
        visual: mapPicture(c),
        teach: card(c),
        topic: `country:${c.code}`,
        answer: choices(`world-map-${c.code}`, c.name, decoys.map((o) => o.name)),
        explanation: `This map shows ${c.name}.`,
        band: (band === 1 ? 2 : 3) as 2 | 3,
      }),
    );

    if (!c.skipCapitalQuestion) {
      out.push(
        question(FILE, {
          id: `world-capital-${c.code}`,
          skills: ["WORLD-CAPITALS"],
          prompt: `What is the capital city of ${c.name}?`,
          visual: flagPicture(c),
          teach: card(c),
          topic: `country:${c.code}`,
          answer: choices(`world-capital-${c.code}`, c.capital, decoys.map((o) => o.capital)),
          explanation: `The capital of ${c.name} is ${c.capital}.`,
          band: (band === 1 ? 2 : 3) as 2 | 3,
        }),
      );
    }

    if (!c.skipContinentQuestion) {
      out.push(
        question(FILE, {
          id: `world-continent-${c.code}`,
          skills: ["WORLD-MAP"],
          prompt: `Which continent is ${c.name} in?`,
          visual: flagPicture(c),
          teach: card(c),
          topic: `country:${c.code}`,
          answer: choices(`world-continent-${c.code}`, c.continent, [...new Set(decoys.map((o) => o.continent).filter((x) => x !== c.continent))]),
          explanation: `${c.name} is in ${c.continent}.`,
          band: (band === 1 ? 1 : 2) as 1 | 2,
        }),
      );
    }

    if (c.flagDetail) {
      out.push(
        question(FILE, {
          id: `world-flag-detail-${c.code}`,
          skills: ["WORLD-FLAGS-DETAIL"],
          prompt: c.flagDetail.question,
          visual: flagPicture(c),
          teach: card(c),
          topic: `country:${c.code}`,
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
          topic: `country:${c.code}`,
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

    // A big city that is not the capital: no flag or map shown, since either one would hand him the country.
    for (const city of c.cities.slice(0, 1)) {
      const cityId = `world-city-${c.code}`;
      out.push(
        question(FILE, {
          id: cityId,
          skills: ["WORLD-CITIES"],
          prompt: `Which country is the city of ${city} in?`,
          teach: card(c),
          topic: `country:${c.code}`,
          answer: choices(cityId, c.name, decoys.map((o) => o.name)),
          explanation: `${city} is a big city in ${c.name}.`,
          band: (band === 1 ? 2 : 3) as 2 | 3,
        }),
      );
    }

    // A named landmark and the city it is in: same reasoning, no visual that would name the country outright.
    for (const landmark of (c.landmarks ?? []).slice(0, 1)) {
      const landmarkId = `world-landmark-${c.code}`;
      const cityDecoys = pickSpread(COUNTRIES.filter((o) => o.code !== c.code), 3, landmarkId).map((o) => o.cities[0] ?? o.capital);
      out.push(
        question(FILE, {
          id: landmarkId,
          skills: ["WORLD-CITIES"],
          prompt: `${landmark.name} is a famous landmark. Which city is it in?`,
          teach: card(c),
          topic: `country:${c.code}`,
          answer: choices(landmarkId, landmark.city, cityDecoys),
          explanation: `${landmark.name} is in ${landmark.city}, ${c.name}.`,
          band: (band === 1 ? 2 : 3) as 2 | 3,
        }),
      );
    }

    // Which country is next to this one: no visual, and decoys are checked against the real neighbour list.
    if (c.neighbours.length > 0) {
      const neighbourId = `world-neighbour-${c.code}`;
      const neighbourDecoys = nonNeighbours(c, 3);
      out.push(
        question(FILE, {
          id: neighbourId,
          skills: ["WORLD-NEIGHBOURS"],
          prompt: `Which country shares a border with ${c.name}?`,
          teach: card(c),
          topic: `country:${c.code}`,
          answer: choices(neighbourId, c.neighbours[0], neighbourDecoys.map((o) => o.name)),
          explanation: `${c.neighbours[0]} shares a border with ${c.name}.`,
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
