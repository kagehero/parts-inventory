"use client";

export function OrderPrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print mb-4 max-w-[297mm] rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded border border-slate-400 bg-slate-50 px-3 py-2 text-sm font-medium"
          onClick={() => window.print()}
        >
          印刷 / PDF保存
        </button>
        <a className="rounded border border-slate-400 px-3 py-2 text-sm" href={backHref}>
          注文詳細に戻る
        </a>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        印刷設定の目安：<strong>用紙 A4・横向き</strong>、余白は<strong>「デフォルト」または「最小」</strong>。
        プレビュー下の余白が大きい場合は、余白を「なし／最小」に変更してください。
        ヘッダー・フッター（URL 等）が付く場合は、ブラウザの印刷オプションでオフにできます。
      </p>
    </div>
  );
}
