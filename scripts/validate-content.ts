import { loadContent } from "../src/content/load";

const { skills, questions, issues } = loadContent();

if (issues.length > 0) {
  console.error(`Content check failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    const where = [issue.file, issue.path].filter(Boolean).join(" > ");
    console.error(`  ${where}: ${issue.message}`);
  }
  process.exit(1);
}

const strandOf = new Map(skills.map((s) => [s.code, s.strand]));
const countBy = (keys: string[]) =>
  keys.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }), {});

console.log(`OK: ${skills.length} skills, ${questions.length} questions`);
console.log("By primary strand:", countBy(questions.map(({ question }) => strandOf.get(question.skills[0]) ?? "?")));
console.log("By band:", countBy(questions.map(({ question }) => `band ${question.difficulty.band}`)));
console.log("By review status:", countBy(questions.map(({ question }) => question.reviewStatus)));

const untested = skills.filter((s) => !questions.some(({ question }) => question.skills.includes(s.code)));
if (untested.length > 0) console.log("Skills with no questions yet:", untested.map((s) => s.code).join(", "));
