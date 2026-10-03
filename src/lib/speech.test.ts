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

  it("does not read choice names for picture choices, since the picture is the question", () => {
    const q = questionsById.get("world-flag-pick-ca")!;
    expect(q.answer.type).toBe("choice");
    const spoken = questionSpeech(q);
    expect(spoken).toBe(q.speech ?? speakable(q.prompt));
    // The prompt itself names the country being asked about ("the flag of Canada"); it is the other, wrong
    // choices that must never be spoken, since naming any of them would answer the question for him.
    const wrongChoices = (q.answer as { choices: string[]; correctIndex: number }).choices.filter((_, i) => i !== (q.answer as { correctIndex: number }).correctIndex);
    expect(wrongChoices.length).toBeGreaterThan(0);
    for (const name of wrongChoices) expect(spoken).not.toContain(name);
  });
});

describe("questionSpeechParts", () => {
  it("adds the word to hear in its own language", async () => {
    const { questionSpeechParts } = await import("./speech");
    const q = questionsById.get("lang-es-hear-dog")!;
    const parts = questionSpeechParts(q);
    expect(parts.at(-1)).toEqual({ text: "el perro", lang: "es-ES" });
    expect(parts[0].text).toContain("Listen to the Spanish word");
  });

  it("reads French choices in the French voice and leaves them out of the English part", async () => {
    const { questionSpeechParts } = await import("./speech");
    const q = questionsById.get("lang-fr-count-3")!;
    const parts = questionSpeechParts(q);
    expect(parts[0].text).not.toContain("trois");
    expect(parts.slice(1).every((p) => p.lang === "fr-FR")).toBe(true);
    expect(parts.slice(1).map((p) => p.text)).toContain("trois");
  });

  it("never reads a reading passage aloud", async () => {
    const { questionSpeechParts } = await import("./speech");
    const q = questionsById.get("read-soccer-when")!;
    expect(questionSpeechParts(q).map((p) => p.text).join(" ")).not.toContain("muddy");
  });
});
