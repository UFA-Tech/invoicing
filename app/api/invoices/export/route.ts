import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");

  const where = {
    userId: session.user.id,
    ...(ids ? { id: { in: ids.split(",") } } : {}),
  };

  const invoices = await prisma.invoice.findMany({
    where,
    include: { client: true },
    orderBy: { issueDate: "desc" },
  });

  const headers = [
    "No. Invoice",
    "Status",
    "Tanggal",
    "Jatuh Tempo",
    "Klien",
    "Email Klien",
    "Perusahaan",
    "Subtotal",
    "Pajak (%)",
    "Pajak",
    "Diskon",
    "Total",
    "Mata Uang",
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.status,
    format(inv.issueDate, "dd/MM/yyyy"),
    inv.dueDate ? format(inv.dueDate, "dd/MM/yyyy") : "",
    inv.client?.name ?? "",
    inv.client?.email ?? "",
    inv.client?.company ?? "",
    Number(inv.subtotal),
    Number(inv.taxRate),
    Number(inv.taxAmount),
    Number(inv.discount),
    Number(inv.total),
    inv.currency,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const filename = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
