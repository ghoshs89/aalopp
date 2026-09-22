import type { Question } from "@/content/schema";

// Emoji, flag letters, arrows, variation selectors and zero-width joiners.
const SYMBOLS = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}\u{2794}\u{27A1}\u{2B05}-\u{2B07}\u{FE0F}\u{200D}]/gu;

/** Removes emoji and arrows that text-to-speech would read as "red circle" or "heavy rightwards arrow". */
export function speakable(text: string): string {
  return text.replace(SYMBOLS, " ").replace(/\s+/g, " ").trim();
}

/** Read-aloud as parts: the question in English, then any word to hear in its own language. Passages are left for the child to read. */
export function questionSpeechParts(question: Question): { text: string; lang?: string }[] {
  const parts: { text: string; lang?: string }[] = [{ text: questionSpeech(question) }];
  if (question.listen) parts.push({ text: question.listen.text, lang: question.listen.lang });
  // Choices written in Spanish or French are read in that language's voice, one at a time.
  if (question.language !== "en" && question.answer.type === "choice") {
    const lang = { es: "es-ES", fr: "fr-FR" }[question.language];
    for (const choice of question.answer.choices) parts.push({ text: speakable(choice), lang });
  }
  return parts;
}

/** What the read-aloud button says: the prompt, then the choices if every choice still has words once symbols are removed. */
export function questionSpeech(question: Question): string {
  const prompt = question.speech ?? speakable(question.prompt);
  if (question.answer.type === "findTheBug") return `${prompt} ${question.answer.steps.map((s, i) => `Step ${i + 1}: ${speakable(s)}`).join(" ")}`;
  if (question.answer.type !== "choice" || question.language !== "en") return prompt;
  const choices = question.answer.choices.map(speakable);
  if (choices.some((c) => c === "")) return prompt;
  return `${prompt} ${choices.map((c, i) => `${"ABCDE"[i]}: ${c}.`).join(" ")}`;
}

/** Read-aloud for a teach card: its title, then each line. The card teaches a fact, so it is read like a prompt. */
export function teachSpeechParts(question: Question): { text: string; lang?: string }[] {
  if (!question.teach) return [];
  return [{ text: speakable([question.teach.title, ...question.teach.lines].join(". ")) }];
}
