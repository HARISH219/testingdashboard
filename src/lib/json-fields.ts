/**
 * Encode/decode helpers for fields that Postgres modelled natively but SQLite
 * (Turso/libSQL) cannot: JSON objects and string arrays.
 *
 * Keeping these in one place means the rest of the codebase works with real
 * objects and arrays and never has to remember that the column is TEXT.
 */

/** Decode a JSON-object column. Returns {} on missing or malformed data. */
export function decodeJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** Encode a JSON-object column. */
export function encodeJson(value: Record<string, unknown> | undefined | null): string {
  return JSON.stringify(value ?? {});
}

/** Decode a JSON string-array column. Returns [] on missing or malformed data. */
export function decodeList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Encode a JSON string-array column. */
export function encodeList(value: readonly string[] | undefined | null): string {
  return JSON.stringify(value ?? []);
}
