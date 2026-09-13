import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GENERATED, renderFile } from "./index";

describe("generated question files", () => {
  it.each(Object.keys(GENERATED))("%s matches its generator (run npm run content:generate)", (file) => {
    const onDisk = readFileSync(path.join(process.cwd(), "content/questions", file), "utf8");
    expect(onDisk).toBe(renderFile(GENERATED[file]()));
  });
});
