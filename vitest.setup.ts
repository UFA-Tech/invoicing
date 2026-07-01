// Set required env vars before any module loads.
// lib/env.ts runs Zod validation at import time; these values satisfy all required fields.
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.NEXTAUTH_SECRET = "test-secret-for-vitest-must-be-nonempty";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.RESEND_API_KEY = "re_test_key_vitest";
