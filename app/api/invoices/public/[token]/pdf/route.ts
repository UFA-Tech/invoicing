import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getTemplate } from "@/components/invoice/templates";
import { logoToDataUrl } from "@/lib/logo";
import { put } from "@vercel/blob";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
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

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const filename = `${invoice.invoiceNumber}.pdf`;
    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    };

    // Serve from blob cache if available
    if (invoice.pdfCacheUrl) {
      try {
        const cached = await fetch(invoice.pdfCacheUrl);
        if (cached.ok) {
          return new NextResponse(new Uint8Array(await cached.arrayBuffer()), { headers });
        }
      } catch {
        // Fall through to regenerate
      }
    }

    const user = invoice.user;
    const logoDataUrl = user?.logoUrl ? await logoToDataUrl(user.logoUrl) : null;

    const normalizedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
      })),
    };

    const business = {
      businessName: user?.businessName ?? null,
      businessAddress: user?.businessAddress ?? null,
      businessPhone: user?.businessPhone ?? null,
      businessEmail: user?.businessEmail ?? null,
      taxNumber: user?.taxNumber ?? null,
      logoUrl: user?.logoUrl ?? null,
      logoDataUrl,
      invoicePrefix: user?.invoicePrefix ?? null,
      defaultCurrency: user?.defaultCurrency ?? null,
      defaultTerms: user?.defaultTerms ?? null,
      defaultTemplate: user?.defaultTemplate ?? null,
    };

    const Template = getTemplate(invoice.template ?? user?.defaultTemplate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(Template as any, { invoice: normalizedInvoice, business }) as any;
    const pdfBuffer = await renderToBuffer(element);

    // Upload to blob and persist URL
    try {
      const { url } = await put(`pdfs/${invoice.id}.pdf`, new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }), {
        access: "public",
        addRandomSuffix: false,
      });
      await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfCacheUrl: url } });
    } catch {
      // Cache write failure is non-critical
    }

    return new NextResponse(new Uint8Array(pdfBuffer), { headers });
  } catch (error) {
    console.error("Public PDF error:", error);
    return NextResponse.json({ error: "Gagal generate PDF" }, { status: 500 });
  }
}
