import { cookies } from "next/headers";
import Link from "next/link";
import { questionsById } from "@/content/bank";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidUnlockToken, PARENT_COOKIE } from "@/lib/parent-lock";
import { lock, signOut, unlock } from "./actions";

const CONFIDENCE_FACE = { LOW: "😟", MEDIUM: "🙂", HIGH: "😄" } as const;

export default async function ParentPage({ searchParams }: PageProps<"/parent">) {
  const user = await requireFamilyUser();
  const { wrong } = await searchParams;
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

  const attempts = await db.attempt.findMany({
    orderBy: { answeredAt: "desc" },
    take: 50,
    include: { student: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Recent answers</h1>
        <div className="flex items-center gap-3 text-sm text-cream-dim">
          <span>{user.email}</span>
          <form action={lock}>
            <button className="rounded-lg bg-bg-mid px-3 py-2">Lock</button>
          </form>
          <form action={signOut}>
            <button className="rounded-lg bg-bg-mid px-3 py-2">Sign out</button>
          </form>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-bg-mid">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-cream-dim">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Who</th>
              <th className="p-3">Question</th>
              <th className="p-3">Result</th>
              <th className="p-3">Sure?</th>
              <th className="p-3">Time</th>
              <th className="p-3">Listens</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="p-3 whitespace-nowrap">{a.answeredAt.toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="p-3">{a.student.name}</td>
                <td className="p-3">{questionsById.get(a.questionId)?.prompt ?? a.questionId}</td>
                <td className="p-3 text-lg">{a.isCorrect ? "✅" : "❌"}</td>
                <td className="p-3 text-lg">{a.confidence ? CONFIDENCE_FACE[a.confidence] : ""}</td>
                <td className="p-3 whitespace-nowrap">{Math.round(a.totalMs / 1000)}s</td>
                <td className="p-3">{a.listenCount}</td>
              </tr>
            ))}
            {attempts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-cream-dim">
                  No answers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
