import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { InvoiceList } from "@/components/invoice/InvoiceList";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader
        title="Invoice"
        description="Kelola semua invoice Anda di sini"
      >
        <Link href="/invoices/new" className={cn(buttonVariants())}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Invoice
        </Link>
      </PageHeader>

      <Suspense>
        <InvoiceList />
      </Suspense>
    </div>
  );
}
