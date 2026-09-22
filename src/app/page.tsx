import Link from "next/link";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function HomePage() {
  await requireFamilyUser();
  const students = await db.student.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 px-4 py-10">
      <h1 className="font-display text-4xl font-extrabold">Who is playing?</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {students.map((s) => (
          <Link key={s.id} href={`/choose/${s.id}`} className="flex w-44 flex-col items-center gap-2 rounded-3xl bg-bg-mid p-6 shadow-xl active:translate-y-1">
            <span className="text-8xl">{s.avatar}</span>
            <span className="font-display text-3xl font-extrabold">{s.name}</span>
          </Link>
        ))}
        {students.length === 0 && <p className="text-xl text-cream-dim">No players yet. Run the seed script to add one.</p>}
      </div>
      <Link href="/parent" className="mt-6 text-base text-cream-dim underline underline-offset-4">
        Grown-ups
      </Link>
    </main>
  );
}
