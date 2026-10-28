import { db } from "@/lib/db";

// Called daily by Vercel Cron (vercel.json) so the free Supabase project never pauses for inactivity.
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}` || !process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db.$queryRaw`SELECT 1`;
  // The query above goes straight to Postgres through the pooler, which Supabase did not count as activity: it
  // warned on 2026-10-23 that the project would pause while this cron was returning 200 daily. A read through the
  // Data API passes Supabase's own gateway. RLS with no policies means the public key reads an empty list.
  const api = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Student?select=id&limit=1`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    cache: "no-store",
  });
  if (!api.ok) return Response.json({ error: `Supabase Data API returned ${api.status}` }, { status: 502 });
  return Response.json({ ok: true, at: new Date().toISOString() });
}
