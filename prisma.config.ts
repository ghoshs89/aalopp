import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Locally the URLs live in .env.local; on Vercel they come from project environment variables.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // The CLI (migrations) uses the session pooler. The app runtime uses DATABASE_URL (transaction pooler) in src/lib/db.ts.
    url: process.env.DIRECT_URL,
  },
});
