"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Pencil, Trash2, Users, X, Check } from "lucide-react";
import { ClientType } from "@/types/invoice";

const clientSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientManagerProps {
  initialClients: ClientType[];
}

export function ClientManager({ initialClients }: ClientManagerProps) {
  const [clients, setClients] = useState<ClientType[]>(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", phone: "", address: "", company: "" },
  });

  function openAdd() {
    form.reset({ name: "", email: "", phone: "", address: "", company: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: ClientType) {
    form.reset({
      name: client.name,
      email: client.email,
      phone: client.phone ?? "",
      address: client.address ?? "",
      company: client.company ?? "",
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function onSubmit(data: ClientFormData) {
    try {
      if (editingId) {
        const res = await fetch(`/api/clients/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setClients((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        toast.success("Data klien diperbarui");
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Klien berhasil ditambahkan");
      }
      closeForm();
    } catch {
      toast.error("Gagal menyimpan data klien");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Klien dihapus");
    } catch {
      toast.error("Gagal menghapus klien");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5" size="sm">
          <Plus className="w-4 h-4" />
          Tambah Klien
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {editingId ? "Edit Klien" : "Tambah Klien Baru"}
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
                        <FormLabel>Nama *</FormLabel>
                        <FormControl>
                          <Input placeholder="Budi Santoso" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
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
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perusahaan</FormLabel>
                        <FormControl>
                          <Input placeholder="PT. Maju Jaya" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telepon</FormLabel>
                        <FormControl>
                          <Input placeholder="+62 812 3456 7890" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Jl. Contoh No. 123, Jakarta" rows={2} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
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

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada data klien</p>
          <p className="text-xs mt-1">Tambahkan klien untuk mempercepat pembuatan invoice</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="relative group">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{client.name}</p>
                    {client.company && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{client.company}</p>
                    )}
                    <p className="text-xs text-slate-400 truncate mt-1">{client.email}</p>
                    {client.phone && (
                      <p className="text-xs text-slate-400 truncate">{client.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                      onClick={() => openEdit(client)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(client.id)}
                      disabled={deletingId === client.id}
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
    </div>
  );
}
