export const InvoiceStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export interface InvoiceItemInput {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit?: string;
}

export interface ClientInput {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate?: Date;
  currency: string;
  template: string;
  client: ClientInput;
  items: InvoiceItemInput[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
}

export interface ClientType {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  company: string | null;
}

export interface CatalogItemType {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  unit: string | null;
}

export interface InvoiceWithRelations {
  id: string;
  userId: string;
  clientId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  template: string;
  notes: string | null;
  terms: string | null;
  publicToken: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    company: string | null;
  } | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    unit: string | null;
  }[];
}

export interface BusinessProfile {
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  taxNumber: string | null;
  logoUrl: string | null;
  logoDataUrl?: string | null;
  invoicePrefix: string | null;
  defaultCurrency: string | null;
  defaultTerms: string | null;
  defaultTemplate: string | null;
}

export interface DashboardStats {
  totalInvoices: number;
  sentInvoices: number;
  paidInvoices: number;
  totalRevenue: number;
  overdueInvoices: number;
}
