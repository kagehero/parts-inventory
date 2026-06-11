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
export const printDetailLineInputClassName =
  "print-detail-line-input h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const printDetailFieldHint = `FAX「詳細」と同じ${LINE_DETAIL_CHARS_PER_LINE}字×${LINE_DETAIL_MAX_LINES}行（合計${LINE_DETAIL_MAX_CHARS}字）です。1行目が25字に達したら、下の「2行目」欄をクリックするか、1行目でEnterを押してください。入りきらない場合はコメント欄へ。`;

/** 1行分だけ25字に切り詰め */
export function sanitizeLineDetailLine(raw: string): string {
  return [...raw].slice(0, LINE_DETAIL_CHARS_PER_LINE).join("");
}

/** 保存値を1行目・2行目に分割（改行なしの長文も25字で折り分け） */
export function splitLineDetailLines(text: string): [string, string] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return ["", ""];

  if (normalized.includes("\n")) {
    const parts = normalized.split("\n").slice(0, LINE_DETAIL_MAX_LINES);
    return [sanitizeLineDetailLine(parts[0] ?? ""), sanitizeLineDetailLine(parts[1] ?? "")];
  }

  const flat = [...normalized].slice(0, LINE_DETAIL_MAX_CHARS);
  return [
    flat.slice(0, LINE_DETAIL_CHARS_PER_LINE).join(""),
    flat.slice(LINE_DETAIL_CHARS_PER_LINE).join(""),
  ];
}

/** 1行目・2行目を結合（合計50字・改行は字数に含めない） */
export function joinLineDetailLines(line1: string, line2: string): string {
  const l1 = sanitizeLineDetailLine(line1);
  const l2 = sanitizeLineDetailLine(line2);
  if (!l2) return l1;
  const maxLine2 = Math.max(0, LINE_DETAIL_MAX_CHARS - [...l1].length);
  const l2Trimmed = [...l2].slice(0, maxLine2).join("");
  return l2Trimmed ? `${l1}\n${l2Trimmed}` : l1;
}

export type LineDetailStats = {
  used: number;
  remaining: number;
  line1Len: number;
  line2Len: number;
  isFull: boolean;
};

export function getLineDetailStats(text: string): LineDetailStats {
  const [line1, line2] = splitLineDetailLines(text);
  const line1Len = [...line1].length;
  const line2Len = [...line2].length;
  const used = line1Len + line2Len;
  return {
    used,
    remaining: Math.max(0, LINE_DETAIL_MAX_CHARS - used),
    line1Len,
    line2Len,
    isFull: used >= LINE_DETAIL_MAX_CHARS,
  };
}

/** 入力・保存用：最大2行・50文字（改行は字数に含めない） */
export function sanitizeLineDetailInput(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").slice(0, LINE_DETAIL_MAX_LINES);
  const trimmed: string[] = [];
  let total = 0;

  for (const line of lines) {
    if (total >= LINE_DETAIL_MAX_CHARS) break;
    const chars = [...line];
    const take = Math.min(chars.length, LINE_DETAIL_CHARS_PER_LINE, LINE_DETAIL_MAX_CHARS - total);
    if (take <= 0) break;
    trimmed.push(chars.slice(0, take).join(""));
    total += take;
  }

  return trimmed.join("\n");
}

/** 印刷表示用：入力と同じ改行を維持。50字超のみ「…」 */
export function formatPrintLineDetail(text: string): string {
  const sanitized = sanitizeLineDetailInput(text);
  if (!sanitized) return "";

  const flat = [...sanitized.replace(/\n/g, "")];
  const lines = sanitized.split("\n");

  if (lines.length >= 2) {
    const line1 = [...lines[0] ?? ""].slice(0, LINE_DETAIL_CHARS_PER_LINE).join("");
    const line2 = [...lines[1] ?? ""].slice(0, LINE_DETAIL_CHARS_PER_LINE).join("");
    if (flat.length > LINE_DETAIL_MAX_CHARS) return `${line1}\n${line2}…`;
    return line2 ? `${line1}\n${line2}` : line1;
  }

  if (flat.length <= LINE_DETAIL_CHARS_PER_LINE) return sanitized;

  const line1 = flat.slice(0, LINE_DETAIL_CHARS_PER_LINE).join("");
  const line2 = flat.slice(LINE_DETAIL_CHARS_PER_LINE, LINE_DETAIL_MAX_CHARS).join("");
  if (flat.length <= LINE_DETAIL_MAX_CHARS) return `${line1}\n${line2}`;
  return `${line1}\n${line2}…`;
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
