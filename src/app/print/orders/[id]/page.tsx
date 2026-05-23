import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { OrderPrintDocument } from "@/components/orders/order-print-document";
import { orderDocumentTypeLabel } from "@/lib/labels";
import { getOrderWithLines } from "@/server/services/orders.service";

type ParamsPromise = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: ParamsPromise }): Promise<Metadata> {
  const { id } = await props.params;
  const order = await getOrderWithLines(id);
  if (!order) return { title: "注文書" };
  const doc = orderDocumentTypeLabel[order.documentType];
  const supplier = order.supplierName?.trim();
  return {
    title: supplier ? `${doc} — ${supplier}` : doc,
  };
}

export default async function OrderPrintPage(props: { params: ParamsPromise }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await props.params;
  const order = await getOrderWithLines(id);
  if (!order) notFound();

  return <OrderPrintDocument order={order} />;
}
