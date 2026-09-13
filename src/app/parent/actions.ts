"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireFamilyUser } from "@/lib/auth";
import { createUnlockToken, PARENT_COOKIE, pinMatches, UNLOCK_MINUTES } from "@/lib/parent-lock";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function unlock(formData: FormData) {
  await requireFamilyUser();
  const pin = String(formData.get("pin") ?? "");
  if (!pinMatches(pin, process.env.PARENT_PIN)) redirect("/parent?wrong=1");
  (await cookies()).set(PARENT_COOKIE, createUnlockToken(process.env.PARENT_PIN!), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/parent",
    maxAge: UNLOCK_MINUTES * 60,
  });
  redirect("/parent");
}

export async function lock() {
  (await cookies()).delete({ name: PARENT_COOKIE, path: "/parent" });
  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
