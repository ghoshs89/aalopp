import { notFound } from "next/navigation";
import { questions, questionsById, skills } from "@/content/bank";
import { SkillProgress } from "@/components/parent/SkillProgress";
import { addDays } from "@/lib/engine/dates";
import { computeWorkingBands } from "@/lib/engine/select-session";
import { computeSkillStates, type AttemptRecord } from "@/lib/engine/skill-state";

// Local-only preview of the grown-ups skill view with a made-up history. Returns 404 in production.
export default function DevSkillsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const today = "2026-09-20";
  const attempts: AttemptRecord[] = [];
  let t = 0;
  const add = (skill: string, pattern: boolean[], startDay: string) => {
    const ids = questions.filter((q) => q.skills[0] === skill).map((q) => q.id);
    pattern.forEach((isCorrect, i) => {
      const localDate = addDays(startDay, Math.floor(i / 2));
      attempts.push({ questionId: ids[i % ids.length], isCorrect, localDate, answeredAt: new Date(Date.parse(`${localDate}T15:00:00Z`) + t++ * 1000) });
    });
  };
  add("MATH-MD-COINS", [true, true, true, true, true], "2026-09-10");
  add("MATH-MD-TIME-5MIN", [true, false, true, false, true], "2026-09-17");
  add("LOGIC-PATTERN", [true, true, true, true, true, true], "2026-09-18");
  add("MATH-GEO-SYMMETRY", [false, true], "2026-09-19");
  const states = computeSkillStates(skills, questionsById, attempts, today);
  const bands = computeWorkingBands(questions, new Map(skills.map((s) => [s.code, s])), attempts);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <SkillProgress skills={skills} states={states} workingBands={bands} today={today} />
    </main>
  );
}
