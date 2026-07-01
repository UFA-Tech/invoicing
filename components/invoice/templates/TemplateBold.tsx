import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { InvoiceWithRelations, BusinessProfile } from "@/types/invoice";

const DARK = "#0f172a";
const AMBER = "#f59e0b";
const AMBER_DARK = "#d97706";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", backgroundColor: "#ffffff" },
  heroHeader: {
    backgroundColor: DARK,
    padding: "32 48",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: {},
  logo: { width: 52, height: 52, objectFit: "contain", marginBottom: 8 },
  brandName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 4 },
  brandInfo: { fontSize: 8, color: "#94a3b8", lineHeight: 1.7 },
  heroRight: { alignItems: "flex-end" },
  invoiceWord: { fontSize: 36, fontFamily: "Helvetica-Bold", color: AMBER, letterSpacing: 2 },
  invoiceNum: { fontSize: 11, color: "#64748b", marginBottom: 16 },
  dateBadgeRow: { flexDirection: "row", gap: 16 },
  dateBadge: { backgroundColor: "#1e293b", borderRadius: 4, padding: "6 10" },
  dateBadgeLabel: { fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  dateBadgeValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#e2e8f0", marginTop: 2 },
  accentBar: { height: 4, backgroundColor: AMBER },
  body: { padding: "28 48" },
  clientRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  clientBlock: {},
  sectionLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  clientName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 3 },
  clientDetail: { fontSize: 9, color: "#64748b", lineHeight: 1.6 },
  statusBlock: { alignItems: "flex-end" },
  statusChip: { backgroundColor: AMBER, borderRadius: 3, padding: "5 12" },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", padding: "8 0", borderTop: `2px solid ${AMBER}`, borderBottom: "1px solid #e2e8f0", marginBottom: 0 },
  tableRow: { flexDirection: "row", padding: "8 0", borderBottom: "1px solid #f1f5f9" },
  tableRowAlt: { flexDirection: "row", padding: "8 0", borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colAmount: { flex: 2, textAlign: "right" },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", textTransform: "uppercase" },
  tdText: { fontSize: 9, color: "#334155" },
  totals: { alignItems: "flex-end", marginBottom: 24 },
  totalRow: { flexDirection: "row", width: 224, paddingTop: 4, paddingBottom: 4 },
  totalLabel: { flex: 1, fontSize: 9, color: "#64748b" },
  totalValue: { fontSize: 9, color: "#1e293b", fontFamily: "Helvetica-Bold" },
  grandTotal: {
    flexDirection: "row",
    width: 224,
    padding: "12 16",
    backgroundColor: AMBER,
    borderRadius: 5,
    marginTop: 10,
  },
  grandLabel: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK },
  grandValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: DARK },
  notes: { marginBottom: 14, padding: "10 14", backgroundColor: "#fffbeb", borderLeft: `3px solid ${AMBER}`, borderRadius: 3 },
  notesTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: AMBER_DARK, textTransform: "uppercase", marginBottom: 4 },
  notesText: { fontSize: 9, color: "#78716c", lineHeight: 1.6 },
  footer: {
    backgroundColor: DARK,
    padding: "12 48",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footerText: { fontSize: 8, color: "#64748b" },
});

function fmt(amount: number, currency: string): string {
  if (currency === "IDR") return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  invoice: InvoiceWithRelations;
  business: BusinessProfile;
}

export function TemplateBold({ invoice, business }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={styles.heroLeft}>
            {business.logoDataUrl && (
              <Image src={business.logoDataUrl} style={styles.logo} />
            )}
            <Text style={styles.brandName}>{business.businessName ?? "Bisnis Anda"}</Text>
            {business.businessAddress && <Text style={styles.brandInfo}>{business.businessAddress}</Text>}
            {business.businessPhone && <Text style={styles.brandInfo}>{business.businessPhone}</Text>}
            {business.businessEmail && <Text style={styles.brandInfo}>{business.businessEmail}</Text>}
            {business.taxNumber && <Text style={styles.brandInfo}>NPWP: {business.taxNumber}</Text>}
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.invoiceWord}>INVOICE</Text>
            <Text style={styles.invoiceNum}>#{invoice.invoiceNumber}</Text>
            <View style={styles.dateBadgeRow}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeLabel}>Tanggal</Text>
                <Text style={styles.dateBadgeValue}>{fmtDate(invoice.issueDate)}</Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeLabel}>Jatuh Tempo</Text>
                <Text style={styles.dateBadgeValue}>{fmtDate(invoice.dueDate)}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.accentBar} />

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.clientRow}>
            <View style={styles.clientBlock}>
              <Text style={styles.sectionLabel}>Ditagihkan kepada</Text>
              <Text style={styles.clientName}>{invoice.client?.name ?? "—"}</Text>
              {invoice.client?.company && <Text style={styles.clientDetail}>{invoice.client.company}</Text>}
              {invoice.client?.email && <Text style={styles.clientDetail}>{invoice.client.email}</Text>}
              {invoice.client?.phone && <Text style={styles.clientDetail}>{invoice.client.phone}</Text>}
              {invoice.client?.address && <Text style={styles.clientDetail}>{invoice.client.address}</Text>}
            </View>
            <View style={styles.statusBlock}>
              <Text style={styles.sectionLabel}>Status</Text>
              <View style={styles.statusChip}>
                <Text style={styles.statusText}>{invoice.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDesc, styles.thText]}>Deskripsi</Text>
              <Text style={[styles.colQty, styles.thText]}>Qty</Text>
              <Text style={[styles.colUnit, styles.thText]}>Sat.</Text>
              <Text style={[styles.colPrice, styles.thText]}>Harga</Text>
              <Text style={[styles.colAmount, styles.thText]}>Total</Text>
            </View>
            {invoice.items.map((item, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.colDesc, styles.tdText]}>{item.description}</Text>
                <Text style={[styles.colQty, styles.tdText]}>{item.quantity}</Text>
                <Text style={[styles.colUnit, styles.tdText]}>{item.unit ?? "—"}</Text>
                <Text style={[styles.colPrice, styles.tdText]}>{fmt(item.unitPrice, invoice.currency)}</Text>
                <Text style={[styles.colAmount, styles.tdText]}>{fmt(item.amount, invoice.currency)}</Text>
              </View>
            ))}
          </View>

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
            <View style={styles.grandTotal}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{fmt(invoice.total, invoice.currency)}</Text>
            </View>
          </View>

          {invoice.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Catatan</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}
          {invoice.terms && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Syarat Pembayaran</Text>
              <Text style={styles.notesText}>{invoice.terms}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{business.businessName ?? "Bisnis Anda"} — Terima kasih.</Text>
          <Text style={styles.footerText}>#{invoice.invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
