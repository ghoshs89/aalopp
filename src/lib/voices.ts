export type VoiceLike = { name: string; lang: string; localService?: boolean; default?: boolean };

// Higher-quality voices, by the words platforms put in their names.
const NATURAL = /\b(natural|neural|premium|enhanced|online|siri)\b/i;
// Well-liked voices that usually sound human, per language.
const FRIENDLY: Record<string, RegExp> = {
  en: /\b(ava|zoe|allison|samantha|evan|nathan|joelle|aria|jenny|guy|libby|sonia|google us english|google uk english female)\b/i,
  es: /\b(monica|paulina|marisol|elvira|dalia|google espa)/i,
  fr: /\b(amelie|am\u00e9lie|thomas|audrey|denise|google fran)/i,
};
// macOS novelty voices and synthetic engines that sound robotic.
const ROBOTIC = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|fred|good news|jester|junior|kathy|organ|ralph|superstar|trinoids|whisper|wobble|zarvox|espeak|compact)\b/i;

/** How natural a voice is likely to sound for a language, highest first. Voices in another language score below zero. */
export function voiceScore(voice: VoiceLike, lang: string): number {
  const tag = voice.lang.toLowerCase().replace("_", "-");
  const wanted = lang.toLowerCase();
  const base = wanted.slice(0, 2);
  if (!tag.startsWith(base)) return -1000;
  let score = tag === wanted ? 20 : 10;
  if (NATURAL.test(voice.name)) score += 40;
  if (FRIENDLY[base]?.test(voice.name)) score += 25;
  // Chrome's and Edge's network voices (localService false) are usually far more natural than basic built-in ones.
  if (voice.localService === false) score += 15;
  if (/google/i.test(voice.name)) score += 10;
  if (ROBOTIC.test(voice.name)) score -= 100;
  if (voice.default) score += 2;
  return score;
}

/** The most natural-sounding available voice for a language tag like "en-US", or null if the device has none for that language. */
export function pickVoice<V extends VoiceLike>(voices: V[], lang: string): V | null {
  let best: V | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const score = voiceScore(v, lang);
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return bestScore < 0 ? null : best;
}

const ARTICLES = new Set(["the", "a", "an", "el", "la", "los", "las", "un", "una", "le", "les", "l", "une", "des"]);

/** Lowercase, no accents or punctuation, no leading articles or emoji: "¡El Perro! 🐶" becomes "perro". */
export function normalizeSpoken(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/'/g, " ")
    .split(/\s+/)
    .filter((w) => w && !ARTICLES.has(w))
    .join(" ");
}

/** Index of the choice the child said, or null. Any of the recognizer's alternatives may match; exactly one choice must. */
export function matchSpokenChoice(alternatives: string[], choices: string[]): number | null {
  const normalizedChoices = choices.map(normalizeSpoken);
  for (const heard of alternatives.map(normalizeSpoken)) {
    if (!heard) continue;
    const exact = normalizedChoices.flatMap((c, i) => (c === heard ? [i] : []));
    if (exact.length === 1) return exact[0];
    const contained = normalizedChoices.flatMap((c, i) => (c && (` ${heard} `.includes(` ${c} `) || ` ${c} `.includes(` ${heard} `)) ? [i] : []));
    if (contained.length === 1) return contained[0];
  }
  return null;
}
