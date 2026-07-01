import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { InvoiceWithRelations, BusinessProfile } from "@/types/invoice";

const BLUE = "#1d4ed8";
const BLUE_DARK = "#1e3a8a";
const BLUE_LIGHT = "#dbeafe";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", flexDirection: "row" },
  sidebar: { width: 168, backgroundColor: BLUE_DARK, paddingTop: 40, paddingBottom: 40, paddingLeft: 20, paddingRight: 20 },
  logo: { width: 52, height: 52, objectFit: "contain", marginBottom: 10 },
  sidebarBrand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 10, lineHeight: 1.3 },
  sidebarInfo: { fontSize: 8, color: "#93c5fd", lineHeight: 1.8, marginBottom: 16 },
  sidebarDivider: { borderBottom: "1px solid #3b82f6", marginBottom: 20 },
  sidebarLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#93c5fd", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  sidebarValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 12 },
  statusBadge: { backgroundColor: BLUE, padding: "4 8", borderRadius: 4, marginTop: 8, alignSelf: "flex-start" },
  statusText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#bfdbfe", textTransform: "uppercase" },
  main: { flex: 1, padding: 36 },
  invoiceTitle: { fontSize: 30, fontFamily: "Helvetica-Bold", color: BLUE, marginBottom: 2 },
  invoiceNumber: { fontSize: 11, color: "#64748b", marginBottom: 24 },
  divider: { borderBottom: `1px solid ${BLUE_LIGHT}`, marginBottom: 20 },
  clientLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  clientName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },
  clientDetail: { fontSize: 9, color: "#64748b", lineHeight: 1.5 },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: BLUE, padding: "7 10", marginBottom: 2, borderRadius: 3 },
  tableRow: { flexDirection: "row", padding: "7 10", borderBottom: `1px solid ${BLUE_LIGHT}` },
  tableAlt: { flexDirection: "row", padding: "7 10", borderBottom: `1px solid ${BLUE_LIGHT}`, backgroundColor: "#f8fafc" },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colAmount: { flex: 2, textAlign: "right" },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase" },
  tdText: { fontSize: 9, color: "#374151" },
  totals: { alignItems: "flex-end", marginBottom: 24 },
  totalRow: { flexDirection: "row", width: 210, padding: "3 0" },
  totalLabel: { flex: 1, fontSize: 9, color: "#64748b" },
  totalValue: { fontSize: 9, color: "#1e293b", fontFamily: "Helvetica-Bold" },
  grandTotalRow: { flexDirection: "row", width: 210, padding: "10 14", backgroundColor: BLUE, borderRadius: 5, marginTop: 6 },
  grandTotalLabel: { flex: 1, fontSize: 10, color: "#bfdbfe", fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 12, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  notes: { marginBottom: 12, padding: 12, backgroundColor: "#f0f9ff", borderRadius: 4, borderLeft: `3px solid ${BLUE}` },
  notesTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#3b82f6", textTransform: "uppercase", marginBottom: 4 },
  notesText: { fontSize: 8.5, color: "#475569", lineHeight: 1.6 },
  footer: { borderTop: `1px solid ${BLUE_LIGHT}`, paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: "#94a3b8" },
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

export function TemplateModern({ invoice, business }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          {business.logoDataUrl && (
            <Image src={business.logoDataUrl} style={styles.logo} />
          )}
          <Text style={styles.sidebarBrand}>{business.businessName ?? "Bisnis Anda"}</Text>
          <View style={styles.sidebarDivider} />
          {business.businessAddress && <Text style={styles.sidebarInfo}>{business.businessAddress}</Text>}
          {business.businessPhone && <Text style={styles.sidebarInfo}>{business.businessPhone}</Text>}
          {business.businessEmail && <Text style={styles.sidebarInfo}>{business.businessEmail}</Text>}
          {business.taxNumber && <Text style={styles.sidebarInfo}>NPWP: {business.taxNumber}</Text>}

          <View style={{ marginTop: 24 }}>
            <Text style={styles.sidebarLabel}>Tanggal</Text>
            <Text style={styles.sidebarValue}>{fmtDate(invoice.issueDate)}</Text>
            <Text style={styles.sidebarLabel}>Jatuh Tempo</Text>
            <Text style={styles.sidebarValue}>{invoice.dueDate ? fmtDate(invoice.dueDate) : "—"}</Text>
            <Text style={styles.sidebarLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Main */}
        <View style={styles.main}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          <View style={styles.divider} />

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.clientLabel}>Ditagihkan kepada</Text>
            <Text style={styles.clientName}>{invoice.client?.name ?? "—"}</Text>
            {invoice.client?.company && <Text style={styles.clientDetail}>{invoice.client.company}</Text>}
            {invoice.client?.email && <Text style={styles.clientDetail}>{invoice.client.email}</Text>}
            {invoice.client?.phone && <Text style={styles.clientDetail}>{invoice.client.phone}</Text>}
            {invoice.client?.address && <Text style={styles.clientDetail}>{invoice.client.address}</Text>}
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
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableAlt}>
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
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{fmt(invoice.total, invoice.currency)}</Text>
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

          <View style={styles.footer}>
            <Text style={styles.footerText}>{business.businessName ?? "Bisnis Anda"}</Text>
            <Text style={styles.footerText}>#{invoice.invoiceNumber}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
