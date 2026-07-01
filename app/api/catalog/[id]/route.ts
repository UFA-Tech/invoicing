import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const catalogSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.number().min(0),
  unit: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = catalogSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const existing = await prisma.catalogItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.catalogItem.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      unitPrice: parsed.data.unitPrice,
      unit: parsed.data.unit || null,
    },
  });

  return NextResponse.json({
    id: item.id,
    name: item.name,
    description: item.description,
    unitPrice: Number(item.unitPrice),
    unit: item.unit,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.catalogItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.catalogItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
