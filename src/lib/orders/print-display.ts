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

/** 画面入力：明細を追加 */
export const LINE_DETAIL_APPEND_CHARS_PER_LINE = 21;
/** 画面入力：明細の編集 */
export const LINE_DETAIL_EDIT_CHARS_PER_LINE = 20;
/** 画面入力：共通 */
export const LINE_DETAIL_INPUT_MAX_LINES = 3;
export const LINE_DETAIL_INPUT_MAX_CHARS = 50;

/** 運用FAX：アルファベット大文字25字×2行 */
export const LINE_DETAIL_PRINT_CHARS_PER_LINE = 25;
export const LINE_DETAIL_PRINT_MAX_LINES = 2;

export type LineDetailInputMode = "append" | "edit";

export const printDetailInputClassName = "print-detail-input";

export function printDetailInputModeClass(mode: LineDetailInputMode): string {
  return mode === "append" ? "print-detail-input--append" : "print-detail-input--edit";
}

export function getPrintDetailFieldHint(mode: LineDetailInputMode): string {
  const perLine = mode === "append" ? LINE_DETAIL_APPEND_CHARS_PER_LINE : LINE_DETAIL_EDIT_CHARS_PER_LINE;
  return `FAX「詳細」は印刷時${LINE_DETAIL_PRINT_CHARS_PER_LINE}字×${LINE_DETAIL_PRINT_MAX_LINES}行（目安）。入力は${perLine}字で折り返し・${LINE_DETAIL_INPUT_MAX_LINES}行・合計${LINE_DETAIL_INPUT_MAX_CHARS}字まで。超える分はコメント欄へ。「更新（印刷に反映）」で保存。`;
}

/** @deprecated use LINE_DETAIL_INPUT_MAX_CHARS */
export const PRINT_DETAIL_MAX_CHARS = LINE_DETAIL_INPUT_MAX_CHARS;

/** 入力・保存用：最大3行・50文字まで */
export function sanitizeLineDetailInput(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").slice(0, LINE_DETAIL_INPUT_MAX_LINES);
  const joined = lines.join("\n");
  const chars = [...joined];
  if (chars.length <= LINE_DETAIL_INPUT_MAX_CHARS) return joined;
  return chars.slice(0, LINE_DETAIL_INPUT_MAX_CHARS).join("");
}

/**
 * 印刷表示用：25字で区切り、続きがある行末に「…」（最大2行）
 */
export function formatPrintLineDetail(text: string): string {
  const flat = text.trim().replace(/\r\n/g, "").replace(/\n/g, "");
  if (!flat) return "";

  const chars = [...flat];
  const lines: string[] = [];
  let pos = 0;

  for (let i = 0; i < LINE_DETAIL_PRINT_MAX_LINES && pos < chars.length; i++) {
    const chunk = chars.slice(pos, pos + LINE_DETAIL_PRINT_CHARS_PER_LINE);
    pos += chunk.length;
    let line = chunk.join("");
    if (pos < chars.length) line += "…";
    lines.push(line);
  }

  return lines.join("\n");
}

/**
 * @deprecated 印刷は formatPrintLineDetail を使用
 */
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
