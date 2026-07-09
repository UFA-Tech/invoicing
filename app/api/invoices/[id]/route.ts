import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";
import { del } from "@vercel/blob";
import { calculateInvoiceTotals } from "@/lib/utils";

const updateSchema = z.object({
  invoiceNumber: z.string().min(1).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().optional(),
  template: z.string().optional(),
  client: z
    .object({
      id: z.string().optional(),
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      address: z.string().optional(),
      company: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        amount: z.number().positive(),
        unit: z.string().optional(),
      })
    )
    .min(1)
    .optional(),
  subtotal: z.number().optional(),
  taxRate: z.number().optional(),
  taxAmount: z.number().optional(),
  discount: z.number().optional(),
  total: z.number().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paidAt: z.string().nullable().optional(),
});

async function getInvoiceOrForbid(id: string, userId: string) {
  return prisma.invoice.findFirst({
    where: { id, userId },
    include: { client: true, items: true },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const invoice = await getInvoiceOrForbid(id, session.user.id);
    if (!invoice) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await getInvoiceOrForbid(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    let clientId = existing.clientId;
    if (data.client) {
      if (data.client.id) {
        const c = await prisma.client.findFirst({
          where: { id: data.client.id, userId: session.user.id },
        });
        if (c) clientId = c.id;
      } else {
        const c = await prisma.client.create({
          data: {
            userId: session.user.id,
            name: data.client.name,
            email: data.client.email,
            phone: data.client.phone,
            address: data.client.address,
            company: data.client.company,
          },
        });
        clientId = c.id;
      }
    }

    const isPaidStatusChange = data.status === "PAID" && existing.status !== "PAID";
    const isUnpaidStatusChange =
      !!data.status && data.status !== "PAID" && existing.status === "PAID";

    // paidAt precedence: an explicit value in the request always wins (this is
    // how the "Tandai Lunas" quick action sets it). Otherwise, derive it from
    // the status transition so that marking PAID via the edit form's status
    // dropdown doesn't leave paidAt null (which would hide the invoice from
    // every paidAt-filtered revenue query), and reverting away from PAID
    // clears the stale paidAt.
    let paidAtUpdate: { paidAt: Date | null } | Record<string, never> = {};
    if (data.paidAt !== undefined) {
      paidAtUpdate = { paidAt: data.paidAt ? new Date(data.paidAt) : null };
    } else if (isPaidStatusChange) {
      paidAtUpdate = { paidAt: new Date() };
    } else if (isUnpaidStatusChange) {
      paidAtUpdate = { paidAt: null };
    }

    // Recompute totals server-side rather than trusting the client-submitted
    // subtotal/taxAmount/total/item.amount whenever items, taxRate, or
    // discount are part of this update — those values can drift from the
    // actual line items due to stale form state or client bugs.
    const shouldRecalcTotals =
      data.items !== undefined || data.taxRate !== undefined || data.discount !== undefined;
    const recalculated = shouldRecalcTotals
      ? calculateInvoiceTotals(
          data.items ??
            existing.items.map((item) => ({
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
            })),
          data.taxRate ?? Number(existing.taxRate),
          data.discount ?? Number(existing.discount)
        )
      : null;
    const itemsPayload = data.items?.map((item, index) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: recalculated!.itemAmounts[index],
      unit: item.unit,
    }));

    // Invalidate PDF cache on edit
    if (existing.pdfCacheUrl) {
      try { await del(existing.pdfCacheUrl); } catch {}
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.invoiceNumber && { invoiceNumber: data.invoiceNumber }),
        ...(data.status && { status: data.status }),
        ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.currency && { currency: data.currency }),
        ...(data.template && { template: data.template }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(recalculated && {
          subtotal: recalculated.subtotal,
          taxAmount: recalculated.taxAmount,
          total: recalculated.total,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.terms !== undefined && { terms: data.terms }),
        ...paidAtUpdate,
        clientId,
        ...(itemsPayload && {
          items: {
            deleteMany: {},
            create: itemsPayload,
          },
        }),
        pdfCacheUrl: null,
        events: {
          create: isPaidStatusChange
            ? { type: "PAID" }
            : { type: "EDITED" },
        },
      },
      include: { client: true, items: true },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await getInvoiceOrForbid(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
