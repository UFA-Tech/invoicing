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
  FileDown,
  CheckSquare,
  X,
} from "lucide-react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatus } from "@/types/invoice";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
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
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/invoices?${params}`);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((i) => i.id)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus invoice ini?")) return;
    setActionLoading(id + "-delete");
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
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
      if (!res.ok) throw new Error();
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
      if (!res.ok) throw new Error();
      toast.success("Invoice ditandai lunas");
      fetchInvoices();
    } catch {
      toast.error("Gagal memperbarui status");
    } finally {
      setActionLoading(null);
    }
  }

  function exportCsv(ids?: string[]) {
    const params = ids?.length ? `?ids=${ids.join(",")}` : "";
    window.location.href = `/api/invoices/export${params}`;
  }

  async function handleBulkAction(action: "markPaid" | "delete") {
    const ids = Array.from(selectedIds);
    if (action === "delete" && !confirm(`Hapus ${ids.length} invoice?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/invoices/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "markPaid" ? `${ids.length} invoice ditandai lunas` : `${ids.length} invoice dihapus`);
      fetchInvoices();
    } catch {
      toast.error("Gagal memproses bulk action");
    } finally {
      setBulkLoading(false);
    }
  }

  const allSelected = invoices.length > 0 && selectedIds.size === invoices.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      {/* Filters + export */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari klien atau nomor..."
              className="pl-9"
              defaultValue={search}
              onChange={(e) => {
                const val = e.target.value;
                if (searchTimer) clearTimeout(searchTimer);
                searchTimer = setTimeout(() => updateParam("search", val), 400);
              }}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => exportCsv()}>
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParam("status", tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                status === tab.value
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.size} dipilih</span>
          <div className="flex gap-2 ml-auto items-center flex-wrap">
            <Button
              size="sm"
              className="h-7 text-xs bg-slate-700 hover:bg-slate-600 text-white border-0"
              onClick={() => exportCsv(Array.from(selectedIds))}
            >
              <FileDown className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0"
              onClick={() => handleBulkAction("markPaid")}
              disabled={bulkLoading}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Tandai Lunas
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-red-600 hover:bg-red-500 text-white border-0"
              onClick={() => handleBulkAction("delete")}
              disabled={bulkLoading}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Hapus
            </Button>
            <button
              className="ml-1 text-slate-500 hover:text-white transition-colors"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            {search || status ? "Tidak ada invoice yang cocok" : "Belum ada invoice. Buat invoice pertama Anda!"}
          </div>
        ) : (
          invoices.map((invoice) => {
            const checked = selectedIds.has(invoice.id);
            return (
              <div
                key={invoice.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors ${checked ? "border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-700" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleSelect(invoice.id)}
                      className={`flex items-center justify-center w-5 h-5 rounded border transition-colors shrink-0 mt-0.5 ${
                        checked ? "bg-slate-900 border-slate-900" : "border-slate-300"
                      }`}
                      aria-label="Pilih invoice"
                    >
                      {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="min-w-0">
                      <Link href={`/invoices/${invoice.id}`} className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600">
                        #{invoice.invoiceNumber}
                      </Link>
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{invoice.client?.name ?? "—"}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Jatuh tempo: {formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(Number(invoice.total), invoice.currency)}
                      </p>
                      <div className="mt-1">
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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
                        <DropdownMenuItem onClick={() => handleSend(invoice.id)} disabled={actionLoading === invoice.id + "-send"}>
                          {actionLoading === invoice.id + "-send" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Kirim Email
                        </DropdownMenuItem>
                        {invoice.status !== "PAID" && (
                          <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)} disabled={actionLoading === invoice.id + "-paid"}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tandai Lunas
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => handleDelete(invoice.id)} disabled={actionLoading === invoice.id + "-delete"}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/60">
              <TableHead className="w-10">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center w-5 h-5 rounded border border-slate-300 hover:border-slate-500 transition-colors"
                  aria-label="Pilih semua"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-slate-700" />
                  ) : someSelected ? (
                    <div className="w-2.5 h-0.5 bg-slate-500 rounded" />
                  ) : null}
                </button>
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">No. Invoice</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Klien</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tanggal</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jatuh Tempo</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-right">Total</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                  {search || status ? "Tidak ada invoice yang cocok" : "Belum ada invoice. Buat invoice pertama Anda!"}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const checked = selectedIds.has(invoice.id);
                return (
                  <TableRow
                    key={invoice.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${checked ? "bg-slate-50 dark:bg-slate-700/50" : ""}`}
                  >
                    <TableCell className="w-10">
                      <button
                        onClick={() => toggleSelect(invoice.id)}
                        className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                          checked ? "bg-slate-900 border-slate-900" : "border-slate-300 hover:border-slate-500"
                        }`}
                        aria-label="Pilih invoice"
                      >
                        {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="hover:text-blue-600">
                        #{invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{invoice.client?.name ?? "—"}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{invoice.client?.email ?? ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(Number(invoice.total), invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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
                          <DropdownMenuItem onClick={() => handleSend(invoice.id)} disabled={actionLoading === invoice.id + "-send"}>
                            {actionLoading === invoice.id + "-send" ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            Kirim Email
                          </DropdownMenuItem>
                          {invoice.status !== "PAID" && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)} disabled={actionLoading === invoice.id + "-paid"}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Tandai Lunas
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(invoice.id)} disabled={actionLoading === invoice.id + "-delete"}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{pagination.total} invoice total</p>
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
