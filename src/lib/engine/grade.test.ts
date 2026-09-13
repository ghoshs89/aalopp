import { describe, expect, it } from "vitest";
import { questionsById } from "@/content/bank";
import { isCorrect } from "./grade";

describe("isCorrect", () => {
  const choice = questionsById.get("md-car-wash-clock-half")!;
  const numeric = questionsById.get("md-car-wash-change")!;

  it("grades multiple choice by index", () => {
    expect(isCorrect(choice, { type: "choice", index: 2 })).toBe(true);
    expect(isCorrect(choice, { type: "choice", index: 0 })).toBe(false);
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

  it("never accepts a response of the wrong type", () => {
    expect(isCorrect(choice, { type: "numeric", value: 2 })).toBe(false);
    expect(isCorrect(numeric, { type: "choice", index: 0 })).toBe(false);
  });
});
