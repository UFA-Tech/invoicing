import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format, differenceInDays } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMM yy") };
  });

  const revenueByMonthRaw = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const r = await prisma.invoice.aggregate({
        where: { userId, status: "PAID", paidAt: { gte: start, lte: end } },
        _sum: { total: true },
      });
      return { month: label, revenue: Number(r._sum.total ?? 0) };
    })
  );

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

  const unpaidInvoices = await prisma.invoice.findMany({
    where: { userId, status: { in: ["SENT", "OVERDUE"] }, dueDate: { lt: now } },
    select: { dueDate: true, total: true },
  });

  const agingBuckets: Record<string, number> = { "1–30 hr": 0, "31–60 hr": 0, "61–90 hr": 0, ">90 hr": 0 };
  for (const inv of unpaidInvoices) {
    const days = differenceInDays(now, inv.dueDate);
    if (days <= 30) agingBuckets["1–30 hr"] += Number(inv.total);
    else if (days <= 60) agingBuckets["31–60 hr"] += Number(inv.total);
    else if (days <= 90) agingBuckets["61–90 hr"] += Number(inv.total);
    else agingBuckets[">90 hr"] += Number(inv.total);
  }
  const agingReport = Object.entries(agingBuckets).map(([bucket, amount]) => ({ bucket, amount }));

  const [totalRevenueAgg, currentMonthAgg, outstandingAgg, user] = await Promise.all([
    prisma.invoice.aggregate({ where: { userId, status: "PAID" }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { userId, status: "PAID", paidAt: { gte: startOfMonth(now) } }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { userId, status: { in: ["SENT", "OVERDUE"] } }, _sum: { total: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { defaultCurrency: true } }),
  ]);

  const data = {
    currency: user?.defaultCurrency ?? "IDR",
    summary: {
      totalRevenue: Number(totalRevenueAgg._sum.total ?? 0),
      currentMonthRevenue: Number(currentMonthAgg._sum.total ?? 0),
      outstanding: Number(outstandingAgg._sum.total ?? 0),
      totalInvoices: total,
      paidInvoices: paid,
      conversionRate: total ? Math.round((paid / total) * 100) : 0,
    },
    revenueByMonth: revenueByMonthRaw,
    revenueByClient,
    conversionFunnel,
    agingReport,
  };

  return (
    <div>
      <PageHeader
        title="Analitik"
        description="Ringkasan kinerja keuangan dan invoice Anda"
      />
      <AnalyticsCharts data={data} />
    </div>
  );
}
