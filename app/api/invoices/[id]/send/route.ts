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

    // Generate PDF buffer
    const pdfRes = await fetch(
      `${process.env.NEXTAUTH_URL}/api/invoices/${id}/pdf`,
      {
        headers: { cookie: _request.headers.get("cookie") ?? "" },
      }
    );
    if (!pdfRes.ok) {
      return NextResponse.json({ error: "Gagal generate PDF" }, { status: 500 });
    }
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    await sendInvoiceEmail({
      to: invoice.client.email,
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      invoiceTotal: formatCurrency(Number(invoice.total), invoice.currency),
      dueDate: formatDate(invoice.dueDate),
      businessName: user?.businessName ?? session.user.name ?? "Bisnis Anda",
      businessEmail: user?.businessEmail ?? session.user.email ?? "",
      pdfBuffer,
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        sentAt: new Date(),
        status: "SENT",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim email" },
      { status: 500 }
    );
  }
}
