import { redirect } from "next/navigation";
import { isAllowedEmail } from "./allowlist";
import { createSupabaseServerClient } from "./supabase/server";

/** The signed-in family account, or null. getUser() re-validates the session with Supabase rather than trusting the cookie. */
export async function getFamilyUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && isAllowedEmail(user.email) ? user : null;
}

export async function requireFamilyUser() {
  const user = await getFamilyUser();
  if (!user) redirect("/login");
  return user;
}
