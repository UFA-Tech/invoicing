"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, MessageCircle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceShareButtonsProps {
  invoiceId: string;
  existingToken?: string | null;
}

export function InvoiceShareButtons({ invoiceId, existingToken }: InvoiceShareButtonsProps) {
  const [token, setToken] = useState<string | null>(existingToken ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function getOrCreateToken(): Promise<string | null> {
    if (token) return token;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal membuat link");
      const data = await res.json();
      setToken(data.token);
      return data.token;
    } catch {
      toast.error("Gagal membuat link publik");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    const t = await getOrCreateToken();
    if (!t) return;
    const url = `${window.location.origin}/invoice/${t}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleWhatsApp() {
    const t = await getOrCreateToken();
    if (!t) return;
    const url = `${window.location.origin}/invoice/${t}`;
    const text = encodeURIComponent(`Halo, berikut link invoice Anda: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        disabled={loading}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : copied ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
        {copied ? "Disalin!" : "Salin Link"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsApp}
        disabled={loading}
        className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>
    </div>
  );
}
