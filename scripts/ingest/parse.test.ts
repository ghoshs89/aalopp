import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPageLines } from "./extract";
import { guessBand, linesToDrafts, parseAnswerKey, splitChoices } from "./parse";

describe("splitChoices", () => {
  it("splits lettered choices from the stem", () => {
    expect(splitChoices("How many? (A) 5 (B) 6 (C) 7")).toEqual({ stem: "How many?", choices: ["5", "6", "7"] });
  });

  it("leaves text alone when there are no real choices", () => {
    expect(splitChoices("Draw a line (A) here")).toEqual({ stem: "Draw a line (A) here", choices: [] });
  });
});

describe("guessBand and parseAnswerKey", () => {
  it("maps Kangaroo point sections to bands", () => {
    expect([1, 8, 9, 16, 17, 24, 25].map(guessBand)).toEqual([1, 1, 2, 2, 3, 3, 4]);
  });

  it("reads an answer key and ignores junk", () => {
    expect([...parseAnswerKey("1:B, 2=d, x:Q, 30:E")]).toEqual([
      [1, 1],
      [2, 3],
      [30, 4],
    ]);
  });
});

describe("linesToDrafts", () => {
  it("joins wrapped lines, ignores numbers inside a problem, and flags diagrams", () => {
    const drafts = linesToDrafts(
      [{ page: 1, lines: ["1. Look at the picture.", "How many dots? (A) 3", "(B) 4 (C) 5", "4 5 6", "2. Next one (A) x (B) y"] }],
      "demo",
      "demo.pdf",
      parseAnswerKey("1:B"),
    );
    expect(drafts.map((d) => d.id)).toEqual(["demo-p1", "demo-p2"]);
    expect(drafts[0]).toMatchObject({ prompt: "Look at the picture. How many dots?", choices: ["3", "4", "5 4 5 6"], correctIndex: 1, needsDiagram: true });
  });

  it("keeps two run-together problems as one draft with no choices instead of crashing", () => {
    const drafts = linesToDrafts([{ page: 1, lines: ["1. A (A) 1 (B) 2 (C) 3 (D) 4 (E) 5 (A) 6"] }], "demo", "demo.pdf");
    expect(drafts[0].choices).toEqual([]);
  });
});

describe("extractPageLines on a real PDF", () => {
  it("reads problems across pages from the sample contest", async () => {
    const pages = await extractPageLines(path.join(process.cwd(), "tests/fixtures/sample-contest.pdf"));
    const drafts = linesToDrafts(pages, "sample", "sample-contest.pdf", parseAnswerKey("1:C,9:B"));
    expect(drafts.map((d) => d.id)).toEqual(["sample-p1", "sample-p2", "sample-p3", "sample-p4", "sample-p9"]);
    expect(drafts[0]).toMatchObject({ choices: ["5", "6", "7", "8", "12"], correctIndex: 2, band: 1 });
    expect(drafts[2].needsDiagram).toBe(true);
    expect(drafts[4]).toMatchObject({ band: 2, correctIndex: 1, source: { ref: "sample-contest.pdf, page 2, problem 9" } });
  });
});
