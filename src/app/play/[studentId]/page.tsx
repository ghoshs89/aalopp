import { notFound } from "next/navigation";
import { questionsById, questions, skills } from "@/content/bank";
import { Player } from "@/components/Player";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { selectSession } from "@/lib/engine/select-session";

export default async function PlayPage({ params }: PageProps<"/play/[studentId]">) {
  await requireFamilyUser();
  const { studentId } = await params;
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) notFound();

  // History comes from the server, so a new session on any device knows what was answered on the others.
  const history = await db.attempt.findMany({
    where: { studentId },
    select: { questionId: true, isCorrect: true, answeredAt: true },
  });
  const plan = selectSession(questions.filter((q) => q.reviewStatus === "reviewed"), skills, history);
  const sessionQuestions = plan.questionIds.map((id) => questionsById.get(id)!);

  return <Player student={{ id: student.id, name: student.name, avatar: student.avatar }} questions={sessionQuestions} />;
}
