import { notFound } from "next/navigation";

import { CustomerEditForms } from "@/components/customers/customer-edit-forms";
import { DeleteMachineButton } from "@/components/customers/delete-machine-button";
import { MachineMiniForm } from "@/components/customers/machine-mini-form";
import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomerWithMachines } from "@/server/services/customers.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function CustomerDetailPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;

  const customer = await getCustomerWithMachines(id);

  if (!customer) return notFound();

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader title="顧客詳細" description={`${customer.name}／${customer.municipality}`} />

      <DashboardContent className="gap-10 px-8 py-6">
        <CustomerEditForms customer={customer} />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">保有機の追加（この顧客に紐づける）</h2>
          <MachineMiniForm customer={customer} />

          <Table containerClassName="border-muted mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>型式</TableHead>
                <TableHead>号機</TableHead>
                <TableHead>エンジン</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.machines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.modelName}</TableCell>
                  <TableCell>{m.unitNo}</TableCell>
                  <TableCell>{m.engineNo ?? "—"}</TableCell>
                  <TableCell>
                    <DeleteMachineButton machineId={m.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </DashboardContent>
    </DashboardPageFrame>
  );
}
