import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pencil, Download, ArrowLeft } from "lucide-react";
import { cn, formatCurrency, formatDateLong } from "@/lib/utils";
import { InvoiceDetailActions } from "@/components/invoice/InvoiceDetailActions";
import { InvoiceShareButtons } from "@/components/invoice/InvoiceShareButtons";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const [invoice, user] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
      include: { client: true, items: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
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
    }),
  ]);

  if (!invoice) notFound();

  const business = {
    businessName: user?.businessName ?? null,
    businessAddress: user?.businessAddress ?? null,
    businessPhone: user?.businessPhone ?? null,
    businessEmail: user?.businessEmail ?? null,
    taxNumber: user?.taxNumber ?? null,
    logoUrl: user?.logoUrl ?? null,
    defaultTemplate: user?.defaultTemplate ?? null,
    invoicePrefix: user?.invoicePrefix ?? null,
    defaultCurrency: user?.defaultCurrency ?? null,
    defaultTerms: user?.defaultTerms ?? null,
  };

  const previewData = {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/invoices"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-slate-500")}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      <PageHeader
        title={`Invoice #${invoice.invoiceNumber}`}
        description={`Dibuat pada ${formatDateLong(invoice.createdAt)}`}
      >
        <InvoiceStatusBadge status={invoice.status} />
        <InvoiceShareButtons invoiceId={id} existingToken={invoice.publicToken} />
        <InvoiceDetailActions invoiceId={id} status={invoice.status} />
        <Link
          href={`/invoices/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Link>
        <a
          href={`/api/invoices/${id}/pdf`}
          download
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </a>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InvoicePreview
            data={previewData}
            business={business}
            template={invoice.template ?? business.defaultTemplate ?? "classic"}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono">
                  {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                </span>
              </div>
              {Number(invoice.taxRate) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pajak ({Number(invoice.taxRate)}%)</span>
                  <span className="font-mono">
                    {formatCurrency(Number(invoice.taxAmount), invoice.currency)}
                  </span>
                </div>
              )}
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Diskon</span>
                  <span className="font-mono text-red-500">
                    -{formatCurrency(Number(invoice.discount), invoice.currency)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="font-mono">
                  {formatCurrency(Number(invoice.total), invoice.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Riwayat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">Dibuat</p>
                  <p className="text-slate-400">{formatDateLong(invoice.createdAt)}</p>
                </div>
              </div>
              {invoice.sentAt && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">Dikirim</p>
                    <p className="text-slate-400">{formatDateLong(invoice.sentAt)}</p>
                  </div>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">Dibayar</p>
                    <p className="text-slate-400">{formatDateLong(invoice.paidAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
