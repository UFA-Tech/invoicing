import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { InvoiceWithRelations, BusinessProfile } from "@/types/invoice";

const TEAL = "#0d9488";
const TEAL_LIGHT = "#ccfbf1";
const TEAL_MID = "#99f6e4";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#134e4a",
    backgroundColor: "#ffffff",
    paddingLeft: 0,
    paddingRight: 48,
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: "row",
  },
  accentStripe: { width: 8, backgroundColor: TEAL, minHeight: "100%" },
  content: { flex: 1, paddingLeft: 40, paddingRight: 0, paddingTop: 44, paddingBottom: 44 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  headerLeft: { flexDirection: "column" },
  logo: { width: 52, height: 52, objectFit: "contain", marginBottom: 8 },
  brandName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  brandInfo: { fontSize: 8.5, color: "#5eead4", lineHeight: 1.7, marginTop: 3 },
  headerRight: { alignItems: "flex-end", paddingTop: 4 },
  invoiceLabel: { fontSize: 24, fontFamily: "Helvetica-Bold", color: TEAL, letterSpacing: 1, marginBottom: 2 },
  invoiceNum: { fontSize: 10, color: "#64748b", marginBottom: 10 },
  dateInfo: { fontSize: 8.5, color: "#0f766e", lineHeight: 1.7, textAlign: "right" },
  dividerTeal: { borderBottom: `2px solid ${TEAL}`, marginBottom: 24 },
  clientBand: {
    backgroundColor: TEAL_LIGHT,
    padding: "14 16",
    borderRadius: 5,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#0f766e", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  clientName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },
  clientDetail: { fontSize: 8.5, color: "#115e59", lineHeight: 1.5 },
  statusBadge: { backgroundColor: TEAL, padding: "6 12", borderRadius: 20 },
  statusText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase" },
  table: { marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0fdfa",
    padding: "8 0",
    borderTop: `1.5px solid ${TEAL}`,
    borderBottom: `1px solid ${TEAL_MID}`,
    marginBottom: 0,
  },
  tableRow: { flexDirection: "row", padding: "8 0", borderBottom: `1px solid ${TEAL_LIGHT}` },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colAmount: { flex: 2, textAlign: "right" },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: TEAL, textTransform: "uppercase", letterSpacing: 0.3 },
  tdText: { fontSize: 9, color: "#374151" },
  totals: { alignItems: "flex-end", marginBottom: 24 },
  totalRow: { flexDirection: "row", width: 216, paddingTop: 4, paddingBottom: 4 },
  totalLabel: { flex: 1, fontSize: 9, color: "#64748b" },
  totalValue: { fontSize: 9, color: "#0f172a" },
  separator: { borderBottom: `1px solid ${TEAL_MID}`, width: 216, marginBottom: 6, marginTop: 4 },
  grandRow: {
    flexDirection: "row",
    width: 216,
    padding: "11 14",
    backgroundColor: TEAL,
    borderRadius: 6,
  },
  grandLabel: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ccfbf1" },
  grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  notes: { marginBottom: 14, padding: "10 14", backgroundColor: "#f0fdfa", borderRadius: 4 },
  notesTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#0f766e", textTransform: "uppercase", marginBottom: 4 },
  notesText: { fontSize: 9, color: "#134e4a", lineHeight: 1.7 },
  footer: { borderTop: `1px solid ${TEAL_LIGHT}`, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  footerText: { fontSize: 8, color: "#99f6e4" },
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

export function TemplateElegant({ invoice, business }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentStripe} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {business.logoDataUrl && (
                <Image src={business.logoDataUrl} style={styles.logo} />
              )}
              <Text style={styles.brandName}>{business.businessName ?? "Bisnis Anda"}</Text>
              {business.businessAddress && <Text style={styles.brandInfo}>{business.businessAddress}</Text>}
              {business.businessPhone && <Text style={styles.brandInfo}>{business.businessPhone}</Text>}
              {business.businessEmail && <Text style={styles.brandInfo}>{business.businessEmail}</Text>}
              {business.taxNumber && <Text style={styles.brandInfo}>NPWP: {business.taxNumber}</Text>}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.invoiceLabel}>INVOICE</Text>
              <Text style={styles.invoiceNum}>#{invoice.invoiceNumber}</Text>
              <Text style={styles.dateInfo}>Tanggal: {fmtDate(invoice.issueDate)}</Text>
              {invoice.dueDate && <Text style={styles.dateInfo}>Jatuh Tempo: {fmtDate(invoice.dueDate)}</Text>}
            </View>
          </View>

          <View style={styles.dividerTeal} />

          <View style={styles.clientBand}>
            <View>
              <Text style={styles.clientLabel}>Ditagihkan kepada</Text>
              <Text style={styles.clientName}>{invoice.client?.name ?? "—"}</Text>
              {invoice.client?.company && <Text style={styles.clientDetail}>{invoice.client.company}</Text>}
              {invoice.client?.email && <Text style={styles.clientDetail}>{invoice.client.email}</Text>}
              {invoice.client?.phone && <Text style={styles.clientDetail}>{invoice.client.phone}</Text>}
              {invoice.client?.address && <Text style={styles.clientDetail}>{invoice.client.address}</Text>}
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{invoice.status}</Text>
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
              <View key={i} style={styles.tableRow}>
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
            <View style={styles.separator} />
            <View style={styles.grandRow}>
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

          <View style={styles.footer}>
            <Text style={styles.footerText}>{business.businessName ?? "Bisnis Anda"} — Terima kasih.</Text>
            <Text style={styles.footerText}>#{invoice.invoiceNumber}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
