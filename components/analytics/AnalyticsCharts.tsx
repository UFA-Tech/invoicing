"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, ArrowRight, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  currency: string;
  summary: {
    totalRevenue: number;
    currentMonthRevenue: number;
    outstanding: number;
    totalInvoices: number;
    paidInvoices: number;
    conversionRate: number;
  };
  revenueByMonth: { month: string; revenue: number }[];
  revenueByClient: { name: string; revenue: number }[];
  conversionFunnel: { stage: string; count: number; pct: number }[];
  agingReport: { bucket: string; amount: number }[];
}

function makeCurrencyTooltip(currency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow text-xs">
        <p className="text-slate-500 mb-1">{label}</p>
        <p className="font-semibold text-slate-800">{formatCurrency(payload[0].value, currency)}</p>
      </div>
    );
  };
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const { currency, summary, revenueByMonth, revenueByClient, conversionFunnel, agingReport } = data;
  const CurrencyTooltip = makeCurrencyTooltip(currency);

  const summaryCards = [
    { label: "Total Pendapatan", value: formatCurrency(summary.totalRevenue, currency), sub: "Sepanjang waktu" },
    { label: "Pendapatan Bulan Ini", value: formatCurrency(summary.currentMonthRevenue, currency), sub: "Bulan berjalan" },
    { label: "Belum Dibayar", value: formatCurrency(summary.outstanding, currency), sub: "Invoice aktif" },
    { label: "Conversion Rate", value: `${summary.conversionRate}%`, sub: `${summary.paidInvoices} dari ${summary.totalInvoices} lunas` },
  ];

  const maxClient = Math.max(...revenueByClient.map((c) => c.revenue), 1);
  const maxAging = Math.max(...agingReport.map((a) => a.amount), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 mb-1">{card.label}</p>
              <p className="text-xl font-bold text-slate-900 truncate">{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue per month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Pendapatan per Bulan (12 Bulan Terakhir)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByMonth} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}jt` : v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue per client */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Pendapatan per Klien (Top 8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByClient.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Belum ada data pendapatan</p>
            ) : (
              <div className="space-y-3">
                {revenueByClient.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium truncate max-w-[55%]">{item.name}</span>
                      <span className="text-slate-500 font-mono">{formatCurrency(item.revenue, currency)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.round((item.revenue / maxClient) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-violet-500" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {conversionFunnel.map((stage, i) => (
                <div key={stage.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{stage.stage}</span>
                    <span className="text-slate-500">{stage.count} invoice <span className="text-slate-400">({stage.pct}%)</span></span>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-md overflow-hidden">
                    <div
                      className={`h-full rounded-md transition-all ${i === 0 ? "bg-slate-400" : i === 1 ? "bg-blue-500" : "bg-emerald-500"}`}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Dari total invoice yang dibuat, {summary.conversionRate}% berhasil lunas.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging report */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Aging Report — Invoice Belum Dibayar (Lewat Jatuh Tempo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agingReport.every((a) => a.amount === 0) ? (
            <p className="text-xs text-emerald-600 py-6 text-center font-medium">Tidak ada invoice yang melewati jatuh tempo</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {agingReport.map((item) => (
                <div key={item.bucket} className="text-center">
                  <div
                    className="h-24 bg-slate-100 rounded-xl flex items-end justify-center overflow-hidden mb-2"
                  >
                    <div
                      className="w-full bg-amber-400 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(4, Math.round((item.amount / maxAging) * 96))}px` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{item.bucket}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{formatCurrency(item.amount, currency)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
