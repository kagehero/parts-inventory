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

/** 運用FAX・画面入力・印刷：すべて 25字×2行 */
export const LINE_DETAIL_CHARS_PER_LINE = 25;
export const LINE_DETAIL_MAX_LINES = 2;
export const LINE_DETAIL_MAX_CHARS = LINE_DETAIL_CHARS_PER_LINE * LINE_DETAIL_MAX_LINES;

/** @deprecated */
export const LINE_DETAIL_INPUT_MAX_LINES = LINE_DETAIL_MAX_LINES;
/** @deprecated */
export const LINE_DETAIL_INPUT_MAX_CHARS = LINE_DETAIL_MAX_CHARS;
/** @deprecated */
export const LINE_DETAIL_PRINT_CHARS_PER_LINE = LINE_DETAIL_CHARS_PER_LINE;
/** @deprecated */
export const LINE_DETAIL_PRINT_MAX_LINES = LINE_DETAIL_MAX_LINES;
/** @deprecated */
export const PRINT_DETAIL_MAX_CHARS = LINE_DETAIL_MAX_CHARS;

export const printDetailInputClassName = "print-detail-input text-sm";

export const printDetailFieldHint = `FAX「詳細」と同じ${LINE_DETAIL_CHARS_PER_LINE}字×${LINE_DETAIL_MAX_LINES}行（合計${LINE_DETAIL_MAX_CHARS}字）です。入りきらない場合は注文書下部のコメント欄へ。「更新（印刷に反映）」で保存されます。`;

/** 入力・保存用：最大2行・50文字まで */
export function sanitizeLineDetailInput(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").slice(0, LINE_DETAIL_MAX_LINES);
  const joined = lines.join("\n");
  const chars = [...joined];
  if (chars.length <= LINE_DETAIL_MAX_CHARS) return joined;
  return chars.slice(0, LINE_DETAIL_MAX_CHARS).join("");
}

/** 印刷表示用：25字×2行。入力の改行を維持し、超過時は末行に「…」 */
export function formatPrintLineDetail(text: string): string {
  const normalized = text.trim().replace(/\r\n/g, "\n");
  if (!normalized) return "";

  const userLines = normalized.split("\n").slice(0, LINE_DETAIL_MAX_LINES);
  const output: string[] = [];
  let charCount = 0;

  for (const userLine of userLines) {
    if (output.length >= LINE_DETAIL_MAX_LINES || charCount >= LINE_DETAIL_MAX_CHARS) break;
    const remaining = LINE_DETAIL_MAX_CHARS - charCount;
    const lineChars = [...userLine].slice(0, Math.min(LINE_DETAIL_CHARS_PER_LINE, remaining));
    charCount += lineChars.length;
    output.push(lineChars.join(""));
  }

  if (output.length === 0) return "";

  if (userLines.length === 1 && [...userLines[0]!].length > LINE_DETAIL_CHARS_PER_LINE) {
    const chars = [...userLines[0]!];
    const line1 = chars.slice(0, LINE_DETAIL_CHARS_PER_LINE).join("");
    const line2 = chars.slice(LINE_DETAIL_CHARS_PER_LINE, LINE_DETAIL_MAX_CHARS).join("");
    if (!line2) return line1;
    const truncated = chars.length > LINE_DETAIL_MAX_CHARS;
    return truncated ? `${line1}\n${line2}…` : `${line1}\n${line2}`;
  }

  const flatLen = [...normalized.replace(/\n/g, "")].length;
  if (flatLen > LINE_DETAIL_MAX_CHARS) {
    output[output.length - 1] = `${output[output.length - 1]!}…`;
  }
  return output.join("\n");
}

/** @deprecated */
export function softWrapPrintDetail(text: string): string {
  return formatPrintLineDetail(text);
}

/** 印刷：品名右の詳細欄 */
export function resolvePrintLineDetail(line: OrderLineForPrint): string {
  const detail = line.lineDetail?.trim();
  if (detail) return formatPrintLineDetail(detail);

  if (line.lineSource === "FREE_TEXT") {
    const machine = [line.machineModel, line.machineUnitNo, line.machineEngineNo]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(" / ");
    return machine ? formatPrintLineDetail(machine) : "";
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
