import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, format, differenceInDays } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

type SummaryRow = {
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  total_revenue: unknown;
  current_month_revenue: unknown;
  outstanding: unknown;
};

type MonthRow = { month: Date; revenue: unknown };
type ClientRow = { name: string; revenue: unknown };
type AgingRow = { dueDate: Date; total: unknown };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const startOf12Months = startOfMonth(subMonths(now, 11));
  const startOfCurrentMonth = startOfMonth(now);

  const [summaryRows, monthRows, clientRows, agingRows, user] = await Promise.all([
    prisma.$queryRaw<SummaryRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'DRAFT')::int                          AS draft,
        COUNT(*) FILTER (WHERE status = 'SENT')::int                           AS sent,
        COUNT(*) FILTER (WHERE status = 'PAID')::int                           AS paid,
        COUNT(*) FILTER (WHERE status = 'OVERDUE')::int                        AS overdue,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int                      AS cancelled,
        COALESCE(SUM(total) FILTER (WHERE status = 'PAID'), 0)                 AS total_revenue,
        COALESCE(SUM(total) FILTER (WHERE status = 'PAID'
          AND "paidAt" >= ${startOfCurrentMonth}), 0)                          AS current_month_revenue,
        COALESCE(SUM(total) FILTER (WHERE status IN ('SENT', 'OVERDUE')), 0)   AS outstanding
      FROM "Invoice"
      WHERE "userId" = ${userId}
    `,
    prisma.$queryRaw<MonthRow[]>`
      SELECT
        DATE_TRUNC('month', "paidAt") AS month,
        COALESCE(SUM(total), 0)       AS revenue
      FROM "Invoice"
      WHERE "userId" = ${userId}
        AND status = 'PAID'
        AND "paidAt" >= ${startOf12Months}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<ClientRow[]>`
      SELECT
        COALESCE(c.name, 'Tanpa Klien') AS name,
        SUM(i.total)                    AS revenue
      FROM "Invoice" i
      LEFT JOIN "Client" c ON i."clientId" = c.id
      WHERE i."userId" = ${userId} AND i.status = 'PAID'
      GROUP BY c.name
      ORDER BY revenue DESC
      LIMIT 8
    `,
    prisma.$queryRaw<AgingRow[]>`
      SELECT "dueDate", total
      FROM "Invoice"
      WHERE "userId" = ${userId}
        AND status IN ('SENT', 'OVERDUE')
        AND "dueDate" < NOW()
    `,
    prisma.user.findUnique({ where: { id: userId }, select: { defaultCurrency: true } }),
  ]);

  const s = summaryRows[0] ?? {
    draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0,
    total_revenue: 0, current_month_revenue: 0, outstanding: 0,
  };

  const total = s.draft + s.sent + s.paid + s.overdue + s.cancelled;

  // Build 12-month revenue array, filling gaps with 0
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return { start: startOfMonth(d), label: format(d, "MMM yy") };
  });
  const monthRevMap = new Map(
    monthRows.map((r) => [format(new Date(r.month), "MMM yy"), Number(r.revenue)])
  );
  const revenueByMonth = months.map(({ label }) => ({
    month: label,
    revenue: monthRevMap.get(label) ?? 0,
  }));

  const revenueByClient = clientRows.map((r) => ({ name: r.name, revenue: Number(r.revenue) }));

  const conversionFunnel = [
    { stage: "Dibuat", count: total, pct: 100 },
    {
      stage: "Terkirim",
      count: s.sent + s.paid + s.overdue,
      pct: total ? Math.round(((s.sent + s.paid + s.overdue) / total) * 100) : 0,
    },
    { stage: "Lunas", count: s.paid, pct: total ? Math.round((s.paid / total) * 100) : 0 },
  ];

  const agingBuckets: Record<string, number> = { "1–30 hr": 0, "31–60 hr": 0, "61–90 hr": 0, ">90 hr": 0 };
  for (const row of agingRows) {
    const days = differenceInDays(now, new Date(row.dueDate));
    const amount = Number(row.total);
    if (days <= 30) agingBuckets["1–30 hr"] += amount;
    else if (days <= 60) agingBuckets["31–60 hr"] += amount;
    else if (days <= 90) agingBuckets["61–90 hr"] += amount;
    else agingBuckets[">90 hr"] += amount;
  }
  const agingReport = Object.entries(agingBuckets).map(([bucket, amount]) => ({ bucket, amount }));

  const data = {
    currency: user?.defaultCurrency ?? "IDR",
    summary: {
      totalRevenue: Number(s.total_revenue),
      currentMonthRevenue: Number(s.current_month_revenue),
      outstanding: Number(s.outstanding),
      totalInvoices: total,
      paidInvoices: s.paid,
      conversionRate: total ? Math.round((s.paid / total) * 100) : 0,
    },
    revenueByMonth,
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
