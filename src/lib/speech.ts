import type { Question } from "@/content/schema";

// Emoji, flag letters, arrows, variation selectors and zero-width joiners.
const SYMBOLS = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}\u{2794}\u{27A1}\u{2B05}-\u{2B07}\u{FE0F}\u{200D}]/gu;

/** Removes emoji and arrows that text-to-speech would read as "red circle" or "heavy rightwards arrow". */
export function speakable(text: string): string {
  return text.replace(SYMBOLS, " ").replace(/\s+/g, " ").trim();
}

/** What the read-aloud button says: the prompt, then the choices if every choice still has words once symbols are removed. */
export function questionSpeech(question: Question): string {
  const prompt = question.speech ?? speakable(question.prompt);
  if (question.answer.type !== "choice") return prompt;
  const choices = question.answer.choices.map(speakable);
  if (choices.some((c) => c === "")) return prompt;
  return `${prompt} ${choices.map((c, i) => `${"ABCDE"[i]}: ${c}.`).join(" ")}`;
}
