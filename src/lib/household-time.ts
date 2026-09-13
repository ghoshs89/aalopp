import { cookies } from "next/headers";
import { localDateOf, safeTimeZone, type LocalDate } from "./engine/dates";

/** Today's date in the time zone of the device making the request (from the tz cookie), or UTC before it is set. */
export async function householdToday(): Promise<{ today: LocalDate; timeZone: string }> {
  const raw = (await cookies()).get("tz")?.value;
  const timeZone = safeTimeZone(raw ? decodeURIComponent(raw) : undefined);
  return { today: localDateOf(new Date(), timeZone), timeZone };
}
