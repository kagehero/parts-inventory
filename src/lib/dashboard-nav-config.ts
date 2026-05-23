import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Building2,
  LayoutDashboard,
  PackageOpen,
  Store,
  Truck,
  UsersRound,
  Warehouse,
  Wrench,
} from "lucide-react";

export type DashboardNavGroup = {
  title: string;
  items: { href: string; label: string; icon: LucideIcon }[];
};

/**
 * Sidebar / モバイルドロワー共通。上から業務フロー順。
 * - 概要 → SKU・在庫 → 調達・出庫 → 顧客・機械・修理PDF
 *
 * 「active」判定は `/dashboard/parts/[id]` のような子パスでも
 * `/dashboard/parts` をプレフィックスとしてハイライトする。
 */
export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    title: "総合",
    items: [{ href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard }],
  },
  {
    title: "マスタ・在庫",
    items: [
      { href: "/dashboard/parts", label: "部品マスタ", icon: Boxes },
      { href: "/dashboard/inventory", label: "在庫・履歴", icon: Warehouse },
    ],
  },
  {
    title: "調達・払い出し",
    items: [
      { href: "/dashboard/orders", label: "注文・入荷", icon: Truck },
      { href: "/dashboard/suppliers", label: "仕入先マスタ", icon: Store },
      { href: "/dashboard/outgoing", label: "出庫（使用）", icon: PackageOpen },
    ],
  },
  {
    title: "顧客・機械・記録",
    items: [
      { href: "/dashboard/customers", label: "顧客", icon: UsersRound },
      { href: "/dashboard/machines", label: "保有機", icon: Building2 },
      { href: "/dashboard/repairs", label: "修理履歴", icon: Wrench },
    ],
  },
];
