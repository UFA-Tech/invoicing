import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";
import { calculateInvoiceTotals, generateInvoiceNumber } from "@/lib/utils";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  amount: z.number().positive(),
  unit: z.string().optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  status: z.nativeEnum(InvoiceStatus),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  currency: z.string().default("IDR"),
  template: z.string().default("classic"),
  client: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
  }),
  items: z.array(invoiceItemSchema).min(1),
  subtotal: z.number(),
  taxRate: z.number().default(0),
  taxAmount: z.number().default(0),
  discount: z.number().default(0),
  total: z.number(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as InvoiceStatus | null;
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" as const } },
              { client: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = invoiceSchema.parse(body);

    // Upsert client
    let clientId: string | null = null;
    if (data.client.id) {
      const existing = await prisma.client.findFirst({
        where: { id: data.client.id, userId: session.user.id },
      });
      if (existing) clientId = existing.id;
    }

    if (!clientId) {
      const client = await prisma.client.create({
        data: {
          userId: session.user.id,
          name: data.client.name,
          email: data.client.email,
          phone: data.client.phone,
          address: data.client.address,
          company: data.client.company,
        },
      });
      clientId = client.id;
    }

    const userId = session.user.id;

    // Recompute totals server-side rather than trusting the client-submitted
    // subtotal/taxAmount/total/item.amount, which can drift from the actual
    // line items due to stale form state or client bugs.
    const { itemAmounts, subtotal, taxAmount, total } = calculateInvoiceTotals(
      data.items,
      data.taxRate,
      data.discount
    );

    const invoice = await prisma.$transaction(async (tx) => {
      // Advisory lock serializes concurrent creates for the same user,
      // preventing two simultaneous requests from computing the same sequence number.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint)`;

      // If the submitted invoiceNumber was taken by a race (e.g. two tabs open),
      // derive the next available sequence inside the lock.
      let invoiceNumber = data.invoiceNumber;
      const conflict = await tx.invoice.findUnique({ where: { invoiceNumber } });
      if (conflict) {
        const last = await tx.invoice.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { invoiceNumber: true },
        });
        const prefix = invoiceNumber.match(/^[A-Za-z-]+/)?.[0] ?? "INV-";
        const parts = last?.invoiceNumber?.split("-") ?? [];
        const seq = parseInt(parts[parts.length - 1] ?? "0");
        invoiceNumber = generateInvoiceNumber(prefix, isNaN(seq) ? 1 : seq + 1);
      }

      return tx.invoice.create({
        data: {
          userId,
          clientId,
          invoiceNumber,
          status: data.status,
          issueDate: new Date(data.issueDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          subtotal,
          taxRate: data.taxRate,
          taxAmount,
          discount: data.discount,
          total,
          currency: data.currency,
          template: data.template,
          notes: data.notes,
          terms: data.terms,
          items: {
            create: data.items.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: itemAmounts[index],
              unit: item.unit,
            })),
          },
          events: {
            create: { type: "CREATED" },
          },
        },
        include: { client: true, items: true },
      });
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
