"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isParentUnlocked } from "@/lib/parent-session";

async function requireUnlockedParent() {
  const user = await requireFamilyUser();
  if (!(await isParentUnlocked())) redirect("/parent");
  return user;
}

export async function addNote(formData: FormData) {
  const user = await requireUnlockedParent();
  const studentId = String(formData.get("studentId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!body || !(await db.student.findUnique({ where: { id: studentId } }))) redirect("/parent?view=notes");
  await db.parentNote.create({ data: { studentId, body, authorEmail: user.email ?? "unknown" } });
  revalidatePath("/parent");
  redirect("/parent?view=notes");
}

export async function deleteNote(formData: FormData) {
  await requireUnlockedParent();
  const id = String(formData.get("id") ?? "");
  await db.parentNote.deleteMany({ where: { id } });
  revalidatePath("/parent");
  redirect("/parent?view=notes");
}
