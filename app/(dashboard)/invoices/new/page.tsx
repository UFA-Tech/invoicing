import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { generateInvoiceNumber } from "@/lib/utils";

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, lastInvoice] = await Promise.all([
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
    prisma.invoice.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    }),
  ]);

  const prefix = user?.invoicePrefix ?? "INV-";
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let nextSequence = 1;
  if (lastInvoice?.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const seq = parseInt(parts[parts.length - 1]);
    if (!isNaN(seq)) nextSequence = seq + 1;
  }

  const nextInvoiceNumber = generateInvoiceNumber(prefix, nextSequence);

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

  return (
    <div>
      <PageHeader
        title="Buat Invoice Baru"
        description="Isi form di bawah untuk membuat invoice baru"
      />
      <InvoiceForm business={business} nextInvoiceNumber={nextInvoiceNumber} />
    </div>
  );
}
