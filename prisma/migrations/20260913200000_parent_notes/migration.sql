-- Parent notes (Phase 3). A new table, so the previous deployment is unaffected.
CREATE TABLE "ParentNote" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ParentNote_studentId_createdAt_idx" ON "ParentNote"("studentId", "createdAt");

ALTER TABLE "ParentNote" ADD CONSTRAINT "ParentNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same rule as every table: no Data API access; the app reads and writes through Prisma on the server.
ALTER TABLE "ParentNote" ENABLE ROW LEVEL SECURITY;
