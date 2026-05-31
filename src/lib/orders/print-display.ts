import type { OrderDocumentType, OrderLine, OrderLinePrintPartNoMode, Part } from "@prisma/client";

export type OrderLineForPrint = Pick<
  OrderLine,
  | "lineSource"
  | "freePartNo"
  | "freeItemName"
  | "machineModel"
  | "machineUnitNo"
  | "machineEngineNo"
  | "lineDetail"
  | "endCustomerName"
  | "printPartNoMode"
  | "printPartNoOverride"
> & {
  part?: Pick<Part, "name" | "oemPartNo" | "aftermarketNo" | "compatibleModels"> | null;
};

/** 自社情報（.env） */
export function getCompanyPrintProfile() {
  const name = process.env.COMPANY_NAME?.trim() || null;
  const fax = process.env.COMPANY_FAX?.trim() || null;
  const address = process.env.COMPANY_ADDRESS?.trim() || null;
  return { name, fax, address };
}

/** FAX様式タイトル（書類種別に応じてどちらか一方） */
export function getPrintDocumentTitle(documentType: OrderDocumentType): string {
  switch (documentType) {
    case "QUOTE_REQUEST":
      return "見積もり";
    case "PURCHASE_ORDER":
    default:
      return "部品注文";
  }
}

export const printPartNoModeLabels: Record<OrderLinePrintPartNoMode, string> = {
  AUTO_AFTERMARKET: "社外番号（優先）",
  AUTO_OEM: "純正番号",
  NONE: "品番を出さない",
  CUSTOM: "直接指定",
};

const CIRCLED_ROW_NUMBERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"] as const;

export function formatPrintRowNumber(index: number): string {
  if (index >= 0 && index < CIRCLED_ROW_NUMBERS.length) {
    return CIRCLED_ROW_NUMBERS[index]!;
  }
  return String(index + 1);
}

/** 部品コードを 4-3-3-2 目安の4分割（点線表示用） */
export function splitPartCodeSegments(partNo: string): [string, string, string, string] {
  const raw = partNo.trim();
  if (!raw || raw === "—") {
    return ["", "", "", ""];
  }

  const separatorParts = raw.split(/[-\s/／]+/).filter(Boolean);
  if (separatorParts.length >= 2) {
    return [
      separatorParts[0] ?? "",
      separatorParts[1] ?? "",
      separatorParts[2] ?? "",
      separatorParts.slice(3).join("-") ?? "",
    ];
  }

  const compact = raw.replace(/[-\s/／]/g, "");
  if (compact.length > 4) {
    return [
      compact.slice(0, 4),
      compact.slice(4, 7),
      compact.slice(7, 10),
      compact.slice(10, 12),
    ];
  }

  return [raw, "", "", ""];
}

/** 印刷プレビュー用：現在の設定で出る品番 */
export function resolvePrintPartNo(line: OrderLineForPrint): string {
  if (line.lineSource === "FREE_TEXT") {
    return line.freePartNo?.trim() || "—";
  }

  const oem = line.part?.oemPartNo?.trim() || "";
  const aftermarket = line.part?.aftermarketNo?.trim() || "";

  switch (line.printPartNoMode) {
    case "AUTO_OEM":
      return oem || aftermarket || "—";
    case "AUTO_AFTERMARKET":
      return aftermarket || oem || "—";
    case "NONE":
      return "—";
    case "CUSTOM":
      return line.printPartNoOverride?.trim() || "—";
    default:
      return aftermarket || oem || "—";
  }
}

export function resolvePrintItemName(line: OrderLineForPrint): string {
  if (line.lineSource === "FREE_TEXT") {
    return line.freeItemName?.trim() || "—";
  }
  return line.part?.name?.trim() || "—";
}

/** 印刷：品名右の詳細欄 — 1行あたりの目安文字数（入力UIと印刷列を揃える） */
export const PRINT_DETAIL_CHARS_PER_LINE = 28;

/** 印刷向けクラス名（注文詳細の詳細入力と同じ幅・書体） */
export const printDetailInputClassName =
  "print-detail-input min-h-[calc(2*1.35em+0.5rem)] w-full max-w-[28ch] font-mono text-[11px] leading-[1.35] tabular-nums";

export const printDetailFieldHint = `印刷の「詳細」欄と同じ幅です（${PRINT_DETAIL_CHARS_PER_LINE}文字×2行・等幅）。「更新（印刷に反映）」で保存されます。`;

/** 画面プレビュー用 — 印刷と同じ折り返しルールを適用 */
export function previewPrintLineDetail(text: string): string {
  return softWrapPrintDetail(text);
}

/**
 * 数字列の途中で折り返さないよう、区切りや長い英数字列の境界にゼロ幅スペースを入れる。
 */
export function softWrapPrintDetail(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const withSeparatorBreaks = trimmed.replace(/([/／\-\u2010-\u2015\s]+)/g, "$1\u200b");

  return withSeparatorBreaks.replace(/([A-Za-z0-9]{8,})/g, (run) => {
    const chunks: string[] = [];
    for (let i = 0; i < run.length; i += 6) {
      chunks.push(run.slice(i, i + 6));
    }
    return chunks.join("\u200b");
  });
}

/** 印刷：品名右の詳細欄 */
export function resolvePrintLineDetail(line: OrderLineForPrint): string {
  const detail = line.lineDetail?.trim();
  if (detail) return detail;

  if (line.lineSource === "FREE_TEXT") {
    return (
      [line.machineModel, line.machineUnitNo, line.machineEngineNo]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(" / ") || ""
    );
  }

  return "";
}

/** @deprecated use resolvePrintLineDetail */
export function resolvePrintMachineSpec(line: OrderLineForPrint): string {
  const detail = resolvePrintLineDetail(line);
  return detail || "—";
}

/** 発注先記入用：定価・仕切単価・納期は空欄セル */
export const PRINT_SUPPLIER_BLANK = "";
