import Link from "next/link";
import { notFound } from "next/navigation";
import { questions, skills, themes } from "@/content/bank";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** A theme is only offered once it actually has questions the player will serve. Drafts do not count. */
function playableThemes() {
  const ready = new Set(questions.filter((q) => q.reviewStatus === "reviewed").flatMap((q) => q.skills));
  return themes.filter((t) => t.skills.some((code) => ready.has(code)));
}

export default async function ChoosePage({ params }: PageProps<"/choose/[studentId]">) {
  await requireFamilyUser();
  const { studentId } = await params;
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) notFound();

  const available = playableThemes();
  const nameOf = new Map(skills.map((s) => [s.code, s.name]));

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold">What shall we play, {student.name}?</h1>

      <Link
        href={`/play/${student.id}`}
        className="flex w-full max-w-md flex-col items-center gap-2 rounded-3xl bg-gold p-7 text-ink shadow-xl active:translate-y-1"
      >
        <span className="text-7xl">🧩</span>
        <span className="font-display text-3xl font-extrabold">Today&apos;s puzzles</span>
        <span className="text-lg">Picked just for you</span>
      </Link>

      {available.length > 0 && (
        <div className="flex w-full max-w-md flex-col gap-4">
          {available.map((theme) => (
            <Link
              key={theme.id}
              href={`/play/${student.id}?theme=${theme.id}`}
              className="flex items-center gap-4 rounded-3xl bg-bg-mid p-5 shadow-xl active:translate-y-1"
            >
              <span className="text-5xl">{theme.emoji}</span>
              <span className="flex flex-col">
                <span className="font-display text-2xl font-extrabold">{theme.name}</span>
                <span className="text-base text-cream-dim">{theme.skills.map((c) => nameOf.get(c)).filter(Boolean).join(", ")}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <Link href="/" className="text-base text-cream-dim underline underline-offset-4">
        Someone else is playing
      </Link>
    </main>
  );
}
