"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Pencil,
  Trash2,
  Download,
  Send,
  MoreHorizontal,
  Search,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "Semua", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Terkirim", value: "SENT" },
  { label: "Lunas", value: "PAID" },
  { label: "Jatuh Tempo", value: "OVERDUE" },
  { label: "Dibatalkan", value: "CANCELLED" },
];

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  total: number;
  currency: string;
  client: { name: string; email: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;

export function InvoiceList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      params.set("page", String(page));
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`/invoices?${params}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus invoice ini?")) return;
    setActionLoading(id + "-delete");
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Invoice dihapus");
      fetchInvoices();
    } catch {
      toast.error("Gagal menghapus invoice");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSend(id: string) {
    setActionLoading(id + "-send");
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal mengirim");
      toast.success("Invoice berhasil dikirim ke email klien");
      fetchInvoices();
    } catch {
      toast.error("Gagal mengirim invoice");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkPaid(id: string) {
    setActionLoading(id + "-paid");
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui");
      toast.success("Invoice ditandai lunas");
      fetchInvoices();
    } catch {
      toast.error("Gagal memperbarui status");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cari klien atau nomor invoice..."
            className="pl-9"
            defaultValue={search}
            onChange={(e) => {
              const val = e.target.value;
              if (searchTimer) clearTimeout(searchTimer);
              searchTimer = setTimeout(() => updateParam("search", val), 400);
            }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParam("status", tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === tab.value
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500">No. Invoice</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Klien</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Tanggal</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Jatuh Tempo</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-right">Total</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-slate-400 text-sm"
                >
                  {search || status
                    ? "Tidak ada invoice yang cocok"
                    : "Belum ada invoice. Buat invoice pertama Anda!"}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm font-medium">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="hover:text-blue-600"
                    >
                      #{invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {invoice.client?.name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {invoice.client?.email ?? ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDate(invoice.issueDate)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDate(invoice.dueDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = `/api/invoices/${invoice.id}/pdf`;
                            a.download = `${invoice.invoiceNumber}.pdf`;
                            a.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSend(invoice.id)}
                          disabled={actionLoading === invoice.id + "-send"}
                        >
                          {actionLoading === invoice.id + "-send" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Kirim Email
                        </DropdownMenuItem>
                        {invoice.status !== "PAID" && (
                          <DropdownMenuItem
                            onClick={() => handleMarkPaid(invoice.id)}
                            disabled={actionLoading === invoice.id + "-paid"}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tandai Lunas
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(invoice.id)}
                          disabled={actionLoading === invoice.id + "-delete"}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {pagination.total} invoice total
          </p>
          <div className="flex gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateParam("page", String(p))}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
