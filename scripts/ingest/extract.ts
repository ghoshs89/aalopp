import { readFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PageLines } from "./parse";

type TextItem = { str: string; transform: number[] };

/** Reads a PDF's text layer and rebuilds lines by grouping text runs that share a baseline. Scanned PDFs with no text layer return empty pages. */
export async function extractPageLines(path: string): Promise<PageLines[]> {
  const data = new Uint8Array(readFileSync(path));
  const task = getDocument({ data, useSystemFonts: true });
  const doc = await task.promise;
  const pages: PageLines[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as TextItem[]) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      rows.set(y, [...(rows.get(y) ?? []), { x: item.transform[4], str: item.str }]);
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, runs]) => runs.sort((a, b) => a.x - b.x).map((r) => r.str).join(" ").replace(/\s+/g, " ").trim());
    pages.push({ page: n, lines });
  }
  await task.destroy();
  return pages;
}
