import Link from "next/link";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatus } from "@/types/invoice";

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: number;
  currency: string;
  dueDate: string;
  client: { name: string } | null;
}

export function RecentInvoices({ invoices }: { invoices: RecentInvoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Belum ada invoice
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {invoice.client?.name ?? "—"}
              </p>
              <p className="text-xs text-slate-400 font-mono">
                #{invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold font-mono text-slate-800">
                {formatCurrency(Number(invoice.total), invoice.currency)}
              </p>
              <p className="text-xs text-slate-400">
                {formatDate(invoice.dueDate)}
              </p>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
