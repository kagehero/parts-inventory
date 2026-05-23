import type { OrderLineStatus, OrderStatus } from "@prisma/client";

export function orderLineStatusFromQuantities(orderedQty: number, receivedQty: number): OrderLineStatus {
  if (receivedQty >= orderedQty) return "RECEIVED";
  if (receivedQty > 0) return "PARTIALLY_RECEIVED";
  return "ORDERED";
}

/** Derives aggregate `Order.status` from all lines */
export function orderProgressStatus(lines: { orderedQty: number; receivedQty: number }[]): OrderStatus {
  if (lines.length === 0) return "OPEN";
  const received = lines.filter((l) => l.receivedQty >= l.orderedQty).length;
  const none = lines.filter((l) => l.receivedQty === 0).length;
  if (received === lines.length) return "RECEIVED";
  if (none === lines.length) return "OPEN";
  return "PARTIALLY_RECEIVED";
}
