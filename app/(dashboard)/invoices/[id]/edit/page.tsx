import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";

export default async function EditInvoicePage({
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

  const invoiceForEdit = {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    discount: Number(invoice.discount),
    total: Number(invoice.total),
    items: invoice.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      amount: Number(i.amount),
    })),
  };

  return (
    <div>
      <PageHeader
        title={`Edit Invoice #${invoice.invoiceNumber}`}
        description="Perbarui detail invoice di bawah ini"
      />
      <InvoiceForm business={business} invoiceToEdit={invoiceForEdit as never} />
    </div>
  );
}
