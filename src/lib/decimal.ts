import { Prisma } from "@prisma/client";

/**
 * Parses optional money fields from forms.
 * Invalid non-numeric input returns `undefined` (field ignored) so one bad optional field doesn't fail the whole action.
 */
export function toOptionalDecimal(
  raw: string | undefined | null,
): Prisma.Decimal | undefined {
  if (raw === undefined || raw === null) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  try {
    return new Prisma.Decimal(trimmed);
  } catch {
    return undefined;
  }
}
