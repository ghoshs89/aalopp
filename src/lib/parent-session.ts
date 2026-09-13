import { cookies } from "next/headers";
import { questions, questionsById, skills } from "@/content/bank";
import { db } from "./db";
import { computeWorkingBands } from "./engine/select-session";
import { computeSkillStates } from "./engine/skill-state";
import type { InsightAttempt } from "./engine/insights";
import { householdToday } from "./household-time";
import { isValidUnlockToken, PARENT_COOKIE } from "./parent-lock";

export async function isParentUnlocked(): Promise<boolean> {
  return isValidUnlockToken((await cookies()).get(PARENT_COOKIE)?.value, process.env.PARENT_PIN ?? "");
}

/** Everything the grown-ups views read for one student, computed from the attempt log. */
export async function loadLearnerData(studentId: string) {
  const [rows, { today }] = await Promise.all([
    db.attempt.findMany({
      where: { studentId },
      select: { questionId: true, isCorrect: true, answeredAt: true, localDate: true, confidence: true, scratchpad: true, totalMs: true },
    }),
    householdToday(),
  ]);
  const attempts: InsightAttempt[] = rows.map((a) => ({ ...a, localDate: a.localDate ?? a.answeredAt.toISOString().slice(0, 10) }));
  const states = computeSkillStates(skills, questionsById, attempts, today);
  const workingBands = computeWorkingBands(questions, new Map(skills.map((s) => [s.code, s])), attempts);
  return { attempts, states, workingBands, today };
}
