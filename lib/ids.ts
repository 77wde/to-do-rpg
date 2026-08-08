/**
 * Ids double as primary keys in Postgres, where the columns are `uuid` — a
 * random base36 string would be rejected on insert.
 */
export function uid(): string {
  return crypto.randomUUID();
}
