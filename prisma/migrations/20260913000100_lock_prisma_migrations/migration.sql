-- Keep migration history out of the Supabase Data API as well.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
