import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as followOldExportLink } from "@/app/api/parent/practice-history/route";
import { getFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isParentUnlocked } from "@/lib/parent-session";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({ getFamilyUser: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: vi.fn() } }));
vi.mock("@/lib/parent-session", () => ({ isParentUnlocked: vi.fn() }));

const familyUser = { id: "parent", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" };

describe("practice history export", () => {
  beforeEach(() => vi.resetAllMocks());

  it("requires a signed-in family account and an unlocked Grown-ups session", async () => {
    vi.mocked(getFamilyUser).mockResolvedValueOnce(null).mockResolvedValueOnce(familyUser);
    vi.mocked(isParentUnlocked).mockResolvedValue(false);
    expect((await GET()).status).toBe(401);
    const locked = await GET();
    expect(locked.status).toBe(303);
    expect(locked.headers.get("Location")).toBe("/parent?export=unlock");
    expect(locked.headers.get("Content-Disposition")).toBeNull();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("redirects the old link into the parent unlock cookie path", () => {
    const response = followOldExportLink();
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("/parent/practice-history");
    expect(response.headers.get("Content-Disposition")).toBeNull();
  });

  it("downloads private versioned JSON with the original stored answers and dates", async () => {
    vi.mocked(getFamilyUser).mockResolvedValue(familyUser);
    vi.mocked(isParentUnlocked).mockResolvedValue(true);
    const attempts = [{
      id: "attempt",
      questionId: "question",
      response: { type: "choice", index: 1, value: "choice B" },
      isCorrect: true,
      answeredAt: new Date("2026-11-27T01:05:00Z"),
      localDate: "2026-11-26",
    }];
    const startedAt = new Date("2026-11-27T01:01:00Z");
    vi.mocked(db.$transaction).mockResolvedValue({
      id: "learner", name: "Learner", sessions: [{ id: "session", startedAt, endedAt: null, attempts }],
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="puzzle-quest-practice-history.json"');
    expect(await response.json()).toEqual({
      format: "puzzle-quest-practice-history",
      version: 1,
      learner: { id: "learner", name: "Learner" },
      sessions: [{
        id: "session", startedAt: startedAt.toISOString(), endedAt: null,
        attempts: [{ ...attempts[0], answeredAt: attempts[0].answeredAt.toISOString() }],
      }],
    });
  });
});
