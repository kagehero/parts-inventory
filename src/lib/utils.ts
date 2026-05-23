import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function coerceAmount(n: unknown): number | null {
  if (n === null || n === undefined || n === "") return null;
  if (
    typeof n === "object" &&
    n !== null &&
    "toNumber" in n &&
    typeof (n as { toNumber: unknown }).toNumber === "function"
  ) {
    const v = (n as { toNumber: () => number }).toNumber();
    return Number.isNaN(v) ? null : v;
  }
  const num = typeof n === "bigint" ? Number(n) : Number(n);
  return Number.isNaN(num) ? null : num;
}

/** Accepts Decimal (Prisma)、number、string、b bigint など */
export function yen(n: unknown) {
  const num = coerceAmount(n);
  if (num === null) return "—";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(num);
}

export function jpDateLabel(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeZone: "Asia/Tokyo",
  }).format(date);
}
