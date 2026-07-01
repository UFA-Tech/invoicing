"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Pencil, Trash2, Package, X, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CatalogItemType } from "@/types/invoice";

const catalogSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  unitPrice: z.number({ error: "Harga harus berupa angka" }).min(0),
  unit: z.string().optional(),
});

type CatalogFormData = z.infer<typeof catalogSchema>;

interface CatalogManagerProps {
  initialItems: CatalogItemType[];
  pagination: { page: number; pages: number; total: number };
}

export function CatalogManager({ initialItems, pagination }: CatalogManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItemType[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(catalogSchema),
    defaultValues: { name: "", description: "", unitPrice: 0, unit: "" },
  });

  function openAdd() {
    form.reset({ name: "", description: "", unitPrice: 0, unit: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: CatalogItemType) {
    form.reset({
      name: item.name,
      description: item.description ?? "",
      unitPrice: item.unitPrice,
      unit: item.unit ?? "",
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function onSubmit(data: CatalogFormData) {
    try {
      if (editingId) {
        const res = await fetch(`/api/catalog/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        toast.success("Item berhasil diperbarui");
      } else {
        const res = await fetch("/api/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setItems((prev) => [created, ...prev]);
        toast.success("Item berhasil ditambahkan");
      }
      closeForm();
    } catch {
      toast.error("Gagal menyimpan item");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/catalog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item dihapus");
    } catch {
      toast.error("Gagal menghapus item");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5" size="sm">
          <Plus className="w-4 h-4" />
          Tambah Item
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {editingId ? "Edit Item" : "Tambah Item Baru"}
              </CardTitle>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Item</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Desain Logo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi (opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Deskripsi singkat" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Satuan (IDR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satuan (opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="pcs, jam, halaman..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={closeForm}>
                    Batal
                  </Button>
                  <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                    <Check className="w-4 h-4 mr-1" />
                    Simpan
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <Package className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada item katalog</p>
          <p className="text-xs mt-1">Tambahkan produk atau jasa yang sering Anda gunakan</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="relative group">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                    )}
                    <p className="text-sm font-mono font-medium text-slate-700 mt-2">
                      {formatCurrency(item.unitPrice, "IDR")}
                      {item.unit && (
                        <span className="text-xs text-slate-400 font-sans ml-1">/ {item.unit}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">{pagination.total} item total</p>
          <div className="flex gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === pagination.page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => router.push(`/catalog?page=${p}`)}
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
