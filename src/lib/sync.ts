import { questionsById } from "@/content/bank";
import type { PrismaClient } from "@/generated/prisma/client";
import { isCorrect } from "./engine/grade";
import type { SyncItem } from "./sync-schema";

export type SyncResult = { saved: string[]; rejected: { id: string; reason: string }[] };

/**
 * Idempotent: the device retries until it hears back, so every write is keyed by an id generated on the device.
 * Correctness is recomputed here from the question bank rather than trusted from the device.
 */
export async function saveSyncItems(db: PrismaClient, items: SyncItem[]): Promise<SyncResult> {
  const result: SyncResult = { saved: [], rejected: [] };
  const studentIds = new Set((await db.student.findMany({ select: { id: true } })).map((s) => s.id));

  for (const item of items) {
    if (!studentIds.has(item.studentId)) {
      result.rejected.push({ id: item.id, reason: "unknown student" });
      continue;
    }

    await db.practiceSession.upsert({
      where: { id: item.sessionId },
      create: { id: item.sessionId, studentId: item.studentId, startedAt: new Date(item.sessionStartedAt) },
      update: {},
    });

    if (item.kind === "sessionEnd") {
      await db.practiceSession.update({ where: { id: item.sessionId }, data: { endedAt: new Date(item.endedAt) } });
      result.saved.push(item.id);
      continue;
    }

    const question = questionsById.get(item.questionId);
    if (!question) {
      result.rejected.push({ id: item.id, reason: "unknown question" });
      continue;
    }

    await db.attempt.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        studentId: item.studentId,
        sessionId: item.sessionId,
        questionId: item.questionId,
        response: item.response,
        isCorrect: isCorrect(question, item.response),
        confidence: item.confidence,
        firstActionMs: item.firstActionMs,
        totalMs: item.totalMs,
        listenCount: item.listenCount,
        answeredAt: new Date(item.answeredAt),
      },
      update: {},
    });
    result.saved.push(item.id);
  }
  return result;
}
