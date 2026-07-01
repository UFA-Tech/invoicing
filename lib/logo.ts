import path from "path";

/**
 * Returns a base64 data URL for the logo, regardless of whether it's stored
 * as a Vercel Blob URL (production) or a legacy local path (local dev).
 */
export async function logoToDataUrl(logoUrl: string): Promise<string | null> {
  try {
    const ext = path.extname(logoUrl).slice(1).toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";

    let buffer: Buffer;

    if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      // Cloud URL (Vercel Blob)
      const res = await fetch(logoUrl);
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Legacy local path e.g. /uploads/logos/file.png
      const { readFileSync } = await import("fs");
      buffer = readFileSync(path.join(process.cwd(), "public", logoUrl));
    }

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
