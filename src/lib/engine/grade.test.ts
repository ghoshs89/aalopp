import { describe, expect, it } from "vitest";
import { questionsById } from "@/content/bank";
import { isCorrect } from "./grade";

describe("isCorrect", () => {
  const choice = questionsById.get("md-car-wash-clock-half")!;
  const numeric = questionsById.get("md-car-wash-change")!;

  it("grades multiple choice by index and by choice text when present", () => {
    expect(isCorrect(choice, { type: "choice", index: 2 })).toBe(true);
    expect(isCorrect(choice, { type: "choice", index: 0 })).toBe(false);
    const rightText = choice.answer.type === "choice" ? choice.answer.choices[choice.answer.correctIndex] : "";
    const wrongText = choice.answer.type === "choice" ? choice.answer.choices[0] : "";
    // Even if choices were reordered after an offline answer was queued, the stored choice text preserves the true grade.
    expect(isCorrect(choice, { type: "choice", index: 0, value: rightText })).toBe(true);
    expect(isCorrect(choice, { type: "choice", index: 2, value: wrongText })).toBe(false);
  });

  it("grades interactive ordering answers element by element", () => {
    const orderQuestion = {
      ...choice,
      answer: { type: "order" as const, items: ["Blue", "Green", "Red"], correctOrder: ["Green", "Blue", "Red"] },
    };
    expect(isCorrect(orderQuestion, { type: "order", order: ["Green", "Blue", "Red"] })).toBe(true);
    expect(isCorrect(orderQuestion, { type: "order", order: ["Blue", "Green", "Red"] })).toBe(false);
    expect(isCorrect(orderQuestion, { type: "order", order: ["Green", "Blue"] })).toBe(false);
  });

  it("grades numeric answers by value", () => {
    expect(isCorrect(numeric, { type: "numeric", value: 12 })).toBe(true);
    expect(isCorrect(numeric, { type: "numeric", value: 28 })).toBe(false);
  });

  it("grades find-the-bug by the first wrong step only", () => {
    const bug = questionsById.get("dbg-add-47-38-carry")!;
    expect(bug.answer.type).toBe("findTheBug");
    expect(isCorrect(bug, { type: "step", index: 2 })).toBe(true);
    expect(isCorrect(bug, { type: "step", index: 3 })).toBe(false);
    expect(isCorrect(bug, { type: "choice", index: 2 })).toBe(false);
  });

  it("grades find-the-bug on the first tap, even when the tap after a nudge is right", () => {
    const bug = questionsById.get("dbg-add-47-38-carry")!;
    expect(isCorrect(bug, { type: "step", index: 3, secondIndex: 2 })).toBe(false);
  });

  it("never accepts a response of the wrong type", () => {
    expect(isCorrect(choice, { type: "numeric", value: 2 })).toBe(false);
    expect(isCorrect(numeric, { type: "choice", index: 0 })).toBe(false);
  });
});
