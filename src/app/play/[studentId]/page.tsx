import { notFound } from "next/navigation";
import { questions, questionsById, skills, themes } from "@/content/bank";
import { Player } from "@/components/Player";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { selectSession } from "@/lib/engine/select-session";
import { householdToday } from "@/lib/household-time";

export default async function PlayPage({ params, searchParams }: PageProps<"/play/[studentId]">) {
  await requireFamilyUser();
  const { studentId } = await params;
  const { theme: themeId } = await searchParams;
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) notFound();

  // History comes from the server, so a session on any device builds on answers given on the others.
  const [history, { today }] = await Promise.all([
    db.attempt.findMany({ where: { studentId }, select: { questionId: true, isCorrect: true, answeredAt: true, localDate: true } }),
    householdToday(),
  ]);
  const attempts = history.map((a) => ({ ...a, localDate: a.localDate ?? a.answeredAt.toISOString().slice(0, 10) }));

  const chosen = typeof themeId === "string" ? themes.find((t) => t.id === themeId) : undefined;
  const plan = selectSession(questions.filter((q) => q.reviewStatus === "reviewed"), skills, attempts, today, undefined, undefined, {
    themeSkills: new Set(themes.flatMap((t) => t.skills)),
    onlySkills: chosen ? new Set(chosen.skills) : undefined,
  });

  return (
    <Player
      student={{ id: student.id, name: student.name, avatar: student.avatar }}
      questions={plan.picks.map((p) => questionsById.get(p.questionId)!)}
      reasons={Object.fromEntries(plan.picks.map((p) => [p.questionId, p.reason]))}
      seen={[...new Set(history.map((a) => a.questionId))]}
    />
  );
}
