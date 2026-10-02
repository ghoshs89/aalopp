import type { Question } from "@/content/schema";

/**
 * A Find the Bug answer can carry two taps: `index` is the first, and `secondIndex` the tap after a nudge to look at
 * earlier steps. Only the first is graded, so finding the bug with help never counts toward mastery.
 */
export type Response = { type: "choice"; index: number } | { type: "numeric"; value: number } | { type: "step"; index: number; secondIndex?: number };

export function isCorrect(question: Question, response: Response): boolean {
  const { answer } = question;
  if (answer.type === "choice") return response.type === "choice" && response.index === answer.correctIndex;
  if (answer.type === "findTheBug") return response.type === "step" && response.index === answer.bugIndex;
  return response.type === "numeric" && response.value === answer.value;
}
