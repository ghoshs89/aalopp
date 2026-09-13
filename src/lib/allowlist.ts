/** Family emails allowed in, from ALLOWED_EMAILS (comma separated). An empty list lets nobody in. */
export function isAllowedEmail(email: string | null | undefined, allowed = process.env.ALLOWED_EMAILS ?? ""): boolean {
  if (!email) return false;
  const list = allowed
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
