import type { Question } from "@/content/schema";

export type Response = { type: "choice"; index: number } | { type: "numeric"; value: number } | { type: "step"; index: number };

export function isCorrect(question: Question, response: Response): boolean {
  const { answer } = question;
  if (answer.type === "choice") return response.type === "choice" && response.index === answer.correctIndex;
  if (answer.type === "findTheBug") return response.type === "step" && response.index === answer.bugIndex;
  return response.type === "numeric" && response.value === answer.value;
}
