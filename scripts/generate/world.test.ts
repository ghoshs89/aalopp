import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { worldQuestions } from "./world";

const questions = worldQuestions();
const byId = new Map(questions.map((q) => [q.id, q]));

describe("worldQuestions", () => {
  it("never offers a real neighbour as a wrong answer to a neighbour question", () => {
    // The explanation always states the one neighbour the question is built from; the wrong choices must be
    // countries that are not actually next to it, or the question would have more than one right answer.
    const neighbourQuestions = questions.filter((q) => q.id.startsWith("world-neighbour-"));
    expect(neighbourQuestions.length).toBeGreaterThan(10);
    for (const q of neighbourQuestions) {
      expect(q.answer.type).toBe("choice");
      if (q.answer.type !== "choice") continue;
      const correctNeighbour = q.explanation.split(" shares a border with ")[0];
      for (const [i, choiceText] of q.answer.choices.entries()) {
        if (i === q.answer.correctIndex) continue;
        expect(choiceText, `${q.id}: wrong choice "${choiceText}"`).not.toBe(correctNeighbour);
      }
    }
  });

  it("skips the capital question for Sri Lanka and South Africa, which both have more than one", () => {
    expect(byId.has("world-capital-lk")).toBe(false);
    expect(byId.has("world-capital-za")).toBe(false);
    // The teach card on some other question for each still names the capital situation, rather than one answer.
    const lk = questions.find((q) => q.id === "world-flag-name-lk")!;
    expect(lk.teach!.lines.join(" ")).toMatch(/two capitals/i);
    const za = questions.find((q) => q.id === "world-flag-name-za")!;
    expect(za.teach!.lines.join(" ")).toMatch(/three capital/i);
  });

  it("skips the continent question for Russia, which spans two continents", () => {
    expect(byId.has("world-continent-ru")).toBe(false);
  });

  it("points every flag and map picture at a file committed under public/", () => {
    const committed = (src: string) => existsSync(path.join(process.cwd(), "public", src));
    for (const q of questions) {
      const teachVisual = q.teach?.visual;
      for (const visual of [q.visual, teachVisual]) {
        if (visual?.kind === "image") expect(committed(visual.src), `${q.id}: ${visual.src} is not committed`).toBe(true);
      }
      const beside = teachVisual?.kind === "image" ? teachVisual.beside : undefined;
      if (beside) expect(committed(beside.src), `${q.id}: ${beside.src} is not committed`).toBe(true);
    }
  });

  it("never lets a Did You Know repeat the question's own explanation", () => {
    const withDidYouKnow = questions.filter((q) => q.didYouKnow);
    expect(withDidYouKnow.length).toBeGreaterThan(10);
    for (const q of withDidYouKnow) expect(q.didYouKnow).not.toBe(q.explanation);
  });

  it("tags every question with its country, so selectSession can cap one per session", () => {
    // The one-question-per-topic rule itself lives in selectSession.test.ts; this only checks the tagging it
    // depends on, since an untagged question would silently skip that rule. The two chart questions are about a
    // made up class survey spanning several countries at once, not any one country, so they are the one exception.
    const untagged = questions.filter((q) => !q.topic && !q.id.startsWith("world-chart-"));
    expect(untagged, untagged.map((q) => q.id).join(", ")).toHaveLength(0);
  });
});
