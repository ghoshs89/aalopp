import { describe, expect, it } from "vitest";
import { questionsById } from "@/content/bank";
import { questionSpeech, speakable } from "./speech";

describe("speakable", () => {
  it("drops emoji, arrows and joiners but keeps words, numbers and money", () => {
    expect(speakable("🏎️ $3 ➔ 🐞 costs 50¢ 👩‍👧")).toBe("$3 costs 50¢");
  });
});

describe("questionSpeech", () => {
  it("reads the prompt and lettered choices when the choices have words", () => {
    expect(questionSpeech(questionsById.get("md-race-clock-quarter")!)).toBe(
      "The go-kart race begins at the time on this clock. What time is it? A: 2:15. B: 3:15. C: 2:03. D: 3:10.",
    );
  });

  it("uses the speech override and skips choices that are only emoji", () => {
    const robot = questionsById.get("bb-robot-chef-buttons")!;
    expect(questionSpeech(robot)).toBe(robot.speech);
  });

  it("reads every step of a find-the-bug question in order", () => {
    const q = questionsById.get("dbg-ruler-truck-offset")!;
    expect(questionSpeech(q)).toBe(`${q.prompt} Step 1: The truck starts at 2. Step 2: The truck ends at 7. Step 3: So the truck is 7 inches long.`);
  });

  it("does not read choices for numeric questions", () => {
    const q = questionsById.get("md-beach-drive-minutes")!;
    expect(questionSpeech(q)).toBe(q.prompt);
  });
});
