import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["markPaid", "delete"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const { ids, action } = parsed.data;
  const userId = session.user.id;

  // Verify all IDs belong to the user
  const count = await prisma.invoice.count({ where: { id: { in: ids }, userId } });
  if (count !== ids.length) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "markPaid") {
    await prisma.invoice.updateMany({
      where: { id: { in: ids }, userId },
      data: { status: "PAID", paidAt: new Date() },
    });
    return NextResponse.json({ updated: ids.length });
  }

  if (action === "delete") {
    await prisma.invoice.deleteMany({ where: { id: { in: ids }, userId } });
    return NextResponse.json({ deleted: ids.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
