"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireFamilyUser } from "@/lib/auth";
import {
  createUnlockToken,
  isPinLockedOut,
  PARENT_COOKIE,
  PARENT_COOKIE_PATH,
  PIN_LOCKOUT_MINUTES,
  PIN_TRIES_COOKIE,
  pinMatches,
  recordPinFailure,
  signingSecret,
  UNLOCK_MINUTES,
} from "@/lib/parent-lock";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function unlock(formData: FormData) {
  await requireFamilyUser();
  const store = await cookies();
  const secret = signingSecret(process.env.PARENT_PIN);
  const triesCookie = store.get(PIN_TRIES_COOKIE)?.value;
  if (isPinLockedOut(triesCookie, secret)) redirect("/parent?locked=1");

  const pin = String(formData.get("pin") ?? "");
  if (!pinMatches(pin, process.env.PARENT_PIN)) {
    const next = recordPinFailure(triesCookie, secret);
    store.set(PIN_TRIES_COOKIE, next.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: PARENT_COOKIE_PATH,
      maxAge: PIN_LOCKOUT_MINUTES * 60,
    });
    redirect(next.locked ? "/parent?locked=1" : "/parent?wrong=1");
  }
  store.delete({ name: PIN_TRIES_COOKIE, path: PARENT_COOKIE_PATH });
  store.set(PARENT_COOKIE, createUnlockToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: PARENT_COOKIE_PATH,
    maxAge: UNLOCK_MINUTES * 60,
  });
  redirect("/parent");
}

export async function lock() {
  (await cookies()).delete({ name: PARENT_COOKIE, path: PARENT_COOKIE_PATH });
  redirect("/");
}

export async function signOut() {
  const store = await cookies();
  store.delete({ name: PARENT_COOKIE, path: PARENT_COOKIE_PATH });
  store.delete({ name: PIN_TRIES_COOKIE, path: PARENT_COOKIE_PATH });
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
