import Link from "next/link";
import { FileText } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";

type InvoiceRow = {
  id: string;
  number: string;
  plan: string;
  status: string;
  issuedOn: Date;
  dueOn: Date;
  totalCents: number;
  customer: { name: string };
  disputes: { id: string; status: string }[];
};

export function displayInvoiceStatus(invoice: Pick<InvoiceRow, "status" | "disputes">) {
  const openDispute = invoice.disputes.some(
    (dispute) => dispute.status === "OPEN" || dispute.status === "NEEDS_REVIEW",
  );
  if (openDispute && invoice.status !== "PAID" && invoice.status !== "VOID") {
    return "DISPUTED";
  }
  return invoice.status;
}

export function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Issue date</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id} className="relative">
            <TableCell>
              <Link
                href={`/invoices/${invoice.id}`}
                className="inline-flex items-center gap-2 hover:underline after:absolute after:inset-0"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-soft text-indigo">
                  <FileText className="size-3.5" />
                </span>
                <span className="font-mono text-[13px] font-medium">{invoice.number}</span>
              </Link>
            </TableCell>
            <TableCell className="font-medium">{invoice.customer.name}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(invoice.issuedOn)}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(invoice.dueOn)}</TableCell>
            <TableCell className="text-right font-medium">{formatUsd(invoice.totalCents)}</TableCell>
            <TableCell>
              <InvoiceStatusBadge status={displayInvoiceStatus(invoice)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
