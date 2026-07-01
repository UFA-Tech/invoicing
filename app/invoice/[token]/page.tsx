import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { FileText, Download } from "lucide-react";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: {
      client: true,
      items: true,
      user: {
        select: {
          businessName: true,
          businessAddress: true,
          businessPhone: true,
          businessEmail: true,
          taxNumber: true,
          logoUrl: true,
          defaultTemplate: true,
          invoicePrefix: true,
          defaultCurrency: true,
          defaultTerms: true,
        },
      },
    },
  });

  if (!invoice) notFound();

  const user = invoice.user;

  const business = {
    businessName: user?.businessName ?? null,
    businessAddress: user?.businessAddress ?? null,
    businessPhone: user?.businessPhone ?? null,
    businessEmail: user?.businessEmail ?? null,
    taxNumber: user?.taxNumber ?? null,
    logoUrl: user?.logoUrl ?? null,
    invoicePrefix: user?.invoicePrefix ?? null,
    defaultCurrency: user?.defaultCurrency ?? null,
    defaultTerms: user?.defaultTerms ?? null,
    defaultTemplate: user?.defaultTemplate ?? null,
  };

  const previewData = {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate ?? undefined,
    currency: invoice.currency,
    template: invoice.template,
    client: invoice.client
      ? {
          id: invoice.client.id,
          name: invoice.client.name,
          email: invoice.client.email,
          phone: invoice.client.phone ?? undefined,
          address: invoice.client.address ?? undefined,
          company: invoice.client.company ?? undefined,
        }
      : undefined,
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      amount: Number(i.amount),
      unit: i.unit ?? undefined,
    })),
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    discount: Number(invoice.discount),
    total: Number(invoice.total),
    notes: invoice.notes ?? undefined,
    terms: invoice.terms ?? undefined,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">UFA Invoicing</span>
          </div>
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} />
            <a
              href={`/api/invoices/public/${token}/pdf`}
              download
              className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Unduh PDF
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <InvoicePreview
          data={previewData}
          business={business}
          template={invoice.template ?? user?.defaultTemplate ?? "classic"}
        />
      </main>
    </div>
  );
}
