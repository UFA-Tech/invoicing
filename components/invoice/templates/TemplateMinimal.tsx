import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { InvoiceWithRelations, BusinessProfile } from "@/types/invoice";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#111827", padding: 56, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 44 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, objectFit: "contain" },
  brandName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", letterSpacing: 1, textTransform: "uppercase" },
  brandSub: { fontSize: 8, color: "#9ca3af", lineHeight: 1.6, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  invoiceLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  invoiceNum: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827" },
  dividerHeavy: { borderBottom: "2px solid #111827", marginBottom: 28 },
  divider: { borderBottom: "1px solid #e5e7eb", marginBottom: 20 },
  metaRow: { flexDirection: "row", marginBottom: 24, gap: 40 },
  metaBlock: { flexDirection: "column" },
  metaLabel: { fontSize: 7.5, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  metaValue: { fontSize: 10, color: "#111827" },
  metaValueBold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  tableHead: { flexDirection: "row", paddingBottom: 6, borderBottom: "1px solid #111827", marginBottom: 2 },
  tableRow: { flexDirection: "row", paddingTop: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colAmount: { flex: 2, textAlign: "right" },
  thText: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  tdText: { fontSize: 9, color: "#374151" },
  totals: { alignItems: "flex-end", marginTop: 8, marginBottom: 32 },
  totalRow: { flexDirection: "row", width: 200, paddingTop: 5, paddingBottom: 5 },
  totalLabel: { flex: 1, fontSize: 9, color: "#6b7280" },
  totalValue: { fontSize: 9, color: "#111827" },
  grandDivider: { borderBottom: "2px solid #111827", width: 200, marginBottom: 6 },
  grandRow: { flexDirection: "row", width: 200 },
  grandLabel: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827" },
  grandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827" },
  notes: { marginBottom: 16 },
  notesLabel: { fontSize: 7.5, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 9, color: "#6b7280", lineHeight: 1.7 },
  footer: { position: "absolute", bottom: 40, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: "#d1d5db" },
});

function fmt(amount: number, currency: string): string {
  if (currency === "IDR") return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

interface Props {
  invoice: InvoiceWithRelations;
  business: BusinessProfile;
}

export function TemplateMinimal({ invoice, business }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {business.logoDataUrl && (
              <Image src={business.logoDataUrl} style={styles.logo} />
            )}
            <View>
              <Text style={styles.brandName}>{business.businessName ?? "Bisnis Anda"}</Text>
              {business.businessAddress && <Text style={styles.brandSub}>{business.businessAddress}</Text>}
              {business.businessPhone && <Text style={styles.brandSub}>{business.businessPhone}</Text>}
              {business.businessEmail && <Text style={styles.brandSub}>{business.businessEmail}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <Text style={styles.invoiceNum}>#{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.dividerHeavy} />

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Ditagihkan kepada</Text>
            <Text style={styles.metaValueBold}>{invoice.client?.name ?? "—"}</Text>
            {invoice.client?.company && <Text style={styles.metaValue}>{invoice.client.company}</Text>}
            {invoice.client?.email && <Text style={[styles.metaValue, { color: "#6b7280" }]}>{invoice.client.email}</Text>}
            {invoice.client?.address && <Text style={[styles.metaValue, { color: "#6b7280" }]}>{invoice.client.address}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Tanggal</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Jatuh Tempo</Text>
            <Text style={styles.metaValue}>{invoice.dueDate ? fmtDate(invoice.dueDate) : "—"}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValueBold}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.colDesc, styles.thText]}>Deskripsi</Text>
          <Text style={[styles.colQty, styles.thText]}>Qty</Text>
          <Text style={[styles.colUnit, styles.thText]}>Sat.</Text>
          <Text style={[styles.colPrice, styles.thText]}>Harga</Text>
          <Text style={[styles.colAmount, styles.thText]}>Total</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.colDesc, styles.tdText]}>{item.description}</Text>
            <Text style={[styles.colQty, styles.tdText]}>{item.quantity}</Text>
            <Text style={[styles.colUnit, styles.tdText]}>{item.unit ?? "—"}</Text>
            <Text style={[styles.colPrice, styles.tdText]}>{fmt(item.unitPrice, invoice.currency)}</Text>
            <Text style={[styles.colAmount, styles.tdText]}>{fmt(item.amount, invoice.currency)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Pajak ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>{fmt(invoice.taxAmount, invoice.currency)}</Text>
            </View>
          )}
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Diskon</Text>
              <Text style={styles.totalValue}>-{fmt(invoice.discount, invoice.currency)}</Text>
            </View>
          )}
          <View style={styles.grandDivider} />
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{fmt(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={[styles.notes, { marginTop: 8 }]}>
            <Text style={styles.notesLabel}>Catatan</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}
        {invoice.terms && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Syarat Pembayaran</Text>
            <Text style={styles.notesText}>{invoice.terms}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{business.businessName ?? "Bisnis Anda"}</Text>
          <Text style={styles.footerText}>#{invoice.invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
