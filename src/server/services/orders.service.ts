import type { OrderDocumentType, OrderLinePrintPartNoMode, Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/types";
import { applyStockDelta } from "@/server/inventory/stock-delta";

import { prisma, withReconnect } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";
import { orderLineStatusFromQuantities, orderProgressStatus } from "@/lib/domain/inventory";

function composeOrderLineDetail(input: {
  lineMode: "MASTER" | "FREE_TEXT";
  lineDetail?: string | null;
  machineModel?: string;
  machineUnitNo?: string;
  machineEngineNo?: string;
}): string | null {
  const explicit = input.lineDetail?.trim();
  if (explicit) return explicit;

  if (input.lineMode === "FREE_TEXT") {
    const fromMachine = [input.machineModel, input.machineUnitNo, input.machineEngineNo]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(" / ");
    return fromMachine || null;
  }

  return null;
}

/**
 * Purchase **receipt** is the only path that increases on-hand stock (incoming):
 * we append a `PURCHASE_IN` ledger row (positive `quantity`) and bump `Part.currentQty`
 * in the same transaction. Placing an order alone does not change stock.
 */

export async function createOrderHeader(input: {
  supplierId?: string | null;
  supplierName?: string;
  supplierFax?: string | null;
  supplierHonorific?: string | null;
  memo?: string;
  documentType?: OrderDocumentType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  supplierContactName?: string | null;
  printComment?: string;
}): Promise<{ id: string }> {
  const rawSid = input.supplierId;
  const sid = rawSid == null || String(rawSid).trim() === "" ? null : String(rawSid).trim();
  if (sid) {
    const s = await prisma.supplier.findUnique({ where: { id: sid } });
    if (!s) throw new ActionError("仕入先マスタが見つかりません");
  }

  const order = await prisma.order.create({
    data: {
      supplierId: sid,
      supplierName: input.supplierName?.trim() || undefined,
      supplierFax: input.supplierFax?.trim() || null,
      supplierHonorific:
        input.supplierHonorific == null || input.supplierHonorific.trim() === ""
          ? null
          : input.supplierHonorific.trim(),
      memo: input.memo?.trim() || undefined,
      printComment: input.printComment?.trim() || null,
      documentType: input.documentType ?? "PURCHASE_ORDER",
      contactName: input.contactName?.trim() || undefined,
      contactPhone: input.contactPhone?.trim() || undefined,
      contactEmail: input.contactEmail?.trim() || undefined,
      supplierContactName: input.supplierContactName?.trim() || null,
    },
  });
  return { id: order.id };
}

export async function appendOrderLine(input: {
  orderId: string;
  lineMode: "MASTER" | "FREE_TEXT";
  partId?: string;
  orderedQty: number;
  unitCost?: Prisma.Decimal | null;
  freeItemName?: string;
  freePartNo?: string;
  machineModel?: string;
  machineUnitNo?: string;
  machineEngineNo?: string;
  lineNote?: string | null;
  lineDetail?: string | null;
  endCustomerName?: string | null;
  printPartNoMode?: OrderLinePrintPartNoMode;
  printPartNoOverride?: string | null;
}): Promise<void> {
  await withReconnect(() => prisma.$transaction(async (tx) => {
    const parent = await tx.order.findUnique({ where: { id: input.orderId } });

    if (!parent || parent.status === "CANCELLED") {
      throw new ActionError("注文が見つからないか取り消されています");
    }

    if (input.lineMode === "MASTER") {
      const pid = input.partId?.trim();
      if (!pid) throw new ActionError("部品を選択してください");
      const lineDetail = composeOrderLineDetail(input);
      await tx.orderLine.create({
        data: {
          orderId: input.orderId,
          partId: pid,
          lineSource: "MASTER",
          printPartNoMode: input.printPartNoMode ?? "AUTO_AFTERMARKET",
          printPartNoOverride:
            input.printPartNoMode === "CUSTOM" ? input.printPartNoOverride?.trim() || null : null,
          orderedQty: input.orderedQty,
          unitCost: input.unitCost ?? undefined,
          lineDetail,
          endCustomerName: input.endCustomerName?.trim() || null,
          lineNote: input.lineNote?.trim() || null,
        },
      });
    } else {
      const name = input.freeItemName?.trim();
      if (!name) throw new ActionError("品名を入力してください");
      const lineDetail = composeOrderLineDetail(input);
      await tx.orderLine.create({
        data: {
          orderId: input.orderId,
          partId: null,
          lineSource: "FREE_TEXT",
          freeItemName: name,
          freePartNo: input.freePartNo?.trim() || undefined,
          machineModel: input.machineModel?.trim() || undefined,
          machineUnitNo: input.machineUnitNo?.trim() || undefined,
          machineEngineNo: input.machineEngineNo?.trim() || undefined,
          orderedQty: input.orderedQty,
          unitCost: input.unitCost ?? undefined,
          lineDetail,
          endCustomerName: input.endCustomerName?.trim() || null,
          lineNote: input.lineNote?.trim() || null,
        },
      });
    }

    const lines = await tx.orderLine.findMany({ where: { orderId: input.orderId } });
    await tx.order.update({
      where: { id: input.orderId },
      data: { status: orderProgressStatus(lines) },
    });
  }));
}

export async function receiveOrderLineTx(
  tx: DbClient,
  input: { orderLineId: string; quantity: number },
): Promise<{ orderId: string }> {
  const line = await tx.orderLine.findUnique({
    where: { id: input.orderLineId },
    include: { order: true },
  });

  if (!line || line.order.status === "CANCELLED") {
    throw new ActionError("明細が見つかりません");
  }

  if (!line.partId) {
    throw new ActionError("マスタ未登録の行は入荷できません（注文書／見積用の行です）");
  }

  const remaining = line.orderedQty - line.receivedQty;
  if (input.quantity > remaining) {
    throw new ActionError("入荷数量が発注残を超えています");
  }

  await tx.inventoryLog.create({
    data: {
      partId: line.partId,
      logType: "PURCHASE_IN",
      quantity: input.quantity,
      orderLineId: line.id,
    },
  });

  await applyStockDelta(tx, line.partId, input.quantity);

  const newReceived = line.receivedQty + input.quantity;

  await tx.orderLine.update({
    where: { id: line.id },
    data: {
      receivedQty: newReceived,
      lineStatus: orderLineStatusFromQuantities(line.orderedQty, newReceived),
    },
  });

  const lines = await tx.orderLine.findMany({ where: { orderId: line.orderId } });
  await tx.order.update({
    where: { id: line.orderId },
    data: { status: orderProgressStatus(lines) },
  });

  return { orderId: line.orderId };
}

export async function receiveOrderLine(input: { orderLineId: string; quantity: number }): Promise<{ orderId: string }> {
  return prisma.$transaction((tx) => receiveOrderLineTx(tx, input));
}

export async function cancelOrder(orderId: string): Promise<void> {
  const ord = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });

  if (!ord) throw new ActionError("注文が見つかりません");
  const hasRecv = ord.lines.some((l) => l.receivedQty > 0);
  if (hasRecv) throw new ActionError("すでに入荷がある注文は取り消せません");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
}

export async function updateOrderHeader(input: {
  orderId: string;
  supplierId?: string | null;
  supplierName?: string;
  supplierFax?: string | null;
  supplierHonorific?: string | null;
  memo?: string;
  documentType?: OrderDocumentType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  supplierContactName?: string | null;
  printComment?: string;
  quoteReplyAmount?: Prisma.Decimal | null;
  quoteReplyLeadTime?: string | null;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ord = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!ord) throw new ActionError("注文が見つかりません");
    if (ord.status === "CANCELLED") throw new ActionError("取消済みの注文は変更できません");

    let supplierId: string | null | undefined = undefined;
    if (input.supplierId !== undefined) {
      const sid = input.supplierId?.trim() || null;
      if (sid) {
        const s = await tx.supplier.findUnique({ where: { id: sid } });
        if (!s) throw new ActionError("仕入先マスタが見つかりません");
      }
      supplierId = sid;
    }

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        ...(supplierId !== undefined ? { supplierId } : {}),
        supplierName: input.supplierName?.trim() || undefined,
        supplierFax:
          input.supplierFax === undefined
            ? undefined
            : input.supplierFax?.trim() || null,
        supplierHonorific:
          input.supplierHonorific === undefined
            ? undefined
            : input.supplierHonorific == null || input.supplierHonorific.trim() === ""
              ? null
              : input.supplierHonorific.trim(),
        memo: input.memo?.trim() || undefined,
        printComment:
          input.printComment === undefined
            ? undefined
            : input.printComment?.trim() || null,
        documentType: input.documentType ?? undefined,
        contactName: input.contactName?.trim() || undefined,
        contactPhone: input.contactPhone?.trim() || undefined,
        contactEmail: input.contactEmail?.trim() || undefined,
        supplierContactName:
          input.supplierContactName === undefined
            ? undefined
            : input.supplierContactName?.trim() || null,
        quoteReplyAmount: input.quoteReplyAmount,
        quoteReplyLeadTime: input.quoteReplyLeadTime?.trim() || null,
      },
    });
  });
}

export async function deleteOrderLine(orderLineId: string): Promise<{ orderId: string }> {
  return prisma.$transaction(async (tx) => {
    const line = await tx.orderLine.findUnique({
      where: { id: orderLineId },
      include: { order: true },
    });
    if (!line) throw new ActionError("明細が見つかりません");
    if (line.order.status === "CANCELLED") throw new ActionError("取消済みの注文です");

    if (line.receivedQty > 0) {
      throw new ActionError("入荷済みの明細は削除できません");
    }

    const orderId = line.orderId;
    await tx.orderLine.delete({ where: { id: orderLineId } });

    const lines = await tx.orderLine.findMany({ where: { orderId } });
    await tx.order.update({
      where: { id: orderId },
      data: { status: orderProgressStatus(lines) },
    });

    return { orderId };
  });
}

export async function listOrdersForDashboard(params: { contact?: string; take?: number } = {}) {
  const take = params.take ?? 200;
  const contact = params.contact?.trim() ?? "";

  return prisma.order.findMany({
    where:
      contact.length > 0
        ? { contactName: { contains: contact, mode: "insensitive" } }
        : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      orderDate: true,
      status: true,
      supplierName: true,
      contactName: true,
      documentType: true,
      _count: { select: { lines: true } },
    },
  });
}

export async function getOrderWithLines(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      supplier: true,
      attachments: { orderBy: { createdAt: "asc" } },
      lines: { include: { part: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function updateOrderLine(input: {
  orderLineId: string;
  orderedQty: number;
  lineNote?: string | null;
  lineDetail?: string | null;
  endCustomerName?: string | null;
  printPartNoMode?: OrderLinePrintPartNoMode;
  printPartNoOverride?: string | null;
  freePartNo?: string | null;
  freeItemName?: string | null;
}): Promise<{ orderId: string }> {
  return withReconnect(() =>
    prisma.$transaction(async (tx) => {
      const line = await tx.orderLine.findUnique({
        where: { id: input.orderLineId },
        include: { order: true },
      });
      if (!line) throw new ActionError("明細が見つかりません");
      if (line.order.status === "CANCELLED") throw new ActionError("取消済みの注文です");

      if (input.orderedQty < line.receivedQty) {
        throw new ActionError("発注数量は入荷済み数量以上にしてください");
      }

      const data: Prisma.OrderLineUpdateInput = {
        orderedQty: input.orderedQty,
        lineStatus: orderLineStatusFromQuantities(input.orderedQty, line.receivedQty),
      };

      if (input.lineNote !== undefined) {
        data.lineNote = input.lineNote?.trim() || null;
      }
      if (input.lineDetail !== undefined) {
        data.lineDetail = input.lineDetail?.trim() || null;
      }
      if (input.endCustomerName !== undefined) {
        data.endCustomerName = input.endCustomerName?.trim() || null;
      }
      if (input.printPartNoMode !== undefined) {
        data.printPartNoMode = input.printPartNoMode;
        if (input.printPartNoMode !== "CUSTOM") {
          data.printPartNoOverride = null;
        }
      }
      if (input.printPartNoOverride !== undefined) {
        const effectiveMode = input.printPartNoMode ?? line.printPartNoMode;
        if (effectiveMode === "CUSTOM") {
          data.printPartNoOverride = input.printPartNoOverride?.trim() || null;
        }
      }
      if (line.lineSource === "FREE_TEXT") {
        if (input.freePartNo !== undefined) {
          data.freePartNo = input.freePartNo?.trim() || null;
        }
        if (input.freeItemName !== undefined) {
          data.freeItemName = input.freeItemName?.trim() || null;
        }
      }

      await tx.orderLine.update({
        where: { id: input.orderLineId },
        data,
      });

      const lines = await tx.orderLine.findMany({ where: { orderId: line.orderId } });
      await tx.order.update({
        where: { id: line.orderId },
        data: { status: orderProgressStatus(lines) },
      });

      return { orderId: line.orderId };
    }),
  );
}

export async function createOrderAttachmentRecord(input: {
  orderId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKind: "LOCAL" | "BLOB";
  fileUrl: string;
  storageRef: string;
}) {
  const row = await prisma.orderAttachment.create({
    data: {
      orderId: input.orderId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageKind: input.storageKind,
      fileUrl: input.storageKind === "BLOB" ? input.fileUrl : "https://local.invalid/pending",
      storageRef: input.storageRef,
    },
  });
  if (input.storageKind === "LOCAL") {
    return prisma.orderAttachment.update({
      where: { id: row.id },
      data: { fileUrl: `/api/order-attachments/${row.id}/file` },
    });
  }
  return row;
}

export async function getOrderAttachmentById(id: string) {
  return prisma.orderAttachment.findUnique({ where: { id } });
}
