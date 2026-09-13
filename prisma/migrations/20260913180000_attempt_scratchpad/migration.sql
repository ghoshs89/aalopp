-- How the child worked out each answer (Phase 4). Nullable so the previous deployment keeps saving answers.
CREATE TYPE "ScratchpadMode" AS ENUM ('NONE', 'DIGITAL', 'PAPER');
ALTER TABLE "Attempt" ADD COLUMN "scratchpad" "ScratchpadMode";
ALTER TABLE "Attempt" ADD COLUMN "scratchpadStrokes" INTEGER;
