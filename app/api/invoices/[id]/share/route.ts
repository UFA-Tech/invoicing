import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, publicToken: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = invoice.publicToken ?? randomUUID();

  if (!invoice.publicToken) {
    await prisma.invoice.update({
      where: { id },
      data: { publicToken: token },
    });
  }

  return NextResponse.json({ token });
}
