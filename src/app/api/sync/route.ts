import { getFamilyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveSyncItems } from "@/lib/sync";
import { SyncRequestSchema } from "@/lib/sync-schema";

export async function POST(request: Request) {
  if (!(await getFamilyUser())) return Response.json({ error: "Not signed in" }, { status: 401 });

  const parsed = SyncRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid sync payload" }, { status: 400 });

  return Response.json(await saveSyncItems(db, parsed.data.items));
}
