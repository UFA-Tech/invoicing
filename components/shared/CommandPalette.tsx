"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FileText,
  Users,
  LayoutDashboard,
  BarChart2,
  Package,
  Settings,
  Plus,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";

interface SearchResult {
  invoices: {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    total: number;
    currency: string;
    clientName: string | null;
  }[];
  clients: {
    id: string;
    name: string;
    email: string;
    company: string | null;
  }[];
}

const quickActions = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Semua Invoice", href: "/invoices", icon: FileText },
  { label: "Buat Invoice Baru", href: "/invoices/new", icon: Plus },
  { label: "Klien", href: "/clients", icon: Users },
  { label: "Analitik", href: "/analytics", icon: BarChart2 },
  { label: "Katalog", href: "/catalog", icon: Package },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  // Fetch search results debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  const hasResults =
    results && (results.invoices.length > 0 || results.clients.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Pencarian" description="Cari invoice atau klien">
      <Command>
      <CommandInput
        placeholder="Cari invoice, klien..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim() ? (
          <>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">Mencari...</div>
            )}
            {!loading && !hasResults && (
              <CommandEmpty>Tidak ada hasil untuk &quot;{query}&quot;</CommandEmpty>
            )}
            {!loading && results && results.invoices.length > 0 && (
              <CommandGroup heading="Invoice">
                {results.invoices.map((inv) => (
                  <CommandItem
                    key={inv.id}
                    value={`invoice-${inv.id}`}
                    onSelect={() => navigate(`/invoices/${inv.id}`)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{inv.invoiceNumber}</span>
                      {inv.clientName && (
                        <span className="text-muted-foreground ml-2 text-xs">{inv.clientName}</span>
                      )}
                    </div>
                    <InvoiceStatusBadge status={inv.status} />
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {formatCurrency(inv.total, inv.currency)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!loading && results && results.invoices.length > 0 && results.clients.length > 0 && (
              <CommandSeparator />
            )}
            {!loading && results && results.clients.length > 0 && (
              <CommandGroup heading="Klien">
                {results.clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`client-${client.id}`}
                    onSelect={() => navigate(`/clients`)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{client.name}</span>
                      {client.company && (
                        <span className="text-muted-foreground ml-2 text-xs">{client.company}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{client.email}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        ) : (
          <CommandGroup heading="Navigasi Cepat">
            {quickActions.map(({ label, href, icon: Icon }) => (
              <CommandItem
                key={href}
                value={label}
                onSelect={() => navigate(href)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
