import { writeFileSync } from "node:fs";
import path from "node:path";
import { extractPageLines } from "./extract";
import { linesToDrafts, parseAnswerKey } from "./parse";

// Usage: npm run content:ingest -- <file.pdf> [--slug name] [--answers "1:B,2:D"]
async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true);
  if (!file) {
    console.error('Usage: npm run content:ingest -- <file.pdf> [--slug name] [--answers "1:B,2:D"]');
    process.exit(1);
  }
  const flag = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const fileName = path.basename(file);
  const slug = flag("slug") ?? fileName.replace(/\.pdf$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pages = await extractPageLines(file);
  const drafts = linesToDrafts(pages, slug, fileName, parseAnswerKey(flag("answers")));
  const out = path.join(process.cwd(), "content/drafts", `${slug}.json`);
  writeFileSync(out, `${JSON.stringify(drafts, null, 2)}\n`);
  const textless = pages.every((p) => p.lines.length === 0);
  console.log(`${drafts.length} draft questions written to ${path.relative(process.cwd(), out)}`);
  if (textless) console.log("No text layer found. This looks like a scanned PDF; type the problems in or run it through OCR first.");
  console.log(`${drafts.filter((d) => d.needsDiagram).length} need a diagram, ${drafts.filter((d) => d.correctIndex === null).length} have no answer yet.`);
}

main();
