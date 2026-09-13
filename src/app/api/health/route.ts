import { db } from "@/lib/db";

// Called daily by Vercel Cron (vercel.json) so the free Supabase project never pauses for inactivity.
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}` || !process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db.$queryRaw`SELECT 1`;
  return Response.json({ ok: true, at: new Date().toISOString() });
}
