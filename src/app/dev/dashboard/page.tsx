import { notFound } from "next/navigation";
import { questions, questionsById, skills } from "@/content/bank";
import { ChartCard, DailyColumns, PercentBars, StatTile, WeeklyLine } from "@/components/parent/Charts";
import { SkillMap } from "@/components/parent/SkillMap";
import { addDays } from "@/lib/engine/dates";
import { accuracyByStrand, confidenceCalibration, dailyActivity, everydayVsReasoning, summarize, weeklyAccuracy, type InsightAttempt } from "@/lib/engine/insights";
import { selectSession } from "@/lib/engine/select-session";
import { computeSkillStates } from "@/lib/engine/skill-state";
import { CONFIDENCE_LABEL, STRAND_LABEL } from "@/lib/labels";

// Local-only preview of the grown-ups dashboard with 30 simulated days of practice. Returns 404 in production.
function simulate(today: string): InsightAttempt[] {
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const attempts: InsightAttempt[] = [];
  const practice = new Map<string, number>();
  for (let d = 29; d >= 0; d--) {
    const day = addDays(today, -d);
    if (random() < 0.25) continue;
    const plan = selectSession(questions, skills, attempts, day, random);
    for (const { questionId } of plan.picks) {
      const q = questionsById.get(questionId)!;
      const seen = Math.max(...q.skills.map((c) => practice.get(c) ?? 0));
      const isCorrect = random() < Math.min(0.95, 0.55 + seen * 0.08 - (q.difficulty.band - 2) * 0.08);
      const r = random();
      attempts.push({
        questionId,
        isCorrect,
        localDate: day,
        answeredAt: new Date(`${day}T16:00:00Z`),
        confidence: r < 0.2 ? "LOW" : r < 0.55 ? "MEDIUM" : "HIGH",
        scratchpad: random() < 0.3 ? "DIGITAL" : "NONE",
        totalMs: 20_000 + Math.round(random() * 60_000),
      });
      for (const c of q.skills) practice.set(c, (practice.get(c) ?? 0) + 1);
    }
  }
  return attempts;
}

export default function DevDashboardPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const today = "2026-10-12";
  const attempts = simulate(today);
  const states = computeSkillStates(skills, questionsById, attempts, today);
  const summary = summarize(attempts, today);
  const split = everydayVsReasoning(attempts, questionsById, skills);
  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Answered in the last 7 days" value={String(summary.lastWeek.answered)} />
        <StatTile label="Practice days in the last 14" value={String(summary.practiceDaysLast14)} />
        <StatTile label="Skills mastered" value={`${[...states.values()].filter((s) => s.status !== "new" && s.status !== "learning").length} of ${skills.length}`} />
        <StatTile label="Worked it out" value={`${summary.scratchpadShare}%`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Everyday skills and reasoning">
          <PercentBars rows={[{ label: "Everyday skills", ...split.everyday }, { label: "Reasoning", ...split.reasoning }]} />
        </ChartCard>
        <ChartCard title="How sure, and how right">
          <PercentBars rows={confidenceCalibration(attempts).map((c) => ({ ...c, label: CONFIDENCE_LABEL[c.level] }))} />
        </ChartCard>
      </div>
      <ChartCard title="Questions answered per day">
        <DailyColumns days={dailyActivity(attempts, today, 14)} />
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Percent right per week">
          <WeeklyLine weeks={weeklyAccuracy(attempts, today, 8)} />
        </ChartCard>
        <ChartCard title="By strand">
          <PercentBars rows={accuracyByStrand(attempts, questionsById, skills).map((s) => ({ ...s, label: STRAND_LABEL[s.strand] }))} />
        </ChartCard>
      </div>
      <ChartCard title="Skill map">
        <SkillMap skills={skills} states={states} today={today} />
      </ChartCard>
    </main>
  );
}
