"use client";

import Image from "next/image";
import { InvoiceFormData, BusinessProfile } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceStatus } from "@/types/invoice";

interface InvoicePreviewProps {
  data: Partial<InvoiceFormData>;
  business: BusinessProfile;
  template?: string;
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function ItemsTable({
  items,
  currency,
  thClass,
  evenRowClass = "",
}: {
  items: InvoiceFormData["items"];
  currency?: string;
  thClass: string;
  evenRowClass?: string;
}) {
  const filled = items?.filter((i) => i.description) ?? [];
  return (
    <table className="w-full mb-5 text-sm">
      <thead>
        <tr className={thClass}>
          <th className="text-left py-2 px-2 font-semibold text-xs uppercase tracking-wide">Deskripsi</th>
          <th className="text-center py-2 px-2 font-semibold text-xs uppercase tracking-wide">Qty</th>
          <th className="text-center py-2 px-2 font-semibold text-xs uppercase tracking-wide">Sat.</th>
          <th className="text-right py-2 px-2 font-semibold text-xs uppercase tracking-wide">Harga</th>
          <th className="text-right py-2 px-2 font-semibold text-xs uppercase tracking-wide">Total</th>
        </tr>
      </thead>
      <tbody>
        {filled.length ? (
          filled.map((item, i) => (
            <tr key={i} className={`border-b border-slate-100 ${i % 2 === 1 ? evenRowClass : ""}`}>
              <td className="py-2 px-2 text-slate-700">{item.description}</td>
              <td className="py-2 px-2 text-center text-slate-500">{item.quantity}</td>
              <td className="py-2 px-2 text-center text-slate-400 text-xs">{item.unit || "—"}</td>
              <td className="py-2 px-2 text-right text-slate-500 text-xs font-mono">{formatCurrency(item.unitPrice || 0, currency)}</td>
              <td className="py-2 px-2 text-right font-mono text-xs font-medium text-slate-800">{formatCurrency(item.amount || 0, currency)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="py-6 text-center text-slate-300 text-xs italic">Item invoice akan muncul di sini...</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function TotalsBlock({
  data,
  totalRowClass,
  totalTextClass,
  totalValueClass,
}: {
  data: Partial<InvoiceFormData>;
  totalRowClass: string;
  totalTextClass: string;
  totalValueClass: string;
}) {
  return (
    <div className="flex justify-end">
      <div className="w-56 space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Subtotal</span>
          <span className="font-mono">{formatCurrency(data.subtotal || 0, data.currency)}</span>
        </div>
        {Number(data.taxRate) > 0 && (
          <div className="flex justify-between text-xs text-slate-500">
            <span>Pajak ({data.taxRate}%)</span>
            <span className="font-mono">{formatCurrency(data.taxAmount || 0, data.currency)}</span>
          </div>
        )}
        {Number(data.discount) > 0 && (
          <div className="flex justify-between text-xs text-slate-500">
            <span>Diskon</span>
            <span className="font-mono text-red-500">-{formatCurrency(data.discount || 0, data.currency)}</span>
          </div>
        )}
        <div className={`flex justify-between px-3 py-2 mt-1 rounded-lg ${totalRowClass}`}>
          <span className={`text-xs font-bold ${totalTextClass}`}>TOTAL</span>
          <span className={`font-mono font-bold text-sm ${totalValueClass}`}>{formatCurrency(data.total || 0, data.currency)}</span>
        </div>
      </div>
    </div>
  );
}

function NotesBlock({ notes, terms }: { notes?: string; terms?: string }) {
  if (!notes && !terms) return null;
  return (
    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
      {notes && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Catatan</p>
          <p className="text-xs text-slate-500 whitespace-pre-line">{notes}</p>
        </div>
      )}
      {terms && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Syarat Pembayaran</p>
          <p className="text-xs text-slate-500 whitespace-pre-line">{terms}</p>
        </div>
      )}
    </div>
  );
}

// ─── Template: Classic ───────────────────────────────────────────────────────

function ClassicPreview({ data, business }: { data: Partial<InvoiceFormData>; business: BusinessProfile }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7 text-sm font-sans min-h-150">
      <div className="flex items-start justify-between mb-7">
        <div>
          {business.logoUrl && (
            <div className="relative w-12 h-12 mb-2">
              <Image src={business.logoUrl} alt="logo" fill className="object-contain" unoptimized />
            </div>
          )}
          <h2 className="text-lg font-bold text-slate-900">{business.businessName ?? "Nama Bisnis Anda"}</h2>
          {business.businessAddress && <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{business.businessAddress}</p>}
          {business.businessPhone && <p className="text-xs text-slate-500">{business.businessPhone}</p>}
          {business.businessEmail && <p className="text-xs text-slate-500">{business.businessEmail}</p>}
          {business.taxNumber && <p className="text-xs text-slate-500">NPWP: {business.taxNumber}</p>}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-900">INVOICE</p>
          {data.invoiceNumber && <p className="text-xs text-slate-500 mt-1">#{data.invoiceNumber}</p>}
          {data.status && <div className="mt-2"><InvoiceStatusBadge status={data.status as InvoiceStatus} /></div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6 pb-5 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Ditagihkan kepada</p>
          {data.client?.name
            ? <>
                <p className="font-semibold text-slate-900">{data.client.name}</p>
                {data.client.company && <p className="text-xs text-slate-500">{data.client.company}</p>}
                {data.client.email && <p className="text-xs text-slate-500">{data.client.email}</p>}
                {data.client.address && <p className="text-xs text-slate-500 whitespace-pre-line">{data.client.address}</p>}
              </>
            : <p className="text-sm text-slate-300 italic">Nama klien...</p>
          }
        </div>
        <div className="text-right space-y-1.5">
          <div>
            <p className="text-xs text-slate-400">Tanggal</p>
            <p className="text-sm font-medium">{data.issueDate ? formatDate(data.issueDate) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Jatuh Tempo</p>
            <p className="text-sm font-medium text-red-600">{data.dueDate ? formatDate(data.dueDate) : "—"}</p>
          </div>
        </div>
      </div>

      <ItemsTable items={data.items ?? []} currency={data.currency} thClass="border-b border-slate-100 text-slate-400" />
      <TotalsBlock data={data} totalRowClass="bg-slate-900" totalTextClass="text-white" totalValueClass="text-white" />
      <NotesBlock notes={data.notes} terms={data.terms} />
    </div>
  );
}

// ─── Template: Modern ────────────────────────────────────────────────────────

function ModernPreview({ data, business }: { data: Partial<InvoiceFormData>; business: BusinessProfile }) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans text-sm min-h-150 flex flex-col">
      {/* Blue header band */}
      <div className="bg-blue-800 px-7 py-5 flex items-start justify-between">
        <div>
          {business.logoUrl && (
            <div className="relative w-10 h-10 mb-2">
              <Image src={business.logoUrl} alt="logo" fill className="object-contain" unoptimized />
            </div>
          )}
          <h2 className="text-base font-bold text-white">{business.businessName ?? "Nama Bisnis Anda"}</h2>
          {business.businessAddress && <p className="text-xs text-blue-200 mt-0.5 whitespace-pre-line">{business.businessAddress}</p>}
          {business.businessPhone && <p className="text-xs text-blue-200">{business.businessPhone}</p>}
          {business.businessEmail && <p className="text-xs text-blue-200">{business.businessEmail}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">INVOICE</p>
          {data.invoiceNumber && <p className="text-xs text-blue-200 mt-0.5">#{data.invoiceNumber}</p>}
          <div className="mt-3 text-right space-y-1">
            <p className="text-xs text-blue-300">{data.issueDate ? formatDate(data.issueDate) : "Tanggal"}</p>
            <p className="text-xs text-blue-200 font-semibold">{data.dueDate ? `Due ${formatDate(data.dueDate)}` : "Jatuh Tempo"}</p>
          </div>
        </div>
      </div>

      {/* White body */}
      <div className="bg-white flex-1 px-7 py-5">
        <div className="mb-5 pb-4 border-b border-blue-100">
          <p className="text-xs text-blue-400 uppercase tracking-wide font-semibold mb-1">Ditagihkan kepada</p>
          {data.client?.name
            ? <>
                <p className="font-semibold text-slate-900">{data.client.name}</p>
                {data.client.company && <p className="text-xs text-slate-500">{data.client.company}</p>}
                {data.client.email && <p className="text-xs text-slate-500">{data.client.email}</p>}
              </>
            : <p className="text-sm text-slate-300 italic">Nama klien...</p>
          }
        </div>

        <ItemsTable
          items={data.items ?? []}
          currency={data.currency}
          thClass="bg-blue-600 text-white rounded"
          evenRowClass="bg-blue-50"
        />
        <TotalsBlock data={data} totalRowClass="bg-blue-700" totalTextClass="text-blue-100" totalValueClass="text-white" />
        <NotesBlock notes={data.notes} terms={data.terms} />
      </div>
    </div>
  );
}

// ─── Template: Minimal ───────────────────────────────────────────────────────

function MinimalPreview({ data, business }: { data: Partial<InvoiceFormData>; business: BusinessProfile }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 font-sans text-sm min-h-150">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {business.logoUrl && (
            <div className="relative w-9 h-9">
              <Image src={business.logoUrl} alt="logo" fill className="object-contain" unoptimized />
            </div>
          )}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{business.businessName ?? "Nama Bisnis Anda"}</h2>
            {business.businessAddress && <p className="text-xs text-slate-400 mt-0.5">{business.businessAddress}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Invoice</p>
          {data.invoiceNumber && <p className="text-base font-bold text-slate-900 mt-0.5">#{data.invoiceNumber}</p>}
        </div>
      </div>

      {/* Heavy rule */}
      <div className="border-t-2 border-slate-900 mb-5" />

      {/* Meta grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Klien</p>
          {data.client?.name
            ? <>
                <p className="font-semibold text-slate-900">{data.client.name}</p>
                {data.client.company && <p className="text-xs text-slate-500">{data.client.company}</p>}
                {data.client.email && <p className="text-xs text-slate-500">{data.client.email}</p>}
              </>
            : <p className="text-xs text-slate-300 italic">Nama klien...</p>
          }
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Tanggal</p>
          <p className="text-sm">{data.issueDate ? formatDate(data.issueDate) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Jatuh Tempo</p>
          <p className="text-sm">{data.dueDate ? formatDate(data.dueDate) : "—"}</p>
        </div>
      </div>

      {/* Table — headless style */}
      <div className="mb-4">
        <div className="flex border-b border-slate-900 pb-1 mb-2">
          <span className="flex-3 text-xs text-slate-500 uppercase tracking-wide">Deskripsi</span>
          <span className="flex-1 text-center text-xs text-slate-500 uppercase tracking-wide">Qty</span>
          <span className="flex-2 text-right text-xs text-slate-500 uppercase tracking-wide">Harga</span>
          <span className="flex-2 text-right text-xs text-slate-500 uppercase tracking-wide">Total</span>
        </div>
        {(data.items?.filter((i) => i.description) ?? []).length ? (
          data.items!.filter((i) => i.description).map((item, i) => (
            <div key={i} className="flex border-b border-slate-100 py-2">
              <span className="flex-3 text-slate-700">{item.description}</span>
              <span className="flex-1 text-center text-slate-500">{item.quantity}</span>
              <span className="flex-2 text-right font-mono text-xs text-slate-500">{formatCurrency(item.unitPrice || 0, data.currency)}</span>
              <span className="flex-2 text-right font-mono text-xs font-medium">{formatCurrency(item.amount || 0, data.currency)}</span>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-slate-300 text-xs italic">Item akan muncul di sini...</p>
        )}
      </div>

      {/* Totals — just text, then double rule for grand total */}
      <div className="flex justify-end">
        <div className="w-52 space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(data.subtotal || 0, data.currency)}</span>
          </div>
          {Number(data.taxRate) > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Pajak ({data.taxRate}%)</span>
              <span className="font-mono">{formatCurrency(data.taxAmount || 0, data.currency)}</span>
            </div>
          )}
          {Number(data.discount) > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Diskon</span>
              <span className="font-mono text-red-500">-{formatCurrency(data.discount || 0, data.currency)}</span>
            </div>
          )}
          <div className="border-t-2 border-slate-900 pt-1 mt-1 flex justify-between">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="font-mono font-bold text-sm text-slate-900">{formatCurrency(data.total || 0, data.currency)}</span>
          </div>
        </div>
      </div>

      <NotesBlock notes={data.notes} terms={data.terms} />
    </div>
  );
}

// ─── Template: Bold ──────────────────────────────────────────────────────────

function BoldPreview({ data, business }: { data: Partial<InvoiceFormData>; business: BusinessProfile }) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans text-sm min-h-150 flex flex-col">
      {/* Dark hero */}
      <div className="bg-slate-900 px-7 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            {business.logoUrl && (
              <div className="relative w-10 h-10 mb-2">
                <Image src={business.logoUrl} alt="logo" fill className="object-contain" unoptimized />
              </div>
            )}
            <h2 className="text-sm font-bold text-white">{business.businessName ?? "Nama Bisnis Anda"}</h2>
            {business.businessAddress && <p className="text-xs text-slate-400 mt-0.5 whitespace-pre-line">{business.businessAddress}</p>}
            {business.businessPhone && <p className="text-xs text-slate-400">{business.businessPhone}</p>}
            {business.businessEmail && <p className="text-xs text-slate-400">{business.businessEmail}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-amber-400 tracking-widest">INVOICE</p>
            {data.invoiceNumber && <p className="text-xs text-slate-400 mt-1">#{data.invoiceNumber}</p>}
            {data.status && <div className="mt-2 flex justify-end"><InvoiceStatusBadge status={data.status as InvoiceStatus} /></div>}
          </div>
        </div>
        {/* Date badges */}
        <div className="flex gap-3 mt-4">
          <div className="bg-slate-800 rounded px-3 py-1.5">
            <p className="text-xs text-slate-500">Tanggal</p>
            <p className="text-xs font-semibold text-slate-200">{data.issueDate ? formatDate(data.issueDate) : "—"}</p>
          </div>
          <div className="bg-slate-800 rounded px-3 py-1.5">
            <p className="text-xs text-slate-500">Jatuh Tempo</p>
            <p className="text-xs font-semibold text-slate-200">{data.dueDate ? formatDate(data.dueDate) : "—"}</p>
          </div>
        </div>
      </div>
      {/* Amber stripe */}
      <div className="h-1 bg-amber-400" />

      {/* White body */}
      <div className="bg-white flex-1 px-7 py-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Ditagihkan kepada</p>
            {data.client?.name
              ? <>
                  <p className="font-bold text-slate-900 text-base">{data.client.name}</p>
                  {data.client.company && <p className="text-xs text-slate-500">{data.client.company}</p>}
                  {data.client.email && <p className="text-xs text-slate-500">{data.client.email}</p>}
                </>
              : <p className="text-sm text-slate-300 italic">Nama klien...</p>
            }
          </div>
        </div>

        <ItemsTable
          items={data.items ?? []}
          currency={data.currency}
          thClass="border-t-2 border-amber-400 border-b border-slate-200 text-slate-500 bg-slate-50"
          evenRowClass="bg-slate-50"
        />
        <TotalsBlock data={data} totalRowClass="bg-amber-400" totalTextClass="text-slate-900" totalValueClass="text-slate-900" />
        <NotesBlock notes={data.notes} terms={data.terms} />
      </div>
    </div>
  );
}

// ─── Template: Elegant ───────────────────────────────────────────────────────

function ElegantPreview({ data, business }: { data: Partial<InvoiceFormData>; business: BusinessProfile }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans text-sm min-h-150 flex">
      {/* Teal left accent stripe */}
      <div className="w-2 bg-teal-500 shrink-0" />

      <div className="flex-1 px-6 py-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            {business.logoUrl && (
              <div className="relative w-11 h-11 mb-2">
                <Image src={business.logoUrl} alt="logo" fill className="object-contain" unoptimized />
              </div>
            )}
            <h2 className="text-base font-bold text-slate-900">{business.businessName ?? "Nama Bisnis Anda"}</h2>
            {business.businessAddress && <p className="text-xs text-teal-600 mt-0.5 whitespace-pre-line">{business.businessAddress}</p>}
            {business.businessPhone && <p className="text-xs text-teal-600">{business.businessPhone}</p>}
            {business.businessEmail && <p className="text-xs text-teal-600">{business.businessEmail}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-teal-600">INVOICE</p>
            {data.invoiceNumber && <p className="text-xs text-slate-400 mt-0.5">#{data.invoiceNumber}</p>}
            <p className="text-xs text-slate-500 mt-2">{data.issueDate ? formatDate(data.issueDate) : "Tanggal"}</p>
            <p className="text-xs text-slate-500">{data.dueDate ? `Due ${formatDate(data.dueDate)}` : "Jatuh Tempo"}</p>
          </div>
        </div>

        {/* Teal divider */}
        <div className="border-t-2 border-teal-500 mb-4" />

        {/* Client band */}
        <div className="bg-teal-50 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-teal-600 uppercase tracking-wide font-semibold mb-0.5">Ditagihkan kepada</p>
            {data.client?.name
              ? <>
                  <p className="font-semibold text-slate-900">{data.client.name}</p>
                  {data.client.company && <p className="text-xs text-slate-500">{data.client.company}</p>}
                  {data.client.email && <p className="text-xs text-slate-500">{data.client.email}</p>}
                </>
              : <p className="text-xs text-teal-300 italic">Nama klien...</p>
            }
          </div>
          {data.status && <InvoiceStatusBadge status={data.status as InvoiceStatus} />}
        </div>

        <ItemsTable
          items={data.items ?? []}
          currency={data.currency}
          thClass="border-t border-b border-teal-200 text-teal-700 bg-teal-50"
        />
        <TotalsBlock data={data} totalRowClass="bg-teal-600" totalTextClass="text-teal-100" totalValueClass="text-white" />
        <NotesBlock notes={data.notes} terms={data.terms} />
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function InvoicePreview({ data, business, template = "classic" }: InvoicePreviewProps) {
  const props = { data, business };
  switch (template) {
    case "modern":  return <ModernPreview  {...props} />;
    case "minimal": return <MinimalPreview {...props} />;
    case "bold":    return <BoldPreview    {...props} />;
    case "elegant": return <ElegantPreview {...props} />;
    default:        return <ClassicPreview {...props} />;
  }
}
