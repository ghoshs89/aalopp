import { db } from "../src/lib/db";

// Idempotent: creates Aishik's profile once. Run with `npm run db:seed`.
async function main() {
  const existing = await db.student.findFirst({ where: { name: "Aishik" } });
  if (existing) {
    console.log(`Student already exists: ${existing.name} (${existing.id})`);
    return;
  }
  const student = await db.student.create({ data: { name: "Aishik", avatar: "🏎️" } });
  console.log(`Created student: ${student.name} (${student.id})`);
}

main().finally(() => db.$disconnect());
