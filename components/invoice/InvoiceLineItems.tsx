"use client";

import { useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Plus, BookOpen, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { InvoiceFormData, CatalogItemType } from "@/types/invoice";

interface InvoiceLineItemsProps {
  form: UseFormReturn<InvoiceFormData>;
  currency: string;
  catalogItems?: CatalogItemType[];
}

export function InvoiceLineItems({ form, currency, catalogItems = [] }: InvoiceLineItemsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const [catalogQuery, setCatalogQuery] = useState("");
  const [openCatalogIndex, setOpenCatalogIndex] = useState<number | null>(null);

  function handleQtyOrPriceChange(index: number) {
    const qty = Number(form.getValues(`items.${index}.quantity`) || 0);
    const price = Number(form.getValues(`items.${index}.unitPrice`) || 0);
    const amount = qty * price;
    form.setValue(`items.${index}.amount`, amount, { shouldDirty: true });

    const items = form.getValues("items");
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxRate = form.getValues("taxRate") || 0;
    const discount = form.getValues("discount") || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;
    form.setValue("subtotal", subtotal, { shouldDirty: true });
    form.setValue("taxAmount", taxAmount, { shouldDirty: true });
    form.setValue("total", total, { shouldDirty: true });
  }

  function applyCatalogItem(index: number, item: CatalogItemType) {
    const qty = Number(form.getValues(`items.${index}.quantity`)) || 1;
    const amount = qty * item.unitPrice;

    // Use setValue per-field so each FormField subscription (including description) is notified
    form.setValue(`items.${index}.description`, item.description || item.name, { shouldDirty: true });
    form.setValue(`items.${index}.unitPrice`, item.unitPrice, { shouldDirty: true });
    form.setValue(`items.${index}.unit`, item.unit ?? "", { shouldDirty: true });
    form.setValue(`items.${index}.amount`, amount, { shouldDirty: true });

    // Recalculate totals using known new amount for this index
    const allItems = form.getValues("items");
    const subtotal = allItems.reduce(
      (s, it, i) => s + (i === index ? amount : it.amount || 0),
      0
    );
    const taxRate = form.getValues("taxRate") || 0;
    const discount = form.getValues("discount") || 0;
    form.setValue("subtotal", subtotal, { shouldDirty: true });
    form.setValue("taxAmount", subtotal * (taxRate / 100), { shouldDirty: true });
    form.setValue("total", subtotal + subtotal * (taxRate / 100) - discount, { shouldDirty: true });

    setOpenCatalogIndex(null);
    setCatalogQuery("");
  }

  const filteredCatalog = catalogItems.filter((item) =>
    item.name.toLowerCase().includes(catalogQuery.toLowerCase()) ||
    (item.description ?? "").toLowerCase().includes(catalogQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3"
        >
          {/* Row 1: Description + delete */}
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">
                  Item {index + 1}
                </p>
                {catalogItems.length > 0 && (
                  <Popover
                    open={openCatalogIndex === index}
                    onOpenChange={(open) => {
                      setOpenCatalogIndex(open ? index : null);
                      if (!open) setCatalogQuery("");
                    }}
                  >
                    <PopoverTrigger className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      <BookOpen className="w-3 h-3" />
                      Pilih dari katalog
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" align="end">
                      <div className="flex items-center gap-1.5 mb-2 px-1 border rounded-md">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          className="flex-1 text-sm py-1.5 outline-none bg-transparent placeholder:text-slate-400"
                          placeholder="Cari item katalog..."
                          value={catalogQuery}
                          onChange={(e) => setCatalogQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {filteredCatalog.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-3">Tidak ada item</p>
                        ) : (
                          filteredCatalog.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => applyCatalogItem(index, item)}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                            >
                              <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                              <p className="text-xs text-slate-500">
                                {formatCurrency(item.unitPrice, "IDR")}
                                {item.unit && <span className="ml-1">/ {item.unit}</span>}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Nama produk atau jasa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 shrink-0 mt-5"
                onClick={() => {
                  remove(index);
                  setTimeout(() => handleQtyOrPriceChange(0), 0);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Row 2: Qty | Satuan | Harga/Unit | Total */}
          <div className="flex items-end gap-3">
            <div className="w-20 shrink-0">
              <p className="text-xs font-medium text-slate-500 mb-1">Qty</p>
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

            <div className="w-28 shrink-0">
              <p className="text-xs font-medium text-slate-500 mb-1">Satuan</p>
              <FormField
                control={form.control}
                name={`items.${index}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="pcs, kg, jam..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 mb-1">Harga / Unit</p>
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

            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-slate-500 mb-1">Total</p>
              <div className="h-8 flex items-center justify-end">
                <span className="text-sm font-mono font-semibold text-slate-800">
                  {formatCurrency(form.watch(`items.${index}.amount`) || 0, currency)}
                </span>
              </div>
            </div>
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
