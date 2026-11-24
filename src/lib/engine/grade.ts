import type { Question } from "@/content/schema";

/**
 * A Find the Bug answer can carry two taps: `index` is the first, and `secondIndex` the tap after a nudge to look at
 * earlier steps. Only the first is graded, so finding the bug with help never counts toward mastery.
 * Choice responses may also carry the selected label (`value`) so a future choice reorder never flips an offline grade.
 */
export type Response =
  | { type: "choice"; index: number; value?: string }
  | { type: "numeric"; value: number }
  | { type: "step"; index: number; secondIndex?: number }
  | { type: "order"; order: string[] };

export function isCorrect(question: Question, response: Response): boolean {
  const { answer } = question;
  if (answer.type === "choice") {
    if (response.type !== "choice") return false;
    if (typeof response.value === "string" && answer.choices.includes(response.value)) {
      return response.value === answer.choices[answer.correctIndex];
    }
    return response.index === answer.correctIndex;
  }
  if (answer.type === "findTheBug") return response.type === "step" && response.index === answer.bugIndex;
  if (answer.type === "order") {
    return (
      response.type === "order" &&
      response.order.length === answer.correctOrder.length &&
      response.order.every((item, i) => item === answer.correctOrder[i])
    );
  }
  return response.type === "numeric" && response.value === answer.value;
}
