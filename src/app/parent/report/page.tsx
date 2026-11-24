import Link from "next/link";
import { redirect } from "next/navigation";
import { questionsById, skills } from "@/content/bank";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accuracyByStrand, confidenceCalibration, everydayVsReasoning, percent, summarize, type Tally } from "@/lib/engine/insights";
import { CONFIDENCE_LABEL, STRAND_LABEL } from "@/lib/labels";
import { isParentUnlocked, loadLearnerData } from "@/lib/parent-session";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Progress report" };

const pct = (t: Tally) => (percent(t) === null ? "No answers" : `${percent(t)}% (${t.correct} of ${t.answered})`);

// A plain, light, printable page for school meetings. It deliberately does not use the app's dark theme.
export default async function ReportPage() {
  await requireFamilyUser();
  if (!(await isParentUnlocked())) redirect("/parent");
  const student = await db.student.findFirst({ orderBy: { createdAt: "asc" } });
  if (!student) redirect("/parent");

  const { attempts, states, workingBands, today } = await loadLearnerData(student.id);
  const notes = await db.parentNote.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 20 });
  const summary = summarize(attempts, today);
  const split = everydayVsReasoning(attempts, questionsById, skills);
  const strands = accuracyByStrand(attempts, questionsById, skills);
  const calibration = confidenceCalibration(attempts);
  const bySkillStatus = (statuses: string[]) => skills.filter((s) => statuses.includes(states.get(s.code)!.status));
  const first = attempts.length ? attempts.reduce((m, a) => (a.localDate < m ? a.localDate : m), attempts[0].localDate) : null;
  const practiceDays = new Set(attempts.map((a) => a.localDate)).size;

  return (
    <div className="min-h-dvh bg-white text-[#0b0b0b] print:bg-white" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <main className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link href="/parent" className="text-[#2a78d6] underline">
            Back to grown-ups page
          </Link>
          <PrintButton />
        </div>

        <header className="border-b border-[#e1e0d9] pb-4">
          <h1 className="text-3xl font-bold">Practice progress report: {student.name}</h1>
          <p className="mt-1 text-sm text-[#52514e]">
            Generated {today}. {first ? `Covers ${attempts.length} answers on ${practiceDays} days since ${first}.` : "No answers recorded yet."}
          </p>
          <p className="mt-1 text-sm text-[#52514e]">
            Source: the Puzzle Quest home practice app. Questions are Math Kangaroo, Bebras and grade 2 to 3 style items; results reflect home practice, not a
            standardized test.
          </p>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Answers, last 7 days", String(summary.lastWeek.answered)],
            ["Right, last 7 days", percent(summary.lastWeek) === null ? "None" : `${percent(summary.lastWeek)}%`],
            ["Skills mastered", `${bySkillStatus(["mastered", "review-due"]).length} of ${skills.length}`],
            ["Worked it out", summary.scratchpadShare === null ? "Not tracked yet" : `${summary.scratchpadShare}% of answers`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e1e0d9] p-3">
              <div className="text-xs text-[#52514e]">{label}</div>
              <div className="text-2xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-8 break-inside-avoid">
          <h2 className="text-xl font-bold">Accuracy</h2>
          <table className="mt-2 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#c3c2b7]">
                <th className="py-1.5 pr-3">Area</th>
                <th className="py-1.5 pr-3">Percent right</th>
                <th className="py-1.5">Working level (1 to 5)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#e1e0d9]">
                <td className="py-1.5 pr-3 font-semibold">Everyday skills (time, money, measuring, graphs)</td>
                <td className="py-1.5 pr-3 tabular-nums">{pct(split.everyday)}</td>
                <td />
              </tr>
              <tr className="border-b border-[#e1e0d9]">
                <td className="py-1.5 pr-3 font-semibold">Reasoning</td>
                <td className="py-1.5 pr-3 tabular-nums">{pct(split.reasoning)}</td>
                <td />
              </tr>
              {strands.map((s) => (
                <tr key={s.strand} className="border-b border-[#e1e0d9]">
                  <td className="py-1.5 pr-3">{STRAND_LABEL[s.strand]}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{pct(s)}</td>
                  <td className="py-1.5 tabular-nums">{workingBands[s.strand] ?? 2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {calibration.some((c) => c.answered > 0) && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="text-xl font-bold">Confidence</h2>
            <p className="text-sm text-[#52514e]">From earlier sessions that asked how sure he felt.</p>
            <table className="mt-2 w-full border-collapse text-left text-sm">
              <tbody>
                {calibration.map((c) => (
                  <tr key={c.level} className="border-b border-[#e1e0d9]">
                    <td className="py-1.5 pr-3">{CONFIDENCE_LABEL[c.level]}</td>
                    <td className="py-1.5 tabular-nums">{pct(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="break-inside-avoid">
            <h2 className="text-xl font-bold">Mastered skills</h2>
            <p className="text-sm text-[#52514e]">4 of the last 5 right, on at least 2 different days.</p>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {bySkillStatus(["mastered", "review-due"]).map((s) => (
                <li key={s.code}>{s.name}</li>
              ))}
              {bySkillStatus(["mastered", "review-due"]).length === 0 && <li className="list-none text-[#52514e]">None yet</li>}
            </ul>
          </div>
          <div className="break-inside-avoid">
            <h2 className="text-xl font-bold">Still learning</h2>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {bySkillStatus(["learning"]).map((s) => {
                const st = states.get(s.code)!;
                return (
                  <li key={s.code}>
                    {s.name} <span className="text-[#52514e]">({st.recent.filter(Boolean).length} of last {st.recent.length} right)</span>
                  </li>
                );
              })}
              {bySkillStatus(["learning"]).length === 0 && <li className="list-none text-[#52514e]">None</li>}
            </ul>
          </div>
        </section>

        <section className="mt-8 break-inside-avoid">
          <h2 className="text-xl font-bold">Parent notes</h2>
          {notes.length === 0 ? (
            <p className="text-sm text-[#52514e]">No notes.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {notes.map((n) => (
                <li key={n.id} className="border-l-4 border-[#c3c2b7] pl-3">
                  <div className="text-xs text-[#52514e]">{n.createdAt.toISOString().slice(0, 10)}</div>
                  <p className="whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
