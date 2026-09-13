export type VoiceLike = { name: string; lang: string };

const PREFERRED: Record<string, string[]> = {
  en: ["Samantha", "Google US English", "Microsoft Aria", "Karen", "Daniel"],
  es: ["Monica", "Paulina", "Google español", "Microsoft Helena", "Jorge"],
  fr: ["Amelie", "Thomas", "Google français", "Microsoft Denise", "Audrey"],
};

/** Best available voice for a language tag like "es-ES": a preferred friendly voice, then an exact match, then any voice for that language. */
export function pickVoice<V extends VoiceLike>(voices: V[], lang: string): V | null {
  const base = lang.slice(0, 2).toLowerCase();
  const sameLanguage = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(base));
  return (
    (PREFERRED[base] ?? []).map((name) => sameLanguage.find((v) => v.name.includes(name))).find((v): v is V => Boolean(v)) ??
    sameLanguage.find((v) => v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase()) ??
    sameLanguage[0] ??
    null
  );
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
