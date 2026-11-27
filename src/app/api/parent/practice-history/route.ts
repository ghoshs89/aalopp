import { PRACTICE_HISTORY_PATH } from "@/lib/parent-lock";

// The parent unlock cookie is only sent under /parent. Browsers with the old
// export link will send that cookie when they follow this redirect.
export function GET() {
  return new Response(null, {
    status: 307,
    headers: { Location: PRACTICE_HISTORY_PATH, "Cache-Control": "private, no-store" },
  });
}
