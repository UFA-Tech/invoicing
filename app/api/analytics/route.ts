import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format, differenceInDays } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();

  // ── Revenue per month (last 12 months) ───────────────────────────────────
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMM yy") };
  });

  const revenueByMonth = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const result = await prisma.invoice.aggregate({
        where: { userId, status: "PAID", paidAt: { gte: start, lte: end } },
        _sum: { total: true },
      });
      return { month: label, revenue: Number(result._sum.total ?? 0) };
    })
  );

  // ── Revenue per client (top 8) ───────────────────────────────────────────
  const paidInvoices = await prisma.invoice.findMany({
    where: { userId, status: "PAID" },
    include: { client: { select: { name: true } } },
  });

  const clientMap: Record<string, number> = {};
  for (const inv of paidInvoices) {
    const name = inv.client?.name ?? "Tanpa Klien";
    clientMap[name] = (clientMap[name] ?? 0) + Number(inv.total);
  }
  const revenueByClient = Object.entries(clientMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Conversion funnel ─────────────────────────────────────────────────────
  const [draft, sent, paid, overdue, cancelled] = await Promise.all([
    prisma.invoice.count({ where: { userId, status: "DRAFT" } }),
    prisma.invoice.count({ where: { userId, status: "SENT" } }),
    prisma.invoice.count({ where: { userId, status: "PAID" } }),
    prisma.invoice.count({ where: { userId, status: "OVERDUE" } }),
    prisma.invoice.count({ where: { userId, status: "CANCELLED" } }),
  ]);
  const total = draft + sent + paid + overdue + cancelled;
  const conversionFunnel = [
    { stage: "Dibuat", count: total, pct: 100 },
    { stage: "Terkirim", count: sent + paid + overdue, pct: total ? Math.round(((sent + paid + overdue) / total) * 100) : 0 },
    { stage: "Lunas", count: paid, pct: total ? Math.round((paid / total) * 100) : 0 },
  ];

  // ── Aging report (unpaid invoices past due) ───────────────────────────────
  const unpaidInvoices = await prisma.invoice.findMany({
    where: { userId, status: { in: ["SENT", "OVERDUE"] }, dueDate: { lt: now } },
    select: { dueDate: true, total: true, currency: true },
  });

  const agingBuckets = { "1–30 hr": 0, "31–60 hr": 0, "61–90 hr": 0, ">90 hr": 0 };
  for (const inv of unpaidInvoices) {
    const days = differenceInDays(now, inv.dueDate);
    if (days <= 30) agingBuckets["1–30 hr"] += Number(inv.total);
    else if (days <= 60) agingBuckets["31–60 hr"] += Number(inv.total);
    else if (days <= 90) agingBuckets["61–90 hr"] += Number(inv.total);
    else agingBuckets[">90 hr"] += Number(inv.total);
  }
  const agingReport = Object.entries(agingBuckets).map(([bucket, amount]) => ({ bucket, amount }));

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalRevenue = await prisma.invoice.aggregate({
    where: { userId, status: "PAID" },
    _sum: { total: true },
  });
  const currentMonthRevenue = await prisma.invoice.aggregate({
    where: { userId, status: "PAID", paidAt: { gte: startOfMonth(now) } },
    _sum: { total: true },
  });
  const outstanding = await prisma.invoice.aggregate({
    where: { userId, status: { in: ["SENT", "OVERDUE"] } },
    _sum: { total: true },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { defaultCurrency: true } });

  return NextResponse.json({
    currency: user?.defaultCurrency ?? "IDR",
    summary: {
      totalRevenue: Number(totalRevenue._sum.total ?? 0),
      currentMonthRevenue: Number(currentMonthRevenue._sum.total ?? 0),
      outstanding: Number(outstanding._sum.total ?? 0),
      totalInvoices: total,
      paidInvoices: paid,
      conversionRate: total ? Math.round((paid / total) * 100) : 0,
    },
    revenueByMonth,
    revenueByClient,
    conversionFunnel,
    agingReport,
  });
}
