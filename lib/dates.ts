// ============================================================================
// TO DO BUG RPG — calendar-day helpers.
//
// The app reasons about days, not instants: a daily resets on the player's own
// midnight and a quest is "due today" in their own timezone.
// ============================================================================

/**
 * `YYYY-MM-DD` in the player's own timezone. Deliberately not `toISOString()`,
 * which formats in UTC: east of Greenwich that names yesterday for most of the
 * morning, so a quest due "today" would not show up in Today, and the daily
 * reset would fire at the wrong hour.
 */
export function todayStr(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses a `YYYY-MM-DD` produced by todayStr back into a local Date. */
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
