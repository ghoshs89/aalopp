import { z } from "zod";

export const DOMAINS = ["MATHEMATICS", "LOGIC_CS", "LANGUAGES", "SCIENCE", "HUMANITIES"] as const;

// Strands mirror the MAP/IXL breakdown so pure-reasoning vs applied-convention gaps stay visible.
export const STRANDS = [
  "OPERATIONS_ALGEBRA",
  "NUMBER_BASE_TEN",
  "GEOMETRY_SPATIAL",
  "MEASUREMENT_DATA",
  "LOGIC_CS",
  "LANGUAGE",
  "SCIENCE",
  "HUMANITIES",
] as const;

const EM_DASH = "—";

const skillCode = z.string().regex(/^[A-Z]+(-[A-Z0-9]+)+$/, "Skill codes look like MATH-MD-TIME-HOUR");

export const SkillSchema = z.object({
  code: skillCode,
  name: z.string().min(1),
  domain: z.enum(DOMAINS),
  strand: z.enum(STRANDS),
  tier: z.int().min(1).max(5),
  isConvention: z.boolean(),
  prerequisites: z.array(skillCode),
});

const EmojiVisual = z.object({
  kind: z.literal("emoji"),
  lines: z.array(z.string().min(1)).min(1),
});

const GridVisual = z.object({
  kind: z.literal("grid"),
  rows: z.array(z.array(z.string().min(1)).min(1)).min(1),
  highlight: z.object({ row: z.int().min(0), col: z.int().min(0) }).optional(),
});

const ClockVisual = z.object({
  kind: z.literal("clock"),
  hour: z.int().min(1).max(12),
  minute: z.int().min(0).max(59),
});

const BarChartVisual = z.object({
  kind: z.literal("barChart"),
  title: z.string().min(1),
  unit: z.string().min(1),
  bars: z.array(z.object({ label: z.string().min(1), value: z.int().min(0) })).min(2),
});

const SvgVisual = z.object({
  kind: z.literal("svg"),
  svg: z.string().startsWith("<svg"),
  alt: z.string().min(1),
});

export const COIN_VALUES_CENTS = {
  USD: { penny: 1, nickel: 5, dime: 10, quarter: 25 },
  CAD: { nickel: 5, dime: 10, quarter: 25, loonie: 100, toonie: 200 },
} as const;

const CoinsVisual = z
  .object({
    kind: z.literal("coins"),
    currency: z.enum(["USD", "CAD"]),
    coins: z.array(z.enum(["penny", "nickel", "dime", "quarter", "loonie", "toonie"])).min(1).max(12),
  })
  .refine((v) => v.coins.every((c) => c in COIN_VALUES_CENTS[v.currency]), {
    message: "Coin does not exist in that currency (no Canadian pennies, no US loonies)",
    path: ["coins"],
  });

const RulerVisual = z
  .object({
    kind: z.literal("ruler"),
    unit: z.enum(["in", "cm"]),
    length: z.int().min(4).max(15),
    start: z.int().min(0),
    end: z.int().min(1),
    object: z.enum(["car", "pencil", "crayon", "truck", "key", "bus"]),
  })
  .refine((v) => v.start < v.end && v.end <= v.length, { message: "Object must sit on the ruler", path: ["end"] });

const PictureGraphVisual = z
  .object({
    kind: z.literal("pictureGraph"),
    title: z.string().min(1),
    icon: z.string().min(1),
    perIcon: z.int().min(1).max(10),
    rows: z.array(z.object({ label: z.string().min(1), count: z.int().min(0) })).min(2),
  })
  .refine((v) => v.rows.every((r) => r.count % v.perIcon === 0), {
    message: "Every count must be a whole number of icons",
    path: ["rows"],
  });

const CalendarVisual = z.object({
  kind: z.literal("calendar"),
  month: z.string().min(1),
  // 0 = Sunday. The first day of the month falls on this weekday.
  firstWeekday: z.int().min(0).max(6),
  days: z.int().min(28).max(31),
  marks: z.array(z.object({ day: z.int().min(1).max(31), emoji: z.string().min(1) })).default([]),
});

const NetworkVisual = z
  .object({
    kind: z.literal("network"),
    // Positions are 0 to 100 in both directions.
    nodes: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), x: z.number().min(0).max(100), y: z.number().min(0).max(100) })).min(2),
    edges: z.array(z.object({ from: z.string().min(1), to: z.string().min(1), weight: z.int().min(1) })).min(1),
  })
  .refine((v) => v.edges.every((e) => v.nodes.some((n) => n.id === e.from) && v.nodes.some((n) => n.id === e.to)), {
    message: "Every edge must connect two nodes that exist",
    path: ["edges"],
  });

export const VisualSchema = z.discriminatedUnion("kind", [
  EmojiVisual,
  GridVisual,
  ClockVisual,
  BarChartVisual,
  SvgVisual,
  CoinsVisual,
  RulerVisual,
  PictureGraphVisual,
  CalendarVisual,
  NetworkVisual,
]);

const ChoiceAnswer = z.object({
  type: z.literal("choice"),
  choices: z.array(z.string().min(1)).min(2).max(5),
  correctIndex: z.int().min(0),
});

const NumericAnswer = z.object({
  type: z.literal("numeric"),
  value: z.number(),
  unit: z.string().min(1).optional(),
});

// Someone's worked solution, shown step by step. The child taps the first step that is wrong.
const FindTheBugAnswer = z.object({
  type: z.literal("findTheBug"),
  solver: z.string().min(1),
  steps: z.array(z.string().min(1)).min(3).max(6),
  bugIndex: z.int().min(0),
  /** What the wrong step should have said. */
  fix: z.string().min(1),
});

export const AnswerSchema = z.discriminatedUnion("type", [ChoiceAnswer, NumericAnswer, FindTheBugAnswer]);

export const DifficultySchema = z.object({
  // 1 = easy warm-up, 5 = hardest in the current pool. Seeds the rating; never learned from one child.
  band: z.int().min(1).max(5),
  basis: z.enum(["kangaroo-points", "contest-position", "author-estimate"]),
  points: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
});

export const QuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Question ids are kebab-case"),
    source: z.object({
      kind: z.enum(["original", "kangaroo-style", "bebras-style", "contest"]),
      ref: z.string().min(1).optional(),
    }),
    skills: z.array(skillCode).min(1),
    language: z.enum(["en", "es", "fr"]).default("en"),
    prompt: z.string().min(1),
    // Read-aloud text when the prompt leans on emoji or symbols that TTS would mangle.
    speech: z.string().min(1).optional(),
    visual: VisualSchema.optional(),
    /** A short text the child reads before answering. Shown on screen, never read aloud automatically. */
    passage: z.string().min(1).optional(),
    /** A word or phrase to hear in another language, played with that language's voice. */
    listen: z.object({ text: z.string().min(1), lang: z.enum(["en-US", "es-ES", "fr-FR"]) }).optional(),
    /** Offer a microphone so the child can say a choice instead of tapping it (choice answers only). */
    voiceAnswer: z.boolean().optional(),
    answer: AnswerSchema,
    explanation: z.string().min(1),
    difficulty: DifficultySchema,
    reviewStatus: z.enum(["draft", "reviewed"]),
  })
  .superRefine((q, ctx) => {
    if (q.answer.type === "choice") {
      const { choices, correctIndex } = q.answer;
      if (correctIndex >= choices.length) {
        ctx.addIssue({
          code: "custom",
          path: ["answer", "correctIndex"],
          message: `correctIndex ${correctIndex} is out of range for ${choices.length} choices`,
        });
      }
      if (new Set(choices).size !== choices.length) {
        ctx.addIssue({ code: "custom", path: ["answer", "choices"], message: "Choices must be unique" });
      }
    }
    if (q.answer.type === "findTheBug") {
      const { steps, bugIndex, fix } = q.answer;
      if (bugIndex >= steps.length) {
        ctx.addIssue({ code: "custom", path: ["answer", "bugIndex"], message: `bugIndex ${bugIndex} is out of range for ${steps.length} steps` });
      }
      if (new Set(steps).size !== steps.length) {
        ctx.addIssue({ code: "custom", path: ["answer", "steps"], message: "Steps must be unique" });
      }
      if (steps[bugIndex] === fix) {
        ctx.addIssue({ code: "custom", path: ["answer", "fix"], message: "The fix must differ from the wrong step" });
      }
    }
    if (q.voiceAnswer && q.answer.type !== "choice") {
      ctx.addIssue({ code: "custom", path: ["voiceAnswer"], message: "voiceAnswer only works with choice answers" });
    }
    if (q.difficulty.basis === "kangaroo-points" && q.difficulty.points === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["difficulty", "points"],
        message: "kangaroo-points difficulty needs a points value",
      });
    }
    for (const { path, value } of walkStrings(q)) {
      if (value.includes(EM_DASH)) {
        ctx.addIssue({ code: "custom", path, message: "Em dashes are not allowed in content" });
      }
    }
  });

export const SkillFileSchema = z.array(SkillSchema);
export const QuestionFileSchema = z.array(QuestionSchema);

export type Skill = z.infer<typeof SkillSchema>;
export type Visual = z.infer<typeof VisualSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type Question = z.infer<typeof QuestionSchema>;

function* walkStrings(value: unknown, path: (string | number)[] = []): Generator<{ path: (string | number)[]; value: string }> {
  if (typeof value === "string") {
    yield { path, value };
  } else if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) yield* walkStrings(item, [...path, i]);
  } else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) yield* walkStrings(item, [...path, key]);
  }
}
