import { OrderPrintToolbar } from "@/components/orders/order-print-toolbar";
import {
  formatPrintRowNumber,
  getCompanyPrintProfile,
  getPrintDocumentTitle,
  PRINT_SUPPLIER_BLANK,
  resolvePrintItemName,
  resolvePrintLineDetail,
  resolvePrintPartNo,
  splitPartCodeSegments,
} from "@/lib/orders/print-display";
import { jpDateLabel } from "@/lib/utils";
import type { getOrderWithLines } from "@/server/services/orders.service";

type OrderWithLines = NonNullable<Awaited<ReturnType<typeof getOrderWithLines>>>;
type OrderLine = OrderWithLines["lines"][number];

const LINES_PER_PRINT_PAGE = 10;

function chunkLines(lines: OrderLine[], size: number): OrderLine[][] {
  if (lines.length === 0) return [[]];
  const chunks: OrderLine[][] = [];
  for (let i = 0; i < lines.length; i += size) {
    chunks.push(lines.slice(i, i + size));
  }
  return chunks;
}

function PrintPartCodeCell({ partNo }: { partNo: string }) {
  const [a, b, c, d] = splitPartCodeSegments(partNo);
  const segments = [a, b, c, d];
  const isEmpty = partNo === "—" || segments.every((s) => !s);

  if (isEmpty) {
    return (
      <div className="print-part-code-cell flex h-full items-stretch">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="print-part-code-segment flex-1" />
        ))}
      </div>
    );
  }

  return (
    <div className="print-part-code-cell flex h-full items-stretch font-mono leading-none">
      {segments.map((seg, i) => (
        <span key={i} className="print-part-code-segment flex flex-1 items-center justify-center px-0.5">
          {seg}
        </span>
      ))}
    </div>
  );
}

function PrintLinesTable({ lines, startIndex }: { lines: OrderLine[]; startIndex: number }) {
  const padded =
    lines.length >= LINES_PER_PRINT_PAGE
      ? lines
      : [
          ...lines,
          ...Array.from({ length: LINES_PER_PRINT_PAGE - lines.length }, (_, i) => ({
            id: `pad-${startIndex + lines.length + i}`,
            isPad: true as const,
          })),
        ];

  return (
    <table className="print-lines-table border border-black">
      <colgroup>
        <col style={{ width: "5%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "24%" }} />
        <col style={{ width: "5%" }} />
        <col style={{ width: "8%" }} />
        <col style={{ width: "8%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "6%" }} />
        <col style={{ width: "6%" }} />
      </colgroup>
      <thead>
        <tr>
          <th className="border border-black text-center" rowSpan={2}>
            No.
          </th>
          <th className="border border-black text-center" rowSpan={2}>
            部品コード
          </th>
          <th className="border border-black text-left" rowSpan={2}>
            品名(規格)
          </th>
          <th className="border border-black text-left" rowSpan={2}>
            詳細
          </th>
          <th className="border border-black text-center" rowSpan={2}>
            数量
          </th>
          <th className="border border-black text-center" rowSpan={2}>
            定価
          </th>
          <th className="border border-black text-center" rowSpan={2}>
            仕切単価
          </th>
          <th className="border border-black text-center" rowSpan={2}>
            お客様名
          </th>
          <th className="border border-black text-center" colSpan={2}>
            納期
          </th>
        </tr>
        <tr>
          <th className="border border-black text-center">月</th>
          <th className="border border-black text-center">日</th>
        </tr>
      </thead>
      <tbody>
        {padded.map((row, index) => {
          if ("isPad" in row && row.isPad) {
            return (
              <tr key={row.id} className="print-line-row print-line-row-empty">
                <td className="border border-black text-center">{formatPrintRowNumber(startIndex + index)}</td>
                <td className="border border-black p-0">
                  <PrintPartCodeCell partNo="—" />
                </td>
                <td className="border border-black" />
                <td className="border border-black" />
                <td className="border border-black" />
                <td className="print-supplier-blank border border-black" />
                <td className="print-supplier-blank border border-black" />
                <td className="border border-black" />
                <td className="print-supplier-blank border border-black" />
                <td className="print-supplier-blank border border-black" />
              </tr>
            );
          }

          const line = row as OrderLine;
          const partNo = resolvePrintPartNo(line);
          const detail = resolvePrintLineDetail(line);
          const customer = line.endCustomerName?.trim() || "";

          return (
            <tr key={line.id} className="print-line-row">
              <td className="border border-black text-center">{formatPrintRowNumber(startIndex + index)}</td>
              <td className="border border-black p-0">
                <PrintPartCodeCell partNo={partNo} />
              </td>
              <td className="border border-black">{resolvePrintItemName(line)}</td>
              <td className="border border-black whitespace-pre-wrap">{detail}</td>
              <td className="border border-black text-right tabular-nums">{line.orderedQty}</td>
              <td className="print-supplier-blank border border-black text-center">{PRINT_SUPPLIER_BLANK}</td>
              <td className="print-supplier-blank border border-black text-center">{PRINT_SUPPLIER_BLANK}</td>
              <td className="border border-black">{customer}</td>
              <td className="print-supplier-blank border border-black" />
              <td className="print-supplier-blank border border-black" />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PrintSenderBlock({
  order,
  company,
}: {
  order: OrderWithLines;
  company: ReturnType<typeof getCompanyPrintProfile>;
}) {
  return (
    <div className="print-sender-block">
      {company.name ? <p className="font-semibold">{company.name}</p> : null}
      {company.address ? <p>{company.address}</p> : null}
      {order.contactName ? <p>{order.contactName} 様</p> : null}
      {order.contactPhone ? <p>TEL {order.contactPhone}</p> : null}
      {order.contactEmail ? <p className="break-all">{order.contactEmail}</p> : null}
      {company.fax ? <p>FAX {company.fax}</p> : null}
    </div>
  );
}

export function OrderPrintDocument({ order }: { order: OrderWithLines }) {
  const company = getCompanyPrintProfile();
  const honor = order.supplierHonorific?.trim();
  const supplierBlock = honor
    ? `${order.supplierName ?? "＿＿＿＿＿＿"}　${honor}`
    : (order.supplierName ?? "＿＿＿＿＿＿");
  const linePages = chunkLines(order.lines, LINES_PER_PRINT_PAGE);
  const printComment = order.printComment?.trim() || "";

  return (
    <div className="print-root print-order-sheet bg-white text-black">
      <div className="no-print px-3 pt-3">
        <OrderPrintToolbar backHref={`/dashboard/orders/${order.id}`} />
      </div>

      {linePages.map((pageLines, pageIndex) => {
        const startIndex = pageIndex * LINES_PER_PRINT_PAGE;
        const isFirstPage = pageIndex === 0;

        return (
          <section
            key={pageIndex}
            className={`print-order-page ${pageIndex > 0 ? "print-page-break" : ""}`}
          >
            <div className="print-order-page-inner">
              {isFirstPage ? (
                <header className="print-order-header">
                  <div className="mb-1 flex items-start justify-between text-[9pt]">
                    <span>FAX送信方向 →</span>
                    <span className="tabular-nums">{jpDateLabel(order.orderDate)}</span>
                  </div>
                  <h1 className="mb-2 text-center text-[14pt] font-bold leading-tight">
                    {getPrintDocumentTitle(order.documentType)}
                  </h1>
                  <div className="space-y-0.5 text-[10pt] leading-snug">
                    <p className="text-[11pt]">{supplierBlock}</p>
                    <p>
                      <span className="font-semibold">FAX</span> {order.supplierFax?.trim() || "＿＿＿＿＿＿"}
                    </p>
                    {order.supplierContactName?.trim() ? (
                      <p className="text-[9pt]">ご担当：{order.supplierContactName.trim()}</p>
                    ) : null}
                  </div>
                </header>
              ) : (
                <header className="print-order-header border-b border-black pb-1 text-[9pt]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      {getPrintDocumentTitle(order.documentType)}（{pageIndex + 1}ページ目・続き）
                    </p>
                    <p className="tabular-nums">
                      {jpDateLabel(order.orderDate)}／{supplierBlock}
                    </p>
                  </div>
                </header>
              )}

              <div className="print-order-table-area">
                <PrintLinesTable lines={pageLines} startIndex={startIndex} />
              </div>

              {isFirstPage ? (
                <footer className="print-order-footer grid grid-cols-[1fr_auto] items-end gap-3 pt-1">
                  <div className="print-comment-box border border-black p-1.5">
                    <p className="mb-0.5 text-[8pt] font-semibold">コメント</p>
                    <div className="whitespace-pre-wrap text-[8.5pt] leading-snug">{printComment}</div>
                  </div>
                  <PrintSenderBlock order={order} company={company} />
                </footer>
              ) : null}
            </div>
          </section>
        );
      })}

      {order.lines.length > LINES_PER_PRINT_PAGE ? (
        <p className="no-print mx-auto max-w-[297mm] px-3 pb-6 text-xs text-slate-600">
          11行目以降は2ページ目に続きます（同じ注文書の続きとして印刷されます）。
        </p>
      ) : null}

      {order.attachments.length ? (
        <section className="print-hide-on-paper no-print mx-auto max-w-[297mm] px-3 pb-6 text-sm">
          <p className="font-semibold">添付（印刷には含まれません）</p>
          <ul className="list-inside list-disc">
            {order.attachments.map((a) => (
              <li key={a.id}>
                <a href={a.fileUrl} className="text-blue-700 underline" target="_blank" rel="noreferrer">
                  {a.fileName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
