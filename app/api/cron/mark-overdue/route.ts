import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron calls this endpoint nightly (see vercel.json).
// CRON_SECRET must be set in Vercel env vars; Vercel sends it as the
// Authorization: Bearer header automatically.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find invoices that are SENT but past their due date
  const due = await prisma.invoice.findMany({
    where: { status: "SENT", dueDate: { lt: now } },
    select: { id: true },
  });

  if (due.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const ids = due.map((i) => i.id);

  // Update status + create audit events atomically
  await prisma.$transaction([
    prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: { status: "OVERDUE" },
    }),
    prisma.invoiceEvent.createMany({
      data: ids.map((id) => ({
        invoiceId: id,
        type: "STATUS_CHANGED",
        note: "Jatuh tempo — diperbarui otomatis",
      })),
    }),
  ]);

  return NextResponse.json({ updated: ids.length });
}
