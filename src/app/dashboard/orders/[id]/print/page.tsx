import { redirect } from "next/navigation";

type ParamsPromise = Promise<{ id: string }>;

/** @deprecated use /print/orders/[id] */
export default async function LegacyOrderPrintRedirect(props: { params: ParamsPromise }) {
  const { id } = await props.params;
  redirect(`/print/orders/${id}`);
}
