"use client";

import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { InvoiceFormData } from "@/types/invoice";

interface InvoiceLineItemsProps {
  form: UseFormReturn<InvoiceFormData>;
  currency: string;
}

export function InvoiceLineItems({ form, currency }: InvoiceLineItemsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function handleQtyOrPriceChange(index: number) {
    const qty = Number(form.getValues(`items.${index}.quantity`) || 0);
    const price = Number(form.getValues(`items.${index}.unitPrice`) || 0);
    const amount = qty * price;
    form.setValue(`items.${index}.amount`, amount);

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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide pb-1 border-b">
        <div className="col-span-4">Deskripsi</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-center">Satuan</div>
        <div className="col-span-2 text-right">Harga</div>
        <div className="col-span-1 text-right">Total</div>
        <div className="col-span-1" />
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
          <div className="col-span-4">
            <FormField
              control={form.control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Nama produk/jasa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-2">
            <FormField
              control={form.control}
              name={`items.${index}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="text-center"
                      {...field}
                      onChange={(e) => {
                        field.onChange(Number(e.target.value));
                        handleQtyOrPriceChange(index);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-2">
            <FormField
              control={form.control}
              name={`items.${index}.unit`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="pcs"
                      className="text-center"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-2">
            <FormField
              control={form.control}
              name={`items.${index}.unitPrice`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      className="text-right"
                      {...field}
                      onChange={(e) => {
                        field.onChange(Number(e.target.value));
                        handleQtyOrPriceChange(index);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-1 flex items-center justify-end h-10">
            <span className="text-xs font-mono text-slate-600">
              {formatCurrency(
                form.watch(`items.${index}.amount`) || 0,
                currency
              )}
            </span>
          </div>
          <div className="col-span-1 flex items-center justify-center h-10">
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                onClick={() => {
                  remove(index);
                  setTimeout(() => handleQtyOrPriceChange(0), 0);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() =>
          append({
            description: "",
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            unit: "",
          })
        }
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah Item
      </Button>
    </div>
  );
}
