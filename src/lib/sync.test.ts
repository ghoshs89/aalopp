import { describe, expect, it, vi } from "vitest";
import { saveSyncItems } from "./sync";
import type { SyncItem } from "./sync-schema";

function mockDb(studentIds: string[]) {
  const sessionCreateMany = vi.fn().mockResolvedValue({ count: 0 });
  const sessionUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
  const attemptCreateMany = vi.fn().mockResolvedValue({ count: 0 });
  const db = {
    student: { findMany: vi.fn().mockResolvedValue(studentIds.map((id) => ({ id }))) },
    practiceSession: { createMany: sessionCreateMany, updateMany: sessionUpdateMany },
    attempt: { createMany: attemptCreateMany },
  };
  return { db: db as unknown as Parameters<typeof saveSyncItems>[0], sessionCreateMany, sessionUpdateMany, attemptCreateMany };
}

describe("saveSyncItems", () => {
  const sessionId = "0b7f5e0e-2f0d-4a57-9d2b-3c1a8e7d9f10";

  it("batches sessions and attempts, re-grades server-side, and collapses sessionEnd markers", async () => {
    const { db, sessionCreateMany, sessionUpdateMany, attemptCreateMany } = mockDb(["student-1"]);
    const items: SyncItem[] = [
      {
        kind: "attempt",
        id: "7d0f7a3e-9a51-4c1e-8f7a-2b8d8f6a1c01",
        studentId: "student-1",
        sessionId,
        sessionStartedAt: "2026-11-24T15:00:00.000Z",
        questionId: "b2m-times-ten",
        response: { type: "numeric", value: 60 },
        confidence: null,
        firstActionMs: 3000,
        totalMs: 6000,
        listenCount: 0,
        answeredAt: "2026-11-24T15:00:06.000Z",
        localDate: "2026-11-24",
      },
      {
        kind: "attempt",
        id: "7d0f7a3e-9a51-4c1e-8f7a-2b8d8f6a1c02",
        studentId: "student-1",
        sessionId,
        sessionStartedAt: "2026-11-24T15:00:00.000Z",
        questionId: "b2m-times-ten",
        response: { type: "numeric", value: 99 },
        confidence: null,
        firstActionMs: 2000,
        totalMs: 4000,
        listenCount: 0,
        answeredAt: "2026-11-24T15:00:10.000Z",
        localDate: "2026-11-24",
      },
      {
        kind: "sessionEnd",
        id: "5b3a3d7e-1c2b-4d5e-8f9a-0b1c2d3e4f50",
        studentId: "student-1",
        sessionId,
        sessionStartedAt: "2026-11-24T15:00:00.000Z",
        endedAt: "2026-11-24T15:02:00.000Z",
      },
      {
        kind: "sessionEnd",
        id: "5b3a3d7e-1c2b-4d5e-8f9a-0b1c2d3e4f51",
        studentId: "student-1",
        sessionId,
        sessionStartedAt: "2026-11-24T15:00:00.000Z",
        endedAt: "2026-11-24T15:05:00.000Z",
      },
    ];

    const res = await saveSyncItems(db, items);
    expect(res.rejected).toEqual([]);
    expect(res.saved).toHaveLength(4);
    expect(sessionCreateMany).toHaveBeenCalledTimes(1);
    expect(attemptCreateMany).toHaveBeenCalledTimes(1);
    expect(attemptCreateMany.mock.calls[0][0].data.map((a: { isCorrect: boolean }) => a.isCorrect)).toEqual([true, false]);
    expect(sessionUpdateMany).toHaveBeenCalledTimes(1);
    expect(sessionUpdateMany.mock.calls[0][0].data.endedAt).toEqual(new Date("2026-11-24T15:05:00.000Z"));
  });

  it("rejects unknown students and unknown questions without failing the rest of the batch", async () => {
    const { db, attemptCreateMany } = mockDb(["student-1"]);
    const res = await saveSyncItems(db, [
      {
        kind: "attempt",
        id: "7d0f7a3e-9a51-4c1e-8f7a-2b8d8f6a1c03",
        studentId: "missing-student",
        sessionId,
        sessionStartedAt: "2026-11-24T15:00:00.000Z",
        questionId: "b2m-times-ten",
        response: { type: "numeric", value: 60 },
        confidence: null,
        firstActionMs: null,
        totalMs: 1000,
        listenCount: 0,
        answeredAt: "2026-11-24T15:00:01.000Z",
      },
      {
        kind: "attempt",
        id: "7d0f7a3e-9a51-4c1e-8f7a-2b8d8f6a1c04",
        studentId: "student-1",
        sessionId,
        sessionStartedAt: "2026-11-24T15:00:00.000Z",
        questionId: "no-such-question",
        response: { type: "numeric", value: 1 },
        confidence: null,
        firstActionMs: null,
        totalMs: 1000,
        listenCount: 0,
        answeredAt: "2026-11-24T15:00:02.000Z",
      },
    ]);

    expect(res.saved).toEqual([]);
    expect(res.rejected).toEqual([
      { id: "7d0f7a3e-9a51-4c1e-8f7a-2b8d8f6a1c03", reason: "unknown student" },
      { id: "7d0f7a3e-9a51-4c1e-8f7a-2b8d8f6a1c04", reason: "unknown question" },
    ]);
    expect(attemptCreateMany).not.toHaveBeenCalled();
  });
});
