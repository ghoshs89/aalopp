import type { Question } from "../../src/content/schema";
import { assert, choices, question, type Draft } from "./helpers";

const FILE = "languages.ts";

type Lang = "es" | "fr";
const VOICE = { es: "es-ES", fr: "fr-FR" } as const;
const NAME = { es: "Spanish", fr: "French" } as const;

// Everyday nouns with their article, chosen to avoid words that differ by region (for example car is "coche" or "carro").
const WORDS: { en: string; emoji: string; es: string; fr: string }[] = [
  { en: "Dog", emoji: "🐶", es: "el perro", fr: "le chien" },
  { en: "Cat", emoji: "🐱", es: "el gato", fr: "le chat" },
  { en: "Apple", emoji: "🍎", es: "la manzana", fr: "la pomme" },
  { en: "House", emoji: "🏠", es: "la casa", fr: "la maison" },
  { en: "Sun", emoji: "☀️", es: "el sol", fr: "le soleil" },
  { en: "Book", emoji: "📖", es: "el libro", fr: "le livre" },
  { en: "Bird", emoji: "🐦", es: "el pájaro", fr: "l'oiseau" },
];
const COLORS: { en: string; emoji: string; es: string; fr: string }[] = [
  { en: "Red", emoji: "🔴", es: "rojo", fr: "rouge" },
  { en: "Blue", emoji: "🔵", es: "azul", fr: "bleu" },
  { en: "Green", emoji: "🟢", es: "verde", fr: "vert" },
  { en: "Yellow", emoji: "🟡", es: "amarillo", fr: "jaune" },
];
const NUMBERS = { es: ["uno", "dos", "tres", "cuatro", "cinco"], fr: ["un", "deux", "trois", "quatre", "cinq"] };
// Meanings are chosen so no two choices overlap (bonjour means both hello and good day, so good morning is never offered beside it).
const PHRASES: { en: string; es: string; fr: string }[] = [
  { en: "Hello", es: "hola", fr: "bonjour" },
  { en: "Goodbye", es: "adiós", fr: "au revoir" },
  { en: "Thank you", es: "gracias", fr: "merci" },
  { en: "Please", es: "por favor", fr: "s'il vous plaît" },
  { en: "Good night", es: "buenas noches", fr: "bonne nuit" },
];

const others = <T,>(list: T[], item: T, count: number, offset: number) => {
  const rest = list.filter((x) => x !== item);
  return Array.from({ length: Math.min(count, rest.length) }, (_, i) => rest[(offset + i) % rest.length]);
};

function hearAndPick(lang: Lang): Draft[] {
  return WORDS.slice(0, 5).map((w, i) => ({
    id: `lang-${lang}-hear-${w.en.toLowerCase()}`,
    skills: [`LANG-${lang.toUpperCase()}-WORDS`],
    prompt: `Listen to the ${NAME[lang]} word. Which picture does it name?`,
    listen: { text: w[lang], lang: VOICE[lang] },
    answer: choices(`lang-${lang}-hear-${w.en}`, `${w.emoji} ${w.en}`, others(WORDS, w, 3, i).map((o) => `${o.emoji} ${o.en}`)),
    explanation: `"${w[lang]}" is ${NAME[lang]} for ${w.en.toLowerCase()}.`,
    band: 1,
  }));
}

function sayTheWord(lang: Lang): Draft[] {
  const picks = [WORDS[5], WORDS[6], COLORS[1], COLORS[3]];
  return picks.map((w, i) => {
    const pool = WORDS.includes(w) ? WORDS : COLORS;
    const isColor = pool === COLORS;
    return {
      id: `lang-${lang}-say-${w.en.toLowerCase()}`,
      skills: [`LANG-${lang.toUpperCase()}-WORDS`],
      prompt: `${isColor ? "What is this color" : "What is this"} in ${NAME[lang]}? Tap your answer. If you see the 🎤 button, you can say it instead.`,
      visual: { kind: "emoji", lines: [w.emoji] },
      voiceAnswer: true,
      language: lang,
      answer: choices(`lang-${lang}-say-${w.en}`, w[lang], others(pool, w, 3, i).map((o) => o[lang])),
      explanation: `${w.en} in ${NAME[lang]} is "${w[lang]}".`,
      band: 2,
    };
  });
}

function countInLanguage(lang: Lang): Draft[] {
  return ([3, 4] as const).map((n, i) => ({
    id: `lang-${lang}-count-${n}`,
    skills: [`LANG-${lang.toUpperCase()}-WORDS`, "MATH-NBT-COUNTING"],
    prompt: `How many soccer balls are there? Answer in ${NAME[lang]}. If you see the 🎤 button, you can say it instead.`,
    visual: { kind: "emoji", lines: ["⚽".repeat(n)] },
    voiceAnswer: true,
    language: lang,
    answer: choices(`lang-${lang}-count-${n}`, NUMBERS[lang][n - 1], others(NUMBERS[lang], NUMBERS[lang][n - 1], 3, i + 1)),
    explanation: `There are ${n} balls. ${n} in ${NAME[lang]} is "${NUMBERS[lang][n - 1]}". Counting: ${NUMBERS[lang].slice(0, n).join(", ")}.`,
    band: 1,
  }));
}

function phrases(lang: Lang): Draft[] {
  const drafts: Draft[] = PHRASES.slice(0, 4).map((p, i) => ({
    id: `lang-${lang}-phrase-${p.en.toLowerCase().replace(/\s+/g, "-")}`,
    skills: [`LANG-${lang.toUpperCase()}-PHRASES`],
    prompt: `Listen to the ${NAME[lang]}. What does it mean?`,
    listen: { text: PHRASES[i][lang], lang: VOICE[lang] },
    answer: choices(`lang-${lang}-phrase-${p.en}`, p.en, others(PHRASES, p, 3, i).map((o) => o.en)),
    explanation: `"${p[lang]}" means "${p.en.toLowerCase()}".`,
    band: 2,
  }));
  const thanks = PHRASES[2];
  drafts.push({
    id: `lang-${lang}-phrase-when-given-a-gift`,
    skills: [`LANG-${lang.toUpperCase()}-PHRASES`],
    prompt: `A friend gives you a present. What do you say in ${NAME[lang]}? Tap your answer. If you see the 🎤 button, you can say it instead.`,
    visual: { kind: "emoji", lines: ["🎁"] },
    voiceAnswer: true,
    language: lang,
    answer: choices(`lang-${lang}-gift`, thanks[lang], others(PHRASES, thanks, 3, 0).map((o) => o[lang])),
    explanation: `When someone gives you something, you say thank you. In ${NAME[lang]} that is "${thanks[lang]}".`,
    band: 2,
  });
  return drafts;
}

function reading(): Draft[] {
  const soccer = "Maya's soccer team played on Saturday morning. It rained, so the field was muddy. Maya kicked the ball hard, but it stopped in a puddle. Her friend Leo ran over and scored a goal. After the game, everyone's socks were brown.";
  const tower = "Sam wanted to build the tallest tower. He stacked eight blocks. The tower wobbled. Sam took off the top two blocks, and the tower stood still. Then he smiled.";
  const chess = "Grandpa and Ava play chess every Sunday. Ava always plays with the white pieces, so she moves first. Last week Grandpa won. This week Ava won, and Grandpa shook her hand.";
  const pit = "The race car was fast, but it needed gas. The driver stopped at the pit. The crew filled the tank and changed a flat tire. Then the car zoomed back onto the track.";
  const q = (id: string, passage: string, skill: "DETAIL" | "INFER", prompt: string, right: string, wrong: string[], explanation: string, band: 2 | 3): Draft => ({
    id,
    skills: [`LANG-EN-READ-${skill}`],
    passage,
    prompt,
    answer: choices(id, right, wrong),
    explanation,
    band,
  });
  assert(8 - 2 === 6, "tower arithmetic");
  return [
    q("read-soccer-when", soccer, "DETAIL", "When did Maya's team play?", "Saturday morning", ["Sunday morning", "Saturday night", "Friday afternoon"], 'The first sentence says they played "on Saturday morning."', 2),
    q("read-soccer-who-scored", soccer, "DETAIL", "Who scored the goal?", "Leo", ["Maya", "The coach", "Nobody"], "Maya's kick stopped in a puddle. Then Leo ran over and scored a goal.", 2),
    q("read-soccer-brown-socks", soccer, "INFER", "Why were everyone's socks brown after the game?", "The field was muddy", ["They wore brown socks", "The ball was brown", "They painted their socks"], "The story says it rained and the field was muddy. Playing in mud makes socks brown. The story does not say this, so you have to work it out.", 3),
    q("read-tower-how-many", tower, "DETAIL", "How many blocks were in the tower at the end?", "6", ["8", "2", "10"], "Sam stacked 8 blocks, then took off the top 2. 8 - 2 = 6 blocks were left.", 3),
    q("read-tower-why-smile", tower, "INFER", "Why did Sam smile at the end?", "His tower stopped wobbling", ["His tower fell down", "He found more blocks", "He wanted to go outside"], "Just before he smiled, the tower stood still. He was happy it stopped wobbling.", 3),
    q("read-chess-first-move", chess, "DETAIL", "Who moves first in their chess games?", "Ava", ["Grandpa", "Whoever won last week", "They take turns going first"], "Ava always plays with the white pieces, so she moves first.", 2),
    q("read-chess-how-often", chess, "DETAIL", "How often do Grandpa and Ava play chess?", "Every Sunday", ["Every day", "Every Saturday", "Once a year"], 'The first sentence says they play "every Sunday."', 2),
    q("read-chess-good-sport", chess, "INFER", "How did Grandpa show he was a good sport when he lost?", "He shook Ava's hand", ["He won the game", "He moved first", "He played every Sunday"], "Grandpa lost this week, and he shook Ava's hand. Shaking hands after losing is being a good sport.", 3),
    q("read-pit-why-stop", pit, "INFER", "Why did the driver stop at the pit?", "The car needed gas", ["The race was over", "The driver was tired", "It started to rain"], "The story says the car needed gas, and the crew filled the tank at the pit.", 2),
    q("read-pit-what-else", pit, "DETAIL", "What else did the crew do besides filling the tank?", "Changed a flat tire", ["Washed the car", "Fixed the steering wheel", "Painted the car"], "The crew filled the tank and changed a flat tire.", 2),
  ];
}

export const languageQuestions = (): Question[] =>
  [...reading(), ...(["es", "fr"] as const).flatMap((lang) => [...hearAndPick(lang), ...sayTheWord(lang), ...countInLanguage(lang), ...phrases(lang)])].map((d) => question(FILE, d));
