/** 印刷専用レイアウト（dashboard サイドバー・業務コンソールなし） */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="print-route">{children}</div>;
}
