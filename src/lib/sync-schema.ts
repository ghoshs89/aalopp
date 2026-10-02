import { z } from "zod";

export const ResponseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("choice"), index: z.int().min(0) }),
  z.object({ type: z.literal("numeric"), value: z.number() }),
  // `index` is his first tap and the only one graded. `secondIndex` is the tap after a "look earlier" nudge.
  z.object({ type: z.literal("step"), index: z.int().min(0), secondIndex: z.int().min(0).optional() }),
]);

export const AttemptItemSchema = z.object({
  kind: z.literal("attempt"),
  id: z.uuid(),
  studentId: z.string().min(1),
  sessionId: z.uuid(),
  sessionStartedAt: z.iso.datetime(),
  questionId: z.string().min(1),
  response: ResponseSchema,
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
  firstActionMs: z.int().min(0).nullable(),
  totalMs: z.int().min(0),
  listenCount: z.int().min(0),
  answeredAt: z.iso.datetime(),
  // Optional so an older copy of the app cached on a device can still upload; the server falls back to the UTC date.
  localDate: z.iso.date().optional(),
  selectionReason: z.string().max(200).optional(),
  // How the child worked it out. Drawings themselves are never uploaded.
  scratchpad: z.enum(["NONE", "DIGITAL", "PAPER"]).optional(),
  scratchpadStrokes: z.int().min(0).max(100_000).optional(),
});

export const SessionEndItemSchema = z.object({
  kind: z.literal("sessionEnd"),
  id: z.uuid(),
  studentId: z.string().min(1),
  sessionId: z.uuid(),
  sessionStartedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
});

export const SyncItemSchema = z.discriminatedUnion("kind", [AttemptItemSchema, SessionEndItemSchema]);
export const SyncRequestSchema = z.object({ items: z.array(SyncItemSchema).min(1).max(100) });

export type SyncItem = z.infer<typeof SyncItemSchema>;
export type AttemptItem = z.infer<typeof AttemptItemSchema>;
