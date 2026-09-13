-- The device's calendar date for each answer (mastery needs "2 different days" in the family's time zone),
-- and the reason the selector chose the question, for the grown-ups page.
ALTER TABLE "Attempt" ADD COLUMN "localDate" TEXT;
ALTER TABLE "Attempt" ADD COLUMN "selectionReason" TEXT;

-- Answers saved before this change have no device date; use the UTC date.
UPDATE "Attempt" SET "localDate" = to_char("answeredAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') WHERE "localDate" IS NULL;
-- Left nullable so the previous deployment can keep saving answers until the new code is live.
