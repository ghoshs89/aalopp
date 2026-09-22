/**
 * Downloads the pictures listed in content/assets.json into public/flags and public/logos.
 *
 * Artwork is committed to the repo, so this is a one-off developer step to restore or add a file, never something the
 * app does. Nothing is hotlinked at runtime. Existing files are left alone unless --force is passed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Entry = { file: string; name: string; sourceUrl: string; retrieved: string; licence: string };
type Manifest = { flags: Entry[]; logos: Entry[] };

const manifest: Manifest = JSON.parse(readFileSync(path.join(process.cwd(), "content/assets.json"), "utf8"));
const force = process.argv.includes("--force");

async function download(folder: string, entry: Entry): Promise<"saved" | "kept" | "failed"> {
  const target = path.join(process.cwd(), "public", folder, entry.file);
  if (existsSync(target) && !force) return "kept";
  let body: Buffer;
  try {
    const response = await fetch(entry.sourceUrl, { headers: { "user-agent": "aalopp-family-learning/1.0" } });
    if (!response.ok) {
      console.error(`  ${entry.file}: HTTP ${response.status} from ${entry.sourceUrl}`);
      return "failed";
    }
    body = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`  ${entry.file}: ${error instanceof Error ? error.message : String(error)}`);
    return "failed";
  }
  // A site that answers a missing file with its own HTML page would otherwise be saved as a broken picture.
  if (entry.file.endsWith(".svg") && !body.subarray(0, 600).toString("utf8").toLowerCase().includes("<svg")) {
    console.error(`  ${entry.file}: the reply was not SVG, so it was not saved`);
    return "failed";
  }
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, body);
  return "saved";
}

async function main(): Promise<void> {
  let failures = 0;
  for (const folder of ["flags", "logos"] as const) {
    const entries = manifest[folder];
    if (entries.length === 0) continue;
    console.log(`${folder}: ${entries.length} listed`);
    const results = await Promise.all(entries.map((e) => download(folder, e)));
    const count = (what: string) => results.filter((r) => r === what).length;
    failures += count("failed");
    console.log(`  saved ${count("saved")}, already present ${count("kept")}, failed ${count("failed")}`);
  }
  if (failures > 0) {
    console.error(`\n${failures} file(s) could not be downloaded. Fix the sourceUrl in content/assets.json and run again.`);
    process.exit(1);
  }
}

void main();
