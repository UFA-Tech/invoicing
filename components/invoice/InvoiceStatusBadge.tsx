import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@/types/invoice";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  },
  SENT: {
    label: "Terkirim",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  PAID: {
    label: "Lunas",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  OVERDUE: {
    label: "Jatuh Tempo",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge className={cn(config.className, className)} variant="secondary">
      {config.label}
    </Badge>
  );
}
