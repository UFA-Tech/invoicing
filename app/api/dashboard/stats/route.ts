import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "month";

    const now = new Date();
    let startDate: Date;

    if (period === "last_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (period === "3months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const userId = session.user.id;

    const [totalInvoices, sentInvoices, paidInvoices, overdueInvoices, revenueResult, recentInvoices] =
      await Promise.all([
        prisma.invoice.count({ where: { userId, createdAt: { gte: startDate } } }),
        prisma.invoice.count({ where: { userId, status: "SENT", createdAt: { gte: startDate } } }),
        prisma.invoice.count({ where: { userId, status: "PAID", createdAt: { gte: startDate } } }),
        prisma.invoice.count({
          where: {
            userId,
            status: { in: ["SENT", "OVERDUE"] },
            dueDate: { lt: now },
          },
        }),
        prisma.invoice.aggregate({
          where: { userId, status: "PAID", paidAt: { gte: startDate } },
          _sum: { total: true },
        }),
        prisma.invoice.findMany({
          where: { userId },
          include: { client: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      totalInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue: Number(revenueResult._sum.total ?? 0),
      recentInvoices,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
