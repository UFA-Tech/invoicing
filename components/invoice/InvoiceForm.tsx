"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InvoiceLineItems } from "./InvoiceLineItems";
import { InvoicePreview } from "./InvoicePreview";
import { BusinessProfile, InvoiceFormData, InvoiceWithRelations } from "@/types/invoice";
import { cn, formatCurrency } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";
import { TEMPLATE_META } from "@/components/invoice/templates";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Nomor invoice wajib diisi"),
  status: z.nativeEnum(InvoiceStatus),
  issueDate: z.date({ error: "Tanggal wajib diisi" }),
  dueDate: z.date({ error: "Jatuh tempo wajib diisi" }),
  currency: z.string(),
  client: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama klien wajib diisi"),
    email: z.string().email("Email tidak valid"),
    phone: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Deskripsi wajib diisi"),
        quantity: z.number().positive("Harus lebih dari 0"),
        unitPrice: z.number().positive("Harus lebih dari 0"),
        amount: z.number(),
        unit: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 item"),
  subtotal: z.number(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number(),
  discount: z.number().min(0),
  total: z.number(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  template: z.string(),
});

interface InvoiceFormProps {
  business: BusinessProfile;
  invoiceToEdit?: InvoiceWithRelations;
  nextInvoiceNumber?: string;
}

export function InvoiceForm({ business, invoiceToEdit, nextInvoiceNumber }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoiceToEdit
      ? {
          invoiceNumber: invoiceToEdit.invoiceNumber,
          status: invoiceToEdit.status,
          issueDate: new Date(invoiceToEdit.issueDate),
          dueDate: new Date(invoiceToEdit.dueDate),
          currency: invoiceToEdit.currency,
          client: {
            id: invoiceToEdit.client?.id,
            name: invoiceToEdit.client?.name ?? "",
            email: invoiceToEdit.client?.email ?? "",
            phone: invoiceToEdit.client?.phone ?? "",
            address: invoiceToEdit.client?.address ?? "",
            company: invoiceToEdit.client?.company ?? "",
          },
          items: invoiceToEdit.items.map((i) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            amount: Number(i.amount),
            unit: i.unit ?? "",
          })),
          subtotal: Number(invoiceToEdit.subtotal),
          taxRate: Number(invoiceToEdit.taxRate),
          taxAmount: Number(invoiceToEdit.taxAmount),
          discount: Number(invoiceToEdit.discount),
          total: Number(invoiceToEdit.total),
          notes: invoiceToEdit.notes ?? "",
          terms: invoiceToEdit.terms ?? "",
          template: invoiceToEdit.template ?? business.defaultTemplate ?? "classic",
        }
      : {
          invoiceNumber: nextInvoiceNumber ?? "",
          status: InvoiceStatus.DRAFT,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          currency: business.defaultCurrency ?? "IDR",
          client: { name: "", email: "", phone: "", address: "", company: "" },
          items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0, unit: "" }],
          subtotal: 0,
          taxRate: 0,
          taxAmount: 0,
          discount: 0,
          total: 0,
          notes: "",
          terms: business.defaultTerms ?? "",
          template: business.defaultTemplate ?? "classic",
        },
  });

  const watchedValues = form.watch();

  function recalculate() {
    const items = form.getValues("items");
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxRate = form.getValues("taxRate") || 0;
    const discount = form.getValues("discount") || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;
    form.setValue("subtotal", subtotal);
    form.setValue("taxAmount", taxAmount);
    form.setValue("total", total);
  }

  async function onSubmit(values: InvoiceFormData) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };

      const res = invoiceToEdit
        ? await fetch(`/api/invoices/${invoiceToEdit.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal menyimpan");
      }

      const saved = await res.json();
      toast.success(invoiceToEdit ? "Invoice berhasil diperbarui" : "Invoice berhasil dibuat");
      router.push(`/invoices/${saved.id}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Form Panel */}
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Invoice *</FormLabel>
                        <FormControl>
                          <Input {...field} className="font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="SENT">Terkirim</SelectItem>
                            <SelectItem value="PAID">Lunas</SelectItem>
                            <SelectItem value="OVERDUE">Jatuh Tempo</SelectItem>
                            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal *</FormLabel>
                        <Popover>
                          <PopoverTrigger
                            className={cn(
                              "flex h-8 w-full items-center justify-start rounded-lg border border-border bg-background px-2.5 text-sm font-normal text-left",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            {field.value
                              ? format(field.value, "dd/MM/yyyy")
                              : "Pilih tanggal"}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={localeId}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jatuh Tempo *</FormLabel>
                        <Popover>
                          <PopoverTrigger
                            className={cn(
                              "flex h-8 w-full items-center justify-start rounded-lg border border-border bg-background px-2.5 text-sm font-normal text-left",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            {field.value
                              ? format(field.value, "dd/MM/yyyy")
                              : "Pilih tanggal"}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={localeId}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata Uang</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IDR">IDR – Rupiah</SelectItem>
                          <SelectItem value="USD">USD – Dollar AS</SelectItem>
                          <SelectItem value="EUR">EUR – Euro</SelectItem>
                          <SelectItem value="SGD">SGD – Dollar Singapura</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Klien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Klien *</FormLabel>
                        <FormControl>
                          <Input placeholder="Budi Santoso" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="client.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="budi@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client.company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perusahaan</FormLabel>
                        <FormControl>
                          <Input placeholder="PT. Maju Jaya" {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="client.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon</FormLabel>
                        <FormControl>
                          <Input placeholder="+62 812 3456 7890" {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="client.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Jl. Contoh No. 123, Jakarta" rows={2} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Item Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <InvoiceLineItems
                  form={form as never}
                  currency={watchedValues.currency ?? "IDR"}
                />
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pajak (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number(e.target.value));
                              recalculate();
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diskon (nominal)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number(e.target.value));
                              recalculate();
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(watchedValues.subtotal || 0, watchedValues.currency)}</span>
                  </div>
                  {Number(watchedValues.taxRate) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Pajak ({watchedValues.taxRate}%)</span>
                      <span className="font-mono">{formatCurrency(watchedValues.taxAmount || 0, watchedValues.currency)}</span>
                    </div>
                  )}
                  {Number(watchedValues.discount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Diskon</span>
                      <span className="font-mono text-red-500">-{formatCurrency(watchedValues.discount || 0, watchedValues.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span className="font-mono">{formatCurrency(watchedValues.total || 0, watchedValues.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Catatan tambahan untuk klien..." rows={3} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Syarat Pembayaran</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Syarat dan ketentuan pembayaran..." rows={3} {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {invoiceToEdit ? "Simpan Perubahan" : "Buat Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Preview Panel */}
      <div className="hidden xl:block">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Preview Invoice
            </p>
            <div className="flex gap-1">
              {TEMPLATE_META.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => form.setValue("template", tpl.key)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    watchedValues.template === tpl.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
          <InvoicePreview data={watchedValues} business={business} template={watchedValues.template} />
        </div>
      </div>
    </div>
  );
}
