import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { InvoiceWithRelations, BusinessProfile } from "@/types/invoice";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    padding: 48,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  businessInfo: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.6,
    textAlign: "right",
  },
  invoiceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: "1px solid #e2e8f0",
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#64748b",
  },
  metaGrid: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaLabel: {
    fontSize: 9,
    color: "#94a3b8",
    width: 72,
    textAlign: "right",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    width: 80,
    textAlign: "right",
  },
  clientSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.5,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    padding: "8 10",
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 10",
    borderBottom: "1px solid #f1f5f9",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colAmount: { flex: 2, textAlign: "right" },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  tableCellText: {
    fontSize: 9,
    color: "#374151",
  },
  totals: {
    alignItems: "flex-end",
    marginBottom: 32,
  },
  totalRow: {
    flexDirection: "row",
    width: 220,
    padding: "4 0",
  },
  totalLabel: {
    flex: 1,
    fontSize: 9,
    color: "#64748b",
  },
  totalValue: {
    fontSize: 9,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    width: 220,
    padding: "10 12",
    backgroundColor: "#0f172a",
    borderRadius: 6,
    marginTop: 8,
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 10,
    color: "#94a3b8",
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontSize: 11,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },
  notes: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderLeft: "3px solid #e2e8f0",
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.6,
  },
  footer: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

function formatCurrencyPdf(amount: number, currency: string): string {
  if (currency === "IDR") {
    return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDatePdf(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  invoice: InvoiceWithRelations;
  business: BusinessProfile;
}

export function InvoicePDFTemplate({ invoice, business }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>
              {business.businessName ?? "Bisnis Anda"}
            </Text>
            {business.businessAddress && (
              <Text style={[styles.businessInfo, { textAlign: "left", marginTop: 4 }]}>
                {business.businessAddress}
              </Text>
            )}
            {business.businessPhone && (
              <Text style={[styles.businessInfo, { textAlign: "left" }]}>
                {business.businessPhone}
              </Text>
            )}
            {business.businessEmail && (
              <Text style={[styles.businessInfo, { textAlign: "left" }]}>
                {business.businessEmail}
              </Text>
            )}
            {business.taxNumber && (
              <Text style={[styles.businessInfo, { textAlign: "left" }]}>
                NPWP: {business.taxNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Invoice Meta */}
        <View style={styles.invoiceMeta}>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaGrid}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tanggal</Text>
              <Text style={styles.metaValue}>{formatDatePdf(invoice.issueDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Jatuh Tempo</Text>
              <Text style={styles.metaValue}>{invoice.dueDate ? formatDatePdf(invoice.dueDate) : "—"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>{invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionLabel}>Ditagihkan kepada</Text>
          <Text style={styles.clientName}>{invoice.client?.name ?? "—"}</Text>
          {invoice.client?.company && (
            <Text style={styles.clientDetail}>{invoice.client.company}</Text>
          )}
          {invoice.client?.email && (
            <Text style={styles.clientDetail}>{invoice.client.email}</Text>
          )}
          {invoice.client?.phone && (
            <Text style={styles.clientDetail}>{invoice.client.phone}</Text>
          )}
          {invoice.client?.address && (
            <Text style={styles.clientDetail}>{invoice.client.address}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.tableHeaderText]}>Deskripsi</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colUnit, styles.tableHeaderText]}>Satuan</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>Harga</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.colDesc, styles.tableCellText]}>
                {item.description}
              </Text>
              <Text style={[styles.colQty, styles.tableCellText]}>
                {item.quantity}
              </Text>
              <Text style={[styles.colUnit, styles.tableCellText]}>
                {item.unit ?? "—"}
              </Text>
              <Text style={[styles.colPrice, styles.tableCellText]}>
                {formatCurrencyPdf(item.unitPrice, invoice.currency)}
              </Text>
              <Text style={[styles.colAmount, styles.tableCellText]}>
                {formatCurrencyPdf(item.amount, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrencyPdf(Number(invoice.subtotal), invoice.currency)}
            </Text>
          </View>
          {Number(invoice.taxRate) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Pajak ({Number(invoice.taxRate)}%)
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrencyPdf(Number(invoice.taxAmount), invoice.currency)}
              </Text>
            </View>
          )}
          {Number(invoice.discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Diskon</Text>
              <Text style={styles.totalValue}>
                -{formatCurrencyPdf(Number(invoice.discount), invoice.currency)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrencyPdf(Number(invoice.total), invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {business.businessName ?? "Bisnis Anda"} — Terima kasih atas kepercayaan Anda.
          </Text>
          <Text style={styles.footerText}>#{invoice.invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
