import { getFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isParentUnlocked } from "@/lib/parent-session";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  if (!(await getFamilyUser())) {
    return Response.json({ error: "Sign in to export practice history." }, { status: 401, headers });
  }
  if (!(await isParentUnlocked())) {
    return Response.json({ error: "Unlock Grown-ups to export practice history." }, { status: 403, headers });
  }

  const student = await db.$transaction(
    (transaction) => transaction.student.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        sessions: {
          orderBy: { startedAt: "asc" },
          select: {
            id: true,
            startedAt: true,
            endedAt: true,
            attempts: {
              orderBy: { answeredAt: "asc" },
              select: {
                id: true,
                questionId: true,
                response: true,
                isCorrect: true,
                confidence: true,
                firstActionMs: true,
                totalMs: true,
                listenCount: true,
                answeredAt: true,
                localDate: true,
                selectionReason: true,
                scratchpad: true,
                scratchpadStrokes: true,
              },
            },
          },
        },
      },
    }),
    { isolationLevel: "RepeatableRead" },
  );
  if (!student) {
    return Response.json({ error: "No player to export." }, { status: 404, headers });
  }

  const { id, name, sessions } = student;
  return Response.json(
    { format: "puzzle-quest-practice-history", version: 1, learner: { id, name }, sessions },
    {
      headers: {
        ...headers,
        "Content-Disposition": 'attachment; filename="puzzle-quest-practice-history.json"',
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
