"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { InvoiceStatus } from "@/types/invoice";

interface InvoiceDetailActionsProps {
  invoiceId: string;
  status: InvoiceStatus;
}

export function InvoiceDetailActions({ invoiceId, status }: InvoiceDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSend() {
    setLoading("send");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal mengirim");
      }
      toast.success("Invoice berhasil dikirim ke email klien");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function handleMarkPaid() {
    setLoading("paid");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui");
      toast.success("Invoice ditandai lunas");
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui status");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus invoice ini?")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Invoice dihapus");
      router.push("/invoices");
    } catch {
      toast.error("Gagal menghapus invoice");
      setLoading(null);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSend}
        disabled={loading === "send"}
      >
        {loading === "send" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        Kirim Email
      </Button>

      {status !== "PAID" && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkPaid}
          disabled={loading === "paid"}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          {loading === "paid" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Tandai Lunas
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={loading === "delete"}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        {loading === "delete" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 mr-2" />
        )}
        Hapus
      </Button>
    </>
  );
}
