"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Check } from "lucide-react";
import { TEMPLATE_META, type TemplateKey } from "@/components/invoice/templates";
import { cn } from "@/lib/utils";

const settingsSchema = z.object({
  businessName: z.string().min(1, "Nama bisnis wajib diisi"),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email("Email tidak valid").optional().or(z.literal("")),
  taxNumber: z.string().optional(),
  invoicePrefix: z.string().optional(),
  defaultCurrency: z.string().optional(),
  defaultTerms: z.string().optional(),
  defaultTemplate: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

function TemplateColorSwatch({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-1">
      {colors.map((c) => (
        <div
          key={c}
          className="w-4 h-4 rounded-full border border-white/20"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

function TemplatePreviewCard({ templateKey, name, description, colors, selected, onSelect }: {
  templateKey: TemplateKey;
  name: string;
  description: string;
  colors: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  const [primary, secondary, tertiary] = colors;

  const previews: Record<TemplateKey, React.ReactNode> = {
    classic: (
      <div className="w-full h-full bg-white p-2 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <div className="w-12 h-2 rounded" style={{ backgroundColor: primary }} />
          <div className="w-8 h-1.5 rounded" style={{ backgroundColor: tertiary }} />
        </div>
        <div className="h-px w-full" style={{ backgroundColor: secondary }} />
        <div className="w-10 h-3 rounded" style={{ backgroundColor: secondary }} />
        <div className="flex gap-0.5 mt-0.5">
          {[3, 1, 1, 2, 2].map((w, i) => (
            <div key={i} className="h-1.5 rounded" style={{ backgroundColor: secondary, flex: w, opacity: 0.6 }} />
          ))}
        </div>
        <div className="flex gap-0.5">
          {[3, 1, 1, 2, 2].map((w, i) => (
            <div key={i} className="h-1 rounded" style={{ backgroundColor: "#e2e8f0", flex: w }} />
          ))}
        </div>
        <div className="mt-auto self-end w-16 h-3 rounded" style={{ backgroundColor: primary }} />
      </div>
    ),
    modern: (
      <div className="w-full h-full flex">
        <div className="w-8 h-full rounded-l flex flex-col items-center pt-2 gap-1" style={{ backgroundColor: primary }}>
          <div className="w-4 h-1 rounded" style={{ backgroundColor: "rgba(255,255,255,0.4)" }} />
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
        </div>
        <div className="flex-1 bg-white p-1.5 flex flex-col gap-1">
          <div className="w-10 h-3 rounded" style={{ backgroundColor: secondary }} />
          <div className="h-px w-full" style={{ backgroundColor: secondary }} />
          <div className="flex gap-0.5">
            {[3, 1, 1, 2, 2].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ backgroundColor: "#e2e8f0", flex: w }} />
            ))}
          </div>
          <div className="mt-auto self-end w-12 h-2.5 rounded" style={{ backgroundColor: primary }} />
        </div>
      </div>
    ),
    minimal: (
      <div className="w-full h-full bg-white p-2 flex flex-col gap-1.5">
        <div className="flex justify-between items-start">
          <div className="w-10 h-1.5 rounded" style={{ backgroundColor: primary }} />
          <div className="w-6 h-1 rounded" style={{ backgroundColor: secondary }} />
        </div>
        <div className="h-0.5 w-full" style={{ backgroundColor: primary }} />
        <div className="flex gap-0.5">
          {[3, 1, 1, 2, 2].map((w, i) => (
            <div key={i} className="h-px" style={{ backgroundColor: secondary, flex: w, opacity: 0.5 }} />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-0.5">
            {[3, 1, 1, 2, 2].map((w, j) => (
              <div key={j} className="h-1 rounded" style={{ backgroundColor: tertiary, flex: w }} />
            ))}
          </div>
        ))}
        <div className="h-0.5 w-full mt-auto" style={{ backgroundColor: primary }} />
        <div className="self-end flex items-center gap-1">
          <div className="w-6 h-1 rounded" style={{ backgroundColor: secondary }} />
          <div className="w-10 h-2 rounded" style={{ backgroundColor: primary }} />
        </div>
      </div>
    ),
    bold: (
      <div className="w-full h-full flex flex-col">
        <div className="h-10 px-2 py-1.5 flex justify-between items-start" style={{ backgroundColor: primary }}>
          <div className="flex flex-col gap-0.5">
            <div className="w-8 h-1.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.7)" }} />
            <div className="w-5 h-1 rounded" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="w-10 h-3 rounded font-bold" style={{ backgroundColor: secondary }} />
            <div className="w-6 h-1 rounded" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: secondary }} />
        <div className="flex-1 bg-white p-1.5 flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            {[3, 1, 1, 2, 2].map((w, i) => (
              <div key={i} className="h-1.5 rounded" style={{ backgroundColor: "#f1f5f9", flex: w }} />
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-0.5">
              {[3, 1, 1, 2, 2].map((w, j) => (
                <div key={j} className="h-1 rounded" style={{ backgroundColor: "#e2e8f0", flex: w }} />
              ))}
            </div>
          ))}
          <div className="mt-auto self-end w-14 h-3 rounded" style={{ backgroundColor: secondary }} />
        </div>
      </div>
    ),
    elegant: (
      <div className="w-full h-full flex">
        <div className="w-2 h-full rounded-l" style={{ backgroundColor: primary }} />
        <div className="flex-1 bg-white p-1.5 flex flex-col gap-1">
          <div className="flex justify-between">
            <div className="w-10 h-2 rounded" style={{ backgroundColor: "#0f172a" }} />
            <div className="w-8 h-2 rounded" style={{ backgroundColor: primary }} />
          </div>
          <div className="h-0.5 w-full" style={{ backgroundColor: primary }} />
          <div className="h-4 rounded px-1 flex items-center" style={{ backgroundColor: secondary }}>
            <div className="w-8 h-1 rounded" style={{ backgroundColor: primary, opacity: 0.5 }} />
          </div>
          <div className="flex gap-0.5">
            {[3, 1, 1, 2, 2].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ backgroundColor: "#e2e8f0", flex: w }} />
            ))}
          </div>
          <div className="mt-auto self-end w-12 h-2.5 rounded" style={{ backgroundColor: primary }} />
        </div>
      </div>
    ),
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col rounded-lg border-2 overflow-hidden transition-all text-left cursor-pointer",
        selected
          ? "border-slate-900 shadow-md ring-2 ring-slate-900/10"
          : "border-slate-200 hover:border-slate-400"
      )}
    >
      {/* Preview area */}
      <div className="h-32 w-full bg-slate-50 overflow-hidden">
        {previews[templateKey]}
      </div>

      {/* Info */}
      <div className="p-3 bg-white flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-slate-800">{name}</span>
          {selected && (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-900">
              <Check className="w-3 h-3" /> Dipilih
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        <div className="mt-2">
          <TemplateColorSwatch colors={colors} />
        </div>
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      taxNumber: "",
      invoicePrefix: "INV-",
      defaultCurrency: "IDR",
      defaultTerms: "",
      defaultTemplate: "classic",
    },
  });

  const selectedTemplate = form.watch("defaultTemplate") as TemplateKey;

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        form.reset({
          businessName: data.businessName ?? "",
          businessAddress: data.businessAddress ?? "",
          businessPhone: data.businessPhone ?? "",
          businessEmail: data.businessEmail ?? "",
          taxNumber: data.taxNumber ?? "",
          invoicePrefix: data.invoicePrefix ?? "INV-",
          defaultCurrency: data.defaultCurrency ?? "IDR",
          defaultTerms: data.defaultTerms ?? "",
          defaultTemplate: data.defaultTemplate ?? "classic",
        });
        setLogoUrl(data.logoUrl ?? null);
      })
      .finally(() => setFetching(false));
  }, [form]);

  async function onSubmit(values: SettingsFormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success("Pengaturan berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload gagal");
      setLogoUrl(data.logoUrl);
      toast.success("Logo berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLogoRemove() {
    try {
      await fetch("/api/settings/logo", { method: "DELETE" });
      setLogoUrl(null);
      toast.success("Logo dihapus");
    } catch {
      toast.error("Gagal menghapus logo");
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil bisnis dan preferensi aplikasi"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo Bisnis</CardTitle>
              <CardDescription>
                Logo akan ditampilkan di semua invoice yang Anda buat. Format PNG atau JPG, maks. 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {logoUrl ? (
                  <div className="relative w-24 h-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                    <Image
                      src={logoUrl}
                      alt="Logo bisnis"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={logoUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> {logoUrl ? "Ganti Logo" : "Unggah Logo"}</>
                    )}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={handleLogoRemove}
                    >
                      <X className="w-4 h-4 mr-1" /> Hapus Logo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Bisnis</CardTitle>
              <CardDescription>
                Informasi ini akan ditampilkan di invoice yang Anda buat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bisnis *</FormLabel>
                    <FormControl>
                      <Input placeholder="CV. Usaha Maju" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Jl. Contoh No. 123, Jakarta" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder="+62 812 3456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Bisnis</FormLabel>
                      <FormControl>
                        <Input placeholder="info@bisnis.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor NPWP</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000.0-000.000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Template Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Template Invoice</CardTitle>
              <CardDescription>
                Pilih tampilan PDF yang akan digunakan untuk semua invoice Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="defaultTemplate"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {TEMPLATE_META.map((tpl) => (
                        <TemplatePreviewCard
                          key={tpl.key}
                          templateKey={tpl.key}
                          name={tpl.name}
                          description={tpl.description}
                          colors={tpl.colors}
                          selected={field.value === tpl.key}
                          onSelect={() => field.onChange(tpl.key)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Invoice</CardTitle>
              <CardDescription>Pengaturan default untuk invoice baru.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoicePrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefix Nomor Invoice</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata Uang Default</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="defaultTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Syarat Pembayaran Default</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Pembayaran dilakukan melalui transfer bank ke rekening BCA 1234567890 a/n CV. Usaha Maju."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Simpan Perubahan
          </Button>
        </form>
      </Form>

      {/* Selected template indicator */}
      {selectedTemplate && (
        <p className="mt-3 text-xs text-slate-400 text-center">
          Template aktif: <span className="font-medium text-slate-600 capitalize">{selectedTemplate}</span>
        </p>
      )}
    </div>
  );
}
