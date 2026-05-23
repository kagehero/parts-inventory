import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Suspense } from "react";

import "@/app/globals.css";
import { AppSessionProvider } from "@/components/providers";
import { auth } from "@/auth";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "部品在庫・業務管理",
  description: "部品マスタ／在庫／注文入荷／出庫／顧客・機械・修理一覧",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="ja">
      <body className={`${noto.className} min-h-dvh bg-background text-foreground antialiased`}>
        <Suspense fallback={null}>
          <AppSessionProvider session={session}>{children}</AppSessionProvider>
        </Suspense>
      </body>
    </html>
  );
}
