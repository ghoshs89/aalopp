import { questionsById } from "@/content/bank";
import type { PrismaClient } from "@/generated/prisma/client";
import { isCorrect } from "./engine/grade";
import type { AttemptItem, SyncItem } from "./sync-schema";

export type SyncResult = { saved: string[]; rejected: { id: string; reason: string }[] };

type SyncDb = Pick<PrismaClient, "student" | "practiceSession" | "attempt">;

/**
 * Idempotent: the device retries until it hears back, so every write is keyed by an id generated on the device.
 * Correctness is recomputed here from the question bank rather than trusted from the device.
 * Writes are batched so a queued offline session syncs in a handful of queries rather than one per item.
 */
export async function saveSyncItems(db: SyncDb, items: SyncItem[]): Promise<SyncResult> {
  const result: SyncResult = { saved: [], rejected: [] };
  const studentIds = new Set((await db.student.findMany({ select: { id: true } })).map((s) => s.id));

  const sessions = new Map<string, { id: string; studentId: string; startedAt: Date }>();
  const latestEnd = new Map<string, Date>();
  const attempts: { item: AttemptItem; correct: boolean }[] = [];

  for (const item of items) {
    if (!studentIds.has(item.studentId)) {
      result.rejected.push({ id: item.id, reason: "unknown student" });
      continue;
    }

    const startedAt = new Date(item.sessionStartedAt);
    const existingSession = sessions.get(item.sessionId);
    if (!existingSession || startedAt < existingSession.startedAt) {
      sessions.set(item.sessionId, { id: item.sessionId, studentId: item.studentId, startedAt });
    }

    if (item.kind === "sessionEnd") {
      const endedAt = new Date(item.endedAt);
      const prev = latestEnd.get(item.sessionId);
      if (!prev || endedAt > prev) latestEnd.set(item.sessionId, endedAt);
      result.saved.push(item.id);
      continue;
    }

    const question = questionsById.get(item.questionId);
    if (!question) {
      result.rejected.push({ id: item.id, reason: "unknown question" });
      continue;
    }

    attempts.push({ item, correct: isCorrect(question, item.response) });
    result.saved.push(item.id);
  }

  if (sessions.size > 0) {
    await db.practiceSession.createMany({ data: [...sessions.values()], skipDuplicates: true });
  }

  if (attempts.length > 0) {
    await db.attempt.createMany({
      data: attempts.map(({ item, correct }) => ({
        id: item.id,
        studentId: item.studentId,
        sessionId: item.sessionId,
        questionId: item.questionId,
        response: item.response,
        isCorrect: correct,
        confidence: item.confidence,
        firstActionMs: item.firstActionMs,
        totalMs: item.totalMs,
        listenCount: item.listenCount,
        answeredAt: new Date(item.answeredAt),
        localDate: item.localDate ?? item.answeredAt.slice(0, 10),
        selectionReason: item.selectionReason ?? null,
        scratchpad: item.scratchpad ?? null,
        scratchpadStrokes: item.scratchpadStrokes ?? null,
      })),
      skipDuplicates: true,
    });
  }

  // The device may send several end markers (leaving, coming back, finishing); keep only the latest per session.
  for (const [sessionId, endedAt] of latestEnd) {
    await db.practiceSession.updateMany({
      where: { id: sessionId, OR: [{ endedAt: null }, { endedAt: { lt: endedAt } }] },
      data: { endedAt },
    });
  }

  return result;
}
