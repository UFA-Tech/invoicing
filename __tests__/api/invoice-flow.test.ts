import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mock singletons
// vi.hoisted() runs before imports, so these refs are safe inside vi.mock() factories.
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  // In-transaction mock object (advisory-lock flow in POST /api/invoices)
  const mockTx = {
    $executeRaw: vi.fn(),
    invoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(),
    invoice: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };

  return {
    auth: vi.fn(),
    prisma,
    mockTx,
    renderToBuffer: vi.fn(),
    getTemplate: vi.fn(),
    logoToDataUrl: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
    sendInvoiceEmail: vi.fn(),
  };
});

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@react-pdf/renderer", () => ({ renderToBuffer: mocks.renderToBuffer }));
vi.mock("@/components/invoice/templates", () => ({ getTemplate: mocks.getTemplate }));
vi.mock("@/lib/logo", () => ({ logoToDataUrl: mocks.logoToDataUrl }));
vi.mock("@vercel/blob", () => ({ put: mocks.put, del: mocks.del }));
vi.mock("@/lib/email", () => ({ sendInvoiceEmail: mocks.sendInvoiceEmail }));

import { POST as createInvoice } from "@/app/api/invoices/route";
import { GET as getInvoicePdf } from "@/app/api/invoices/[id]/pdf/route";
import { POST as sendInvoice } from "@/app/api/invoices/[id]/send/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com" },
};

const NEW_INVOICE_BODY = {
  invoiceNumber: "INV-2026-07-001",
  status: "DRAFT",
  issueDate: "2026-07-01",
  dueDate: "2026-07-31",
  currency: "IDR",
  template: "classic",
  client: {
    name: "Acme Corp",
    email: "billing@acme.com",
    phone: "+62811111111",
  },
  items: [
    { description: "Consulting", quantity: 2, unitPrice: 500000, amount: 1000000, unit: "jam" },
  ],
  subtotal: 1000000,
  taxRate: 11,
  taxAmount: 110000,
  discount: 0,
  total: 1110000,
};

const DB_CLIENT = {
  id: "client-1",
  name: "Acme Corp",
  email: "billing@acme.com",
  phone: "+62811111111",
  address: null,
  company: null,
  userId: "user-1",
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
};

const DB_INVOICE = {
  id: "inv-1",
  userId: "user-1",
  invoiceNumber: "INV-2026-07-001",
  status: "DRAFT",
  clientId: "client-1",
  issueDate: new Date("2026-07-01"),
  dueDate: new Date("2026-07-31"),
  subtotal: 1000000,
  taxRate: 11,
  taxAmount: 110000,
  discount: 0,
  total: 1110000,
  currency: "IDR",
  template: "classic",
  notes: null,
  terms: null,
  publicToken: null,
  pdfCacheUrl: null,
  sentAt: null,
  paidAt: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
  client: DB_CLIENT,
  items: [
    {
      id: "item-1",
      invoiceId: "inv-1",
      description: "Consulting",
      quantity: 2,
      unitPrice: 500000,
      amount: 1000000,
      unit: "jam",
    },
  ],
};

const DB_USER = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  businessName: "Test Business",
  businessEmail: "business@example.com",
  businessAddress: "Jl. Test No.1",
  businessPhone: null,
  taxNumber: null,
  logoUrl: null,
  invoicePrefix: "INV-",
  defaultTemplate: "classic",
  defaultCurrency: "IDR",
  defaultTerms: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Invoice API — core flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Auth
    mocks.auth.mockResolvedValue(SESSION);

    // Prisma $transaction — executes the callback with mockTx
    mocks.prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mocks.mockTx) => Promise<unknown>) => fn(mocks.mockTx)
    );
    mocks.mockTx.$executeRaw.mockResolvedValue([]);
    mocks.mockTx.invoice.findUnique.mockResolvedValue(null); // no conflict by default
    mocks.mockTx.invoice.findFirst.mockResolvedValue(null);
    mocks.mockTx.invoice.create.mockResolvedValue(DB_INVOICE);

    mocks.prisma.client.findFirst.mockResolvedValue(null);
    mocks.prisma.client.create.mockResolvedValue(DB_CLIENT);
    mocks.prisma.invoice.findFirst.mockResolvedValue(DB_INVOICE);
    mocks.prisma.invoice.update.mockResolvedValue({
      ...DB_INVOICE,
      status: "SENT",
      sentAt: new Date(),
    });
    mocks.prisma.user.findUnique.mockResolvedValue(DB_USER);

    // PDF
    mocks.renderToBuffer.mockResolvedValue(Buffer.from("FAKE-PDF-CONTENT"));
    mocks.getTemplate.mockReturnValue(() => null);
    mocks.logoToDataUrl.mockResolvedValue(null);
    mocks.put.mockResolvedValue({ url: "https://blob.test/pdfs/inv-1.pdf" });

    // Email
    mocks.sendInvoiceEmail.mockResolvedValue(undefined);
  });

  // ─── POST /api/invoices ───────────────────────────────────────────────────

  describe("POST /api/invoices", () => {
    it("returns 201 with the created invoice", async () => {
      const req = makeRequest("POST", "http://localhost:3000/api/invoices", NEW_INVOICE_BODY);
      const res = await createInvoice(req);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe("inv-1");
      expect(body.invoiceNumber).toBe("INV-2026-07-001");
    });

    it("acquires a per-user advisory lock inside the transaction", async () => {
      const req = makeRequest("POST", "http://localhost:3000/api/invoices", NEW_INVOICE_BODY);
      await createInvoice(req);

      expect(mocks.prisma.$transaction).toHaveBeenCalledOnce();
      // Advisory lock fires exactly once per create
      expect(mocks.mockTx.$executeRaw).toHaveBeenCalledOnce();
    });

    it("creates a new client when no client.id is submitted", async () => {
      const req = makeRequest("POST", "http://localhost:3000/api/invoices", NEW_INVOICE_BODY);
      await createInvoice(req);

      expect(mocks.prisma.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Acme Corp",
            email: "billing@acme.com",
            userId: "user-1",
          }),
        })
      );
    });

    it("reuses an existing client when client.id is provided and found", async () => {
      mocks.prisma.client.findFirst.mockResolvedValue(DB_CLIENT);
      const body = {
        ...NEW_INVOICE_BODY,
        client: { ...NEW_INVOICE_BODY.client, id: "client-1" },
      };

      const req = makeRequest("POST", "http://localhost:3000/api/invoices", body);
      await createInvoice(req);

      expect(mocks.prisma.client.create).not.toHaveBeenCalled();
    });

    it("auto-increments the invoice number when a race-condition conflict is detected", async () => {
      // Simulate: another request already committed "INV-2026-07-001" inside the lock
      mocks.mockTx.invoice.findUnique.mockResolvedValue({ id: "other-inv" });
      mocks.mockTx.invoice.findFirst.mockResolvedValue({
        invoiceNumber: "INV-2026-07-001",
      });

      const req = makeRequest("POST", "http://localhost:3000/api/invoices", NEW_INVOICE_BODY);
      await createInvoice(req);

      const createCall = mocks.mockTx.invoice.create.mock.calls[0][0];
      // Must have been reassigned to a number other than the conflicted one
      expect(createCall.data.invoiceNumber).not.toBe("INV-2026-07-001");
    });

    it("returns 401 when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);
      const req = makeRequest("POST", "http://localhost:3000/api/invoices", NEW_INVOICE_BODY);
      const res = await createInvoice(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for an invalid request body", async () => {
      const req = makeRequest("POST", "http://localhost:3000/api/invoices", {
        invoiceNumber: "", // fails min(1)
      });
      const res = await createInvoice(req);
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /api/invoices/[id]/pdf ───────────────────────────────────────────

  describe("GET /api/invoices/[id]/pdf", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("generates PDF on cache miss, uploads to blob, and persists cache URL", async () => {
      mocks.prisma.invoice.findFirst.mockResolvedValue({ ...DB_INVOICE, pdfCacheUrl: null });

      const req = makeRequest("GET", "http://localhost:3000/api/invoices/inv-1/pdf");
      const res = await getInvoicePdf(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(mocks.renderToBuffer).toHaveBeenCalledOnce();
      expect(mocks.put).toHaveBeenCalledWith(
        "pdfs/inv-1.pdf",
        expect.any(Blob),
        expect.objectContaining({ access: "public", addRandomSuffix: false })
      );
      expect(mocks.prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: { pdfCacheUrl: "https://blob.test/pdfs/inv-1.pdf" },
        })
      );
    });

    it("serves from blob cache without calling renderToBuffer", async () => {
      mocks.prisma.invoice.findFirst.mockResolvedValue({
        ...DB_INVOICE,
        pdfCacheUrl: "https://blob.test/pdfs/inv-1.pdf",
      });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => Buffer.from("CACHED-PDF").buffer,
        })
      );

      const req = makeRequest("GET", "http://localhost:3000/api/invoices/inv-1/pdf");
      const res = await getInvoicePdf(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(mocks.renderToBuffer).not.toHaveBeenCalled();
    });

    it("falls through to re-render when cached URL returns a non-ok response", async () => {
      mocks.prisma.invoice.findFirst.mockResolvedValue({
        ...DB_INVOICE,
        pdfCacheUrl: "https://blob.test/pdfs/stale.pdf",
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

      const req = makeRequest("GET", "http://localhost:3000/api/invoices/inv-1/pdf");
      const res = await getInvoicePdf(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(200);
      expect(mocks.renderToBuffer).toHaveBeenCalledOnce();
    });

    it("returns 404 when invoice does not belong to the current user", async () => {
      mocks.prisma.invoice.findFirst.mockResolvedValue(null);

      const req = makeRequest("GET", "http://localhost:3000/api/invoices/inv-1/pdf");
      const res = await getInvoicePdf(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/invoices/[id]/send ─────────────────────────────────────────

  describe("POST /api/invoices/[id]/send", () => {
    const FAKE_PDF = Buffer.from("FAKE-PDF");

    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => FAKE_PDF.buffer,
        })
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("fetches PDF, sends email, and marks the invoice as SENT", async () => {
      const req = makeRequest("POST", "http://localhost:3000/api/invoices/inv-1/send");
      const res = await sendInvoice(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(200);
      expect(mocks.sendInvoiceEmail).toHaveBeenCalledOnce();
      expect(mocks.sendInvoiceEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "billing@acme.com",
          invoiceNumber: "INV-2026-07-001",
          pdfBuffer: expect.any(Buffer),
        })
      );
      expect(mocks.prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: expect.objectContaining({
            status: "SENT",
            sentAt: expect.any(Date),
          }),
        })
      );
    });

    it("forwards the session cookie to the internal PDF endpoint", async () => {
      const req = new NextRequest("http://localhost:3000/api/invoices/inv-1/send", {
        method: "POST",
        headers: { cookie: "next-auth.session-token=abc123" },
      });
      await sendInvoice(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        "http://localhost:3000/api/invoices/inv-1/pdf",
        expect.objectContaining({
          headers: expect.objectContaining({ cookie: "next-auth.session-token=abc123" }),
        })
      );
    });

    it("returns 404 when invoice is not found", async () => {
      mocks.prisma.invoice.findFirst.mockResolvedValue(null);

      const req = makeRequest("POST", "http://localhost:3000/api/invoices/inv-1/send");
      const res = await sendInvoice(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(404);
      expect(mocks.sendInvoiceEmail).not.toHaveBeenCalled();
    });

    it("returns 400 when the client has no email address", async () => {
      mocks.prisma.invoice.findFirst.mockResolvedValue({
        ...DB_INVOICE,
        client: { ...DB_CLIENT, email: null },
      });

      const req = makeRequest("POST", "http://localhost:3000/api/invoices/inv-1/send");
      const res = await sendInvoice(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(400);
    });

    it("returns 500 and does not send email when the internal PDF fetch fails", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

      const req = makeRequest("POST", "http://localhost:3000/api/invoices/inv-1/send");
      const res = await sendInvoice(req, { params: Promise.resolve({ id: "inv-1" }) });

      expect(res.status).toBe(500);
      expect(mocks.sendInvoiceEmail).not.toHaveBeenCalled();
    });
  });

  // ─── Full flow: create → PDF → send ──────────────────────────────────────

  describe("Full flow: create → PDF → send", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("creates an invoice, generates its PDF, and dispatches the email", async () => {
      // ── Step 1: Create ────────────────────────────────────────────────────
      const createReq = makeRequest("POST", "http://localhost:3000/api/invoices", NEW_INVOICE_BODY);
      const createRes = await createInvoice(createReq);

      expect(createRes.status).toBe(201);
      const { id: invoiceId } = await createRes.json() as { id: string };
      expect(invoiceId).toBe("inv-1");
      // Advisory lock was acquired exactly once
      expect(mocks.mockTx.$executeRaw).toHaveBeenCalledOnce();

      // ── Step 2: Generate PDF ──────────────────────────────────────────────
      vi.clearAllMocks();
      mocks.auth.mockResolvedValue(SESSION);
      mocks.getTemplate.mockReturnValue(() => null);
      mocks.logoToDataUrl.mockResolvedValue(null);
      mocks.renderToBuffer.mockResolvedValue(Buffer.from("FULL-FLOW-PDF"));
      mocks.put.mockResolvedValue({ url: "https://blob.test/pdfs/inv-1.pdf" });
      mocks.prisma.invoice.findFirst.mockResolvedValue({ ...DB_INVOICE, id: invoiceId, pdfCacheUrl: null });
      mocks.prisma.user.findUnique.mockResolvedValue(DB_USER);
      mocks.prisma.invoice.update.mockResolvedValue({
        ...DB_INVOICE,
        pdfCacheUrl: "https://blob.test/pdfs/inv-1.pdf",
      });

      const pdfReq = makeRequest("GET", `http://localhost:3000/api/invoices/${invoiceId}/pdf`);
      const pdfRes = await getInvoicePdf(pdfReq, {
        params: Promise.resolve({ id: invoiceId }),
      });

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers.get("Content-Type")).toBe("application/pdf");
      expect(mocks.renderToBuffer).toHaveBeenCalledOnce();
      expect(mocks.put).toHaveBeenCalledOnce(); // cached to blob

      // ── Step 3: Send email ────────────────────────────────────────────────
      vi.clearAllMocks();
      mocks.auth.mockResolvedValue(SESSION);
      mocks.sendInvoiceEmail.mockResolvedValue(undefined);
      mocks.prisma.invoice.findFirst.mockResolvedValue(DB_INVOICE);
      mocks.prisma.user.findUnique.mockResolvedValue(DB_USER);
      mocks.prisma.invoice.update.mockResolvedValue({
        ...DB_INVOICE,
        status: "SENT",
        sentAt: new Date(),
      });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => Buffer.from("FULL-FLOW-PDF").buffer,
        })
      );

      const sendReq = makeRequest("POST", `http://localhost:3000/api/invoices/${invoiceId}/send`);
      const sendRes = await sendInvoice(sendReq, {
        params: Promise.resolve({ id: invoiceId }),
      });

      expect(sendRes.status).toBe(200);
      expect(mocks.sendInvoiceEmail).toHaveBeenCalledOnce();
      expect(mocks.prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SENT" }),
        })
      );
    });
  });
});
