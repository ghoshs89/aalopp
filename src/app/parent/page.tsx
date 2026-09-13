import Link from "next/link";
import { questionsById, skills } from "@/content/bank";
import { ChartCard, DailyColumns, PercentBars, StatTile, TableView, WeeklyLine } from "@/components/parent/Charts";
import { SkillMap } from "@/components/parent/SkillMap";
import { SkillProgress } from "@/components/parent/SkillProgress";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accuracyByStrand, confidenceCalibration, dailyActivity, everydayVsReasoning, percent, summarize, weeklyAccuracy } from "@/lib/engine/insights";
import { STRAND_LABEL } from "@/lib/labels";
import { isParentUnlocked, loadLearnerData } from "@/lib/parent-session";
import { lock, signOut, unlock } from "./actions";
import { addNote, deleteNote } from "./notes-actions";

const CONFIDENCE_FACE = { LOW: "😟", MEDIUM: "🙂", HIGH: "😄" } as const;
const CONFIDENCE_LABEL = { LOW: "😟 Not sure", MEDIUM: "🙂 Kind of sure", HIGH: "😄 Very sure" } as const;


const TABS = [
  ["overview", "Overview"],
  ["skills", "Skills"],
  ["map", "Skill map"],
  ["answers", "Recent answers"],
  ["notes", "Notes"],
] as const;
type Tab = (typeof TABS)[number][0];

export default async function ParentPage({ searchParams }: PageProps<"/parent">) {
  const user = await requireFamilyUser();
  const { wrong, view } = await searchParams;
  const pin = process.env.PARENT_PIN;

  if (!(await isParentUnlocked())) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-display text-3xl font-extrabold">Grown-ups only</h1>
        {pin ? (
          <form action={unlock} className="flex w-full flex-col gap-3">
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              autoFocus
              aria-label="PIN"
              className="rounded-2xl bg-cream px-4 py-4 text-center text-3xl tracking-[0.5em] text-ink"
            />
            {wrong && <p className="text-danger">That PIN did not match.</p>}
            <button className="big-button bg-gold text-ink">Unlock</button>
          </form>
        ) : (
          <p className="text-cream-dim">Set PARENT_PIN in the environment to use this page.</p>
        )}
        <Link href="/" className="text-cream-dim underline underline-offset-4">
          Back
        </Link>
      </main>
    );
  }

  const tab: Tab = TABS.some(([key]) => key === view) ? (view as Tab) : "overview";
  const student = await db.student.findFirst({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">{student ? `${student.avatar} ${student.name}` : "Grown-ups"}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-cream-dim">
          <span className="hidden sm:inline">{user.email}</span>
          <Link href="/parent/report" className="rounded-lg bg-gold px-3 py-2 font-bold text-ink">
            Printable report
          </Link>
          <form action={lock}>
            <button className="rounded-lg bg-bg-mid px-3 py-2">Lock</button>
          </form>
          <form action={signOut}>
            <button className="rounded-lg bg-bg-mid px-3 py-2">Sign out</button>
          </form>
        </div>
      </div>
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Grown-ups sections">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={key === "overview" ? "/parent" : `/parent?view=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`rounded-full px-4 py-2 font-bold ${tab === key ? "bg-gold text-ink" : "bg-bg-mid text-cream-dim"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {!student ? (
        <p className="text-cream-dim">No players yet.</p>
      ) : tab === "overview" ? (
        <OverviewTab studentId={student.id} />
      ) : tab === "skills" ? (
        <SkillsTab studentId={student.id} />
      ) : tab === "map" ? (
        <MapTab studentId={student.id} />
      ) : tab === "notes" ? (
        <NotesTab studentId={student.id} />
      ) : (
        <AnswersTab studentId={student.id} />
      )}
    </main>
  );
}

async function OverviewTab({ studentId }: { studentId: string }) {
  const { attempts, states, today } = await loadLearnerData(studentId);
  if (attempts.length === 0) return <p className="text-cream-dim">No answers yet. The overview fills in after the first session.</p>;
  const summary = summarize(attempts, today);
  const days = dailyActivity(attempts, today, 14);
  const weeks = weeklyAccuracy(attempts, today, 8);
  const strands = accuracyByStrand(attempts, questionsById, skills).map((s) => ({ ...s, label: STRAND_LABEL[s.strand] }));
  const split = everydayVsReasoning(attempts, questionsById, skills);
  const calibration = confidenceCalibration(attempts).map((c) => ({ ...c, label: CONFIDENCE_LABEL[c.level] }));
  const mastered = [...states.values()].filter((s) => s.status === "mastered" || s.status === "review-due").length;
  const weekPct = percent(summary.lastWeek);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Answered in the last 7 days" value={String(summary.lastWeek.answered)} detail={weekPct === null ? "No answers this week" : `${weekPct}% right`} />
        <StatTile label="Practice days in the last 14" value={String(summary.practiceDaysLast14)} />
        <StatTile label="Skills mastered" value={`${mastered} of ${skills.length}`} detail="Includes skills due for review" />
        <StatTile
          label="Worked it out"
          value={summary.scratchpadShare === null ? "Not yet" : `${summary.scratchpadShare}%`}
          detail="Answers using the scratchpad or paper"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Everyday skills and reasoning" subtitle="Percent right. Everyday skills are time, money, measuring, graphs and calendars.">
          <PercentBars
            rows={[
              { label: "Everyday skills", ...split.everyday },
              { label: "Reasoning", ...split.reasoning },
            ]}
          />
          <TableView
            caption="Everyday skills and reasoning"
            headers={["Group", "Answered", "Right", "Percent"]}
            rows={[
              ["Everyday skills", split.everyday.answered, split.everyday.correct, `${percent(split.everyday) ?? "-"}%`],
              ["Reasoning", split.reasoning.answered, split.reasoning.correct, `${percent(split.reasoning) ?? "-"}%`],
            ]}
          />
        </ChartCard>
        <ChartCard title="How sure, and how right" subtitle={`When he taps a face, how often he is right. ${summary.sureButWrongLastWeek} "Very sure" answers were wrong this week.`}>
          <PercentBars rows={calibration} />
          <TableView caption="Confidence and accuracy" headers={["Face", "Answered", "Right", "Percent"]} rows={calibration.map((c) => [c.label, c.answered, c.correct, `${percent(c) ?? "-"}%`])} />
        </ChartCard>
      </div>

      <ChartCard title="Questions answered per day" subtitle="Last 14 days">
        <DailyColumns days={days} />
        <TableView caption="Questions answered per day" headers={["Date", "Answered", "Right", "Minutes"]} rows={days.map((d) => [d.date, d.answered, d.correct, d.minutes])} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Percent right per week" subtitle="Last 8 weeks">
          <WeeklyLine weeks={weeks} />
          <TableView caption="Percent right per week" headers={["Week ending", "Answered", "Right", "Percent"]} rows={weeks.map((w) => [w.end, w.answered, w.correct, `${percent(w) ?? "-"}%`])} />
        </ChartCard>
        <ChartCard title="By strand" subtitle="Percent right, grouped by each question's main skill">
          <PercentBars rows={strands} />
          <TableView caption="Percent right by strand" headers={["Strand", "Answered", "Right", "Percent"]} rows={strands.map((s) => [s.label, s.answered, s.correct, `${percent(s) ?? "-"}%`])} />
        </ChartCard>
      </div>
    </div>
  );
}

async function SkillsTab({ studentId }: { studentId: string }) {
  const { states, workingBands, today } = await loadLearnerData(studentId);
  return <SkillProgress skills={skills} states={states} workingBands={workingBands} today={today} />;
}

async function MapTab({ studentId }: { studentId: string }) {
  const { states, today } = await loadLearnerData(studentId);
  return (
    <ChartCard title="Skill map" subtitle="Skills on the left come first. Hover or tab to a skill for details.">
      <SkillMap skills={skills} states={states} today={today} />
    </ChartCard>
  );
}

async function NotesTab({ studentId }: { studentId: string }) {
  const notes = await db.parentNote.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <form action={addNote} className="rounded-2xl bg-bg-mid p-4">
        <input type="hidden" name="studentId" value={studentId} />
        <label htmlFor="note-body" className="mb-2 block font-bold">
          Add a note
        </label>
        <textarea
          id="note-body"
          name="body"
          required
          maxLength={2000}
          rows={3}
          placeholder="What you noticed: frustration, a breakthrough, a question for the teacher"
          className="w-full rounded-xl bg-cream p-3 text-ink"
        />
        <button className="mt-2 rounded-xl bg-gold px-4 py-2 font-bold text-ink">Save note</button>
      </form>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-2xl bg-bg-mid p-4">
            <p className="whitespace-pre-wrap">{n.body}</p>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-cream-dim">
              <span>
                {n.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {n.authorEmail}
              </span>
              <form action={deleteNote}>
                <input type="hidden" name="id" value={n.id} />
                <button className="rounded-lg bg-bg-hill px-2 py-1">Delete</button>
              </form>
            </div>
          </li>
        ))}
        {notes.length === 0 && <li className="text-cream-dim">No notes yet. Notes appear in the printable report.</li>}
      </ul>
    </div>
  );
}

async function AnswersTab({ studentId }: { studentId: string }) {
  const attempts = await db.attempt.findMany({ where: { studentId }, orderBy: { answeredAt: "desc" }, take: 60 });
  return (
    <div className="overflow-x-auto rounded-2xl bg-bg-mid">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-cream-dim">
          <tr>
            <th className="p-3">When</th>
            <th className="p-3">Question</th>
            <th className="p-3">Result</th>
            <th className="p-3">Sure?</th>
            <th className="p-3" title="Seconds taken, times the question was read aloud (🔊), scratchpad strokes (✏️) or paper (📝)">
              Time and tools
            </th>
            <th className="p-3">Why it was picked</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="border-t border-white/10 align-top">
              <td className="p-3 whitespace-nowrap">{a.answeredAt.toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}</td>
              <td className="p-3">{questionsById.get(a.questionId)?.prompt ?? a.questionId}</td>
              <td className="p-3 text-lg">{a.isCorrect ? "✅" : "❌"}</td>
              <td className="p-3 text-lg">{a.confidence ? CONFIDENCE_FACE[a.confidence] : ""}</td>
              <td className="p-3 whitespace-nowrap">
                {Math.round(a.totalMs / 1000)}s{a.listenCount > 0 ? ` · 🔊${a.listenCount}` : ""}
                {a.scratchpad === "DIGITAL" ? ` · ✏️${a.scratchpadStrokes ?? ""}` : a.scratchpad === "PAPER" ? " · 📝" : ""}
              </td>
              <td className="p-3 text-cream-dim">{a.selectionReason ?? "Before adaptive practice"}</td>
            </tr>
          ))}
          {attempts.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-cream-dim">
                No answers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
