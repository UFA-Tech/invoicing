import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

async function saveFile(file: File, filename: string): Promise<string> {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, file, { access: "public" });
    return blob.url;
  }
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const dir = path.join(process.cwd(), "public", "uploads", "logos");
  await mkdir(dir, { recursive: true });
  const localPath = `/uploads/logos/${path.basename(filename)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), "public", localPath), buffer);
  return localPath;
}

async function deleteFile(url: string): Promise<void> {
  if (url.startsWith("https://")) {
    if (USE_BLOB) {
      const { del } = await import("@vercel/blob");
      await del(url).catch(() => {});
    }
  } else {
    const { unlink } = await import("fs/promises");
    const path = await import("path");
    await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const filename = `logos/${session.user.id}-${Date.now()}.${ext}`;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logoUrl: true },
    });
    if (user?.logoUrl) {
      await deleteFile(user.logoUrl);
    }

    const logoUrl = await saveFile(file, filename);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { logoUrl },
    });

    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logoUrl: true },
    });
    if (user?.logoUrl) {
      await deleteFile(user.logoUrl);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { logoUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus logo" }, { status: 500 });
  }
}
