"use server";

import { revalidatePath } from "next/cache";

import * as OrdersService from "@/server/services/orders.service";

import {
  orderHeaderSchema,
  orderHeaderUpdateSchema,
  orderLineAppendSchema,
  orderLineUpdateSchema,
  orderLineIdSchema,
  receiveLineSchema,
  orderShareEmailSchema,
} from "@/features/orders/schemas";
import {
  parseForm,
  guardAction,
  requireUser,
  ActionError,
  type ActionResult,
} from "@/lib/server/action-guard";
import { toOptionalDecimal } from "@/lib/decimal";
import { sendPlainEmail } from "@/lib/mail";
import { orderDocumentTypeLabel } from "@/lib/labels";

export async function createOrderHeader(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderHeaderSchema, Object.fromEntries(formData.entries()));

    const row = await OrdersService.createOrderHeader({
      supplierId: parsed.supplierId?.trim() || null,
      supplierName: parsed.supplierName?.trim() || undefined,
      supplierFax: parsed.supplierFax?.trim() || null,
      supplierHonorific: parsed.supplierHonorific?.trim() || null,
      memo: parsed.memo?.trim() || undefined,
      documentType: parsed.documentType,
      contactName: parsed.contactName?.trim() || undefined,
      contactPhone: parsed.contactPhone?.trim() || undefined,
      contactEmail: parsed.contactEmail?.trim() || undefined,
      supplierContactName: parsed.supplierContactName?.trim() || null,
      printComment: parsed.printComment?.trim() || undefined,
    });

    revalidatePath("/dashboard/orders");
    return { id: row.id };
  });
}

export async function updateOrderHeader(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderHeaderUpdateSchema, Object.fromEntries(formData.entries()));

    await OrdersService.updateOrderHeader({
      orderId: parsed.orderId,
      supplierId: parsed.supplierId !== undefined ? parsed.supplierId.trim() || null : undefined,
      supplierName: parsed.supplierName,
      supplierFax:
        parsed.supplierFax !== undefined ? parsed.supplierFax.trim() || null : undefined,
      supplierHonorific:
        parsed.supplierHonorific !== undefined
          ? parsed.supplierHonorific.trim() || null
          : undefined,
      memo: parsed.memo,
      documentType: parsed.documentType,
      contactName: parsed.contactName,
      contactPhone: parsed.contactPhone,
      contactEmail: parsed.contactEmail,
      supplierContactName: parsed.supplierContactName?.trim() || null,
      printComment: parsed.printComment?.trim() || undefined,
      quoteReplyAmount:
        parsed.quoteReplyAmount?.trim() === ""
          ? null
          : toOptionalDecimal(parsed.quoteReplyAmount ?? undefined),
      quoteReplyLeadTime: parsed.quoteReplyLeadTime?.trim() || null,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${parsed.orderId}`);
    revalidatePath(`/print/orders/${parsed.orderId}`);
  });
}

export async function appendOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const raw = Object.fromEntries(formData.entries());
    const normalized = {
      ...raw,
      lineMode:
        typeof raw.lineMode === "string" ? raw.lineMode.trim().toUpperCase() : raw.lineMode,
    };
    const parsed = parseForm(orderLineAppendSchema, normalized);

    await OrdersService.appendOrderLine({
      orderId: parsed.orderId,
      lineMode: parsed.lineMode,
      partId: parsed.partId?.trim() || undefined,
      printPartNoMode: parsed.printPartNoMode,
      printPartNoOverride: parsed.printPartNoOverride?.trim() || null,
      orderedQty: parsed.orderedQty,
      unitCost: toOptionalDecimal(parsed.unitCost ?? undefined),
      freeItemName: parsed.freeItemName,
      freePartNo: parsed.freePartNo,
      machineModel: parsed.machineModel,
      machineUnitNo: parsed.machineUnitNo,
      machineEngineNo: parsed.machineEngineNo,
      lineDetail: parsed.lineDetail !== undefined ? parsed.lineDetail.trim() || null : undefined,
      endCustomerName:
        parsed.endCustomerName !== undefined ? parsed.endCustomerName.trim() || null : undefined,
      lineNote: parsed.lineNote !== undefined ? parsed.lineNote.trim() || null : undefined,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${parsed.orderId}`);
    revalidatePath(`/print/orders/${parsed.orderId}`);
  });
}

export async function receiveOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(receiveLineSchema, Object.fromEntries(formData.entries()));

    const { orderId } = await OrdersService.receiveOrderLine({
      orderLineId: parsed.orderLineId,
      quantity: parsed.quantity,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/parts");
    revalidatePath(`/print/orders/${orderId}`);
  });
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    await OrdersService.cancelOrder(orderId);

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
  });
}

export async function deleteOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderLineIdSchema, Object.fromEntries(formData.entries()));

    const { orderId } = await OrdersService.deleteOrderLine(parsed.orderLineId);

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath(`/print/orders/${orderId}`);
  });
}

export async function updateOrderLine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderLineUpdateSchema, Object.fromEntries(formData.entries()));

    const { orderId } = await OrdersService.updateOrderLine({
      orderLineId: parsed.orderLineId,
      orderedQty: parsed.orderedQty,
      lineNote: parsed.lineNote !== undefined ? parsed.lineNote.trim() || null : undefined,
      lineDetail: parsed.lineDetail !== undefined ? parsed.lineDetail.trim() || null : undefined,
      endCustomerName:
        parsed.endCustomerName !== undefined ? parsed.endCustomerName.trim() || null : undefined,
      printPartNoMode: parsed.printPartNoMode,
      printPartNoOverride:
        parsed.printPartNoOverride !== undefined ? parsed.printPartNoOverride.trim() || null : undefined,
      freePartNo: parsed.freePartNo !== undefined ? parsed.freePartNo.trim() || null : undefined,
      freeItemName: parsed.freeItemName !== undefined ? parsed.freeItemName.trim() || null : undefined,
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath(`/print/orders/${orderId}`);
  });
}

/** メール本文に印刷用URLを記載（Resend 要設定） */
export async function sendOrderShareEmail(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(orderShareEmailSchema, Object.fromEntries(formData.entries()));

    const order = await OrdersService.getOrderWithLines(parsed.orderId);
    if (!order) throw new ActionError("注文が見つかりません");

    const to = parsed.to;

    const origin = process.env.AUTH_URL?.replace(/\/$/, "") ?? "";
    const printPath = `/print/orders/${parsed.orderId}`;
    const printUrl = origin ? `${origin}${printPath}` : printPath;

    const text = [
      "注文書／見積文書の共有",
      "",
      `書類種別: ${orderDocumentTypeLabel[order.documentType]}`,
      `発注先: ${order.supplierName ?? "—"}`,
      `注文日: ${order.orderDate.toISOString().slice(0, 10)}`,
      "",
      "ブラウザで開き、印刷（またはPDF保存）できます:",
      printUrl,
      "",
      "---",
      order.printComment?.trim() || order.memo?.trim() || "",
    ].join("\n");

    const sent = await sendPlainEmail({
      to,
      subject: `【共有】${orderDocumentTypeLabel[order.documentType]}（${order.supplierName ?? "未記入"}）`,
      text,
    });

    if (!sent.ok) throw new ActionError(sent.message);
    revalidatePath(`/dashboard/orders/${parsed.orderId}`);
  });
}
