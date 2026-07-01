import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Send,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalInvoices,
    sentInvoices,
    paidInvoices,
    overdueInvoices,
    revenueResult,
    recentInvoices,
    user,
  ] = await Promise.all([
    prisma.invoice.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.invoice.count({ where: { userId, status: "SENT" } }),
    prisma.invoice.count({ where: { userId, status: "PAID", createdAt: { gte: startOfMonth } } }),
    prisma.invoice.count({
      where: {
        userId,
        status: { in: ["SENT", "OVERDUE"] },
        dueDate: { lt: now },
      },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: "PAID", paidAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.invoice.findMany({
      where: { userId },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, defaultCurrency: true },
    }),
  ]);

  const currency = user?.defaultCurrency ?? "IDR";
  const totalRevenue = Number(revenueResult._sum.total ?? 0);

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${session.user.name?.split(" ")[0] ?? "Pengguna"}`}
        description="Ringkasan aktivitas invoice bulan ini"
      >
        <Link href="/invoices/new" className={cn(buttonVariants())}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Invoice
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Invoice"
          value={String(totalInvoices)}
          subtitle="Bulan ini"
          icon={FileText}
          iconClassName="bg-slate-100 text-slate-600"
        />
        <StatsCard
          title="Invoice Terkirim"
          value={String(sentInvoices)}
          subtitle="Menunggu pembayaran"
          icon={Send}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Invoice Lunas"
          value={String(paidInvoices)}
          subtitle="Bulan ini"
          icon={CheckCircle}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
        <StatsCard
          title="Total Pendapatan"
          value={formatCurrency(totalRevenue, currency)}
          subtitle="Bulan ini"
          icon={DollarSign}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
      </div>

      {overdueInvoices > 0 && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {overdueInvoices} invoice melewati jatuh tempo
            </p>
            <p className="text-xs text-red-500 dark:text-red-500">
              Segera hubungi klien untuk pembayaran
            </p>
          </div>
          <Link
            href="/invoices?status=OVERDUE"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-red-200 text-red-600 hover:bg-red-50")}
          >
            Lihat
          </Link>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Invoice Terbaru</CardTitle>
          <Link
            href="/invoices"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-slate-500")}
          >
            Lihat semua
          </Link>
        </CardHeader>
        <CardContent>
          <RecentInvoices
            invoices={recentInvoices.map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              status: inv.status,
              total: Number(inv.total),
              currency: inv.currency,
              dueDate: inv.dueDate.toISOString(),
              client: inv.client ? { name: inv.client.name } : null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
