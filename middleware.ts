import { NextRequest, NextResponse } from "next/server";

// In-memory sliding window rate limiter.
// State lives per-isolate on Vercel Edge — suitable for burst protection on a
// single instance. For multi-region enforcement, swap for Upstash Redis.
const windowMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

function allow(key: string, max: number): boolean {
  const now = Date.now();
  const entry = windowMap.get(key);
  if (!entry || now > entry.resetAt) {
    windowMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function ip(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function tooMany(): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi dalam 1 menit." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const clientIp = ip(request);

  // Email send: 5 per minute per IP (expensive — triggers Resend + PDF fetch)
  if (method === "POST" && /^\/api\/invoices\/[^/]+\/send$/.test(pathname)) {
    if (!allow(`send:${clientIp}`, 5)) return tooMany();
  }

  // Authenticated PDF: 20 per minute per IP (heavy renderToBuffer)
  if (method === "GET" && /^\/api\/invoices\/[^/]+\/pdf$/.test(pathname)) {
    if (!allow(`pdf:${clientIp}`, 20)) return tooMany();
  }

  // Public PDF: 30 per minute per IP (unauthenticated — highest abuse risk)
  if (/^\/api\/invoices\/public\/[^/]+\/pdf$/.test(pathname)) {
    if (!allow(`pdf-pub:${clientIp}`, 30)) return tooMany();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/invoices/:id/send",
    "/api/invoices/:id/pdf",
    "/api/invoices/public/:token/pdf",
  ],
};
