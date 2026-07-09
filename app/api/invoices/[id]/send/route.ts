import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const [invoice, user] = await Promise.all([
      prisma.invoice.findFirst({
        where: { id, userId: session.user.id },
        include: { client: true, items: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
      }),
    ]);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }
    if (!invoice.client?.email) {
      return NextResponse.json(
        { error: "Email klien tidak tersedia" },
        { status: 400 }
      );
    }

    // Don't downgrade an already-PAID invoice back to SENT just because the
    // email was resent (e.g. sending a copy/reminder after payment).
    const nextStatus = invoice.status === "PAID" ? invoice.status : "SENT";

    // Update status (and invalidate any cached PDF) before generating the
    // PDF, so the attachment reflects the correct status instead of a stale
    // cached DRAFT render. If PDF generation or the email send fails below,
    // this is rolled back so the invoice isn't left marked SENT with no
    // email actually delivered.
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        sentAt: new Date(),
        status: nextStatus,
        pdfCacheUrl: null,
        events: {
          create: { type: "SENT" },
        },
      },
      include: { events: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const sentEventId = updated.events?.[0]?.id;

    try {
      // Generate PDF buffer
      const pdfRes = await fetch(
        `${process.env.NEXTAUTH_URL}/api/invoices/${id}/pdf`,
        {
          headers: { cookie: _request.headers.get("cookie") ?? "" },
        }
      );
      if (!pdfRes.ok) {
        throw new Error("Gagal generate PDF");
      }
      const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

      await sendInvoiceEmail({
        to: invoice.client.email,
        clientName: invoice.client.name,
        invoiceNumber: invoice.invoiceNumber,
        invoiceTotal: formatCurrency(Number(invoice.total), invoice.currency),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : null,
        businessName: user?.businessName ?? session.user.name ?? "Bisnis Anda",
        businessEmail: user?.businessEmail ?? session.user.email ?? "",
        pdfBuffer,
      });
    } catch (error) {
      await prisma.invoice.update({
        where: { id },
        data: {
          sentAt: invoice.sentAt,
          status: invoice.status,
          pdfCacheUrl: invoice.pdfCacheUrl,
          ...(sentEventId ? { events: { delete: { id: sentEventId } } } : {}),
        },
      });
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim email" },
      { status: 500 }
    );
  }
}
