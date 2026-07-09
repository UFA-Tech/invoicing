import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mirrors formatCurrencyPdf() in InvoicePDFTemplate.tsx — IDR is
// conventionally shown with no decimals, but other supported currencies
// (USD, EUR, SGD) need their minor units preserved. Keeping these two
// formatters in sync avoids the in-app UI showing a different amount than
// the PDF actually sent to the client.
export function formatCurrency(amount: number, currency = "IDR"): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: localeId });
}

export function formatDateLong(date: Date | string): string {
  return format(new Date(date), "dd MMMM yyyy", { locale: localeId });
}

export function generateInvoiceNumber(prefix: string, sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(3, "0");
  return `${prefix}${year}-${month}-${seq}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Server-authoritative totals calculation. Given raw line items, a tax rate
 * (%) and a discount amount, derives each item's amount plus subtotal/tax/
 * total. Callers (API routes) should use this instead of trusting
 * client-submitted subtotal/taxAmount/total/item.amount values, since those
 * can drift from the actual line items due to stale form state or bugs.
 */
export function calculateInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRate: number,
  discount: number
) {
  const itemAmounts = items.map((item) => round2(item.quantity * item.unitPrice));
  const subtotal = round2(itemAmounts.reduce((sum, amount) => sum + amount, 0));
  const taxAmount = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + taxAmount - discount);
  return { itemAmounts, subtotal, taxAmount, total };
}

export function isOverdue(dueDate: Date | string | null | undefined, status: string): boolean {
  if (!dueDate) return false;
  if (status === "PAID" || status === "CANCELLED") return false;
  return new Date(dueDate) < new Date();
}

