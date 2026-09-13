import { cookies } from "next/headers";
import Link from "next/link";
import { questions, questionsById, skills } from "@/content/bank";
import { SkillProgress } from "@/components/parent/SkillProgress";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeWorkingBands } from "@/lib/engine/select-session";
import { computeSkillStates } from "@/lib/engine/skill-state";
import { householdToday } from "@/lib/household-time";
import { isValidUnlockToken, PARENT_COOKIE } from "@/lib/parent-lock";
import { lock, signOut, unlock } from "./actions";

const CONFIDENCE_FACE = { LOW: "😟", MEDIUM: "🙂", HIGH: "😄" } as const;

export default async function ParentPage({ searchParams }: PageProps<"/parent">) {
  const user = await requireFamilyUser();
  const { wrong, view } = await searchParams;
  const pin = process.env.PARENT_PIN;
  const unlocked = isValidUnlockToken((await cookies()).get(PARENT_COOKIE)?.value, pin ?? "");

  if (!unlocked) {
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

  const tab = view === "answers" ? "answers" : "skills";
  const student = await db.student.findFirst({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">{student ? `${student.avatar} ${student.name}` : "Grown-ups"}</h1>
        <div className="flex items-center gap-3 text-sm text-cream-dim">
          <span className="hidden sm:inline">{user.email}</span>
          <form action={lock}>
            <button className="rounded-lg bg-bg-mid px-3 py-2">Lock</button>
          </form>
          <form action={signOut}>
            <button className="rounded-lg bg-bg-mid px-3 py-2">Sign out</button>
          </form>
        </div>
      </div>
      <nav className="mb-5 flex gap-2" aria-label="Grown-ups sections">
        {(
          [
            ["skills", "Skills"],
            ["answers", "Recent answers"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={key === "skills" ? "/parent" : "/parent?view=answers"}
            aria-current={tab === key ? "page" : undefined}
            className={`rounded-full px-4 py-2 font-bold ${tab === key ? "bg-gold text-ink" : "bg-bg-mid text-cream-dim"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {!student ? (
        <p className="text-cream-dim">No players yet.</p>
      ) : tab === "skills" ? (
        <SkillsTab studentId={student.id} />
      ) : (
        <AnswersTab studentId={student.id} />
      )}
    </main>
  );
}

async function SkillsTab({ studentId }: { studentId: string }) {
  const [history, { today }] = await Promise.all([
    db.attempt.findMany({ where: { studentId }, select: { questionId: true, isCorrect: true, answeredAt: true, localDate: true } }),
    householdToday(),
  ]);
  const attempts = history.map((a) => ({ ...a, localDate: a.localDate ?? a.answeredAt.toISOString().slice(0, 10) }));
  const states = computeSkillStates(skills, questionsById, attempts, today);
  const workingBands = computeWorkingBands(questions, new Map(skills.map((s) => [s.code, s])), attempts);
  return <SkillProgress skills={skills} states={states} workingBands={workingBands} today={today} />;
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
            <th className="p-3" title="Seconds taken, times the question was read aloud (🔊), scratchpad strokes (✏️) or paper (📝)">Time and tools</th>
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
