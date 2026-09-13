import { describe, expect, it } from "vitest";
import { SyncRequestSchema } from "./sync-schema";

const attempt = {
  kind: "attempt",
  id: "7d0f7a3e-9a51-4c1e-8f7a-2b8d8f6a1c01",
  studentId: "student-1",
  sessionId: "0b7f5e0e-2f0d-4a57-9d2b-3c1a8e7d9f10",
  sessionStartedAt: "2026-09-13T10:00:00.000Z",
  questionId: "md-car-wash-change",
  response: { type: "numeric", value: 12 },
  confidence: "HIGH",
  firstActionMs: 4200,
  totalMs: 9100,
  listenCount: 1,
  answeredAt: "2026-09-13T10:00:09.100Z",
};

describe("SyncRequestSchema", () => {
  it("accepts attempts and session ends", () => {
    const end = { kind: "sessionEnd", id: "5b3a3d7e-1c2b-4d5e-8f9a-0b1c2d3e4f50", studentId: "student-1", sessionId: attempt.sessionId, sessionStartedAt: attempt.sessionStartedAt, endedAt: "2026-09-13T10:12:00.000Z" };
    expect(SyncRequestSchema.safeParse({ items: [attempt, end] }).success).toBe(true);
  });

  it("rejects device-side correctness, bad ids and empty batches", () => {
    expect(SyncRequestSchema.safeParse({ items: [] }).success).toBe(false);
    expect(SyncRequestSchema.safeParse({ items: [{ ...attempt, id: "not-a-uuid" }] }).success).toBe(false);
    const parsed = SyncRequestSchema.parse({ items: [{ ...attempt, isCorrect: true }] });
    expect(parsed.items[0]).not.toHaveProperty("isCorrect");
  });
});
