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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.catalogItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      unitPrice: Number(item.unitPrice),
      unit: item.unit,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = catalogSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const item = await prisma.catalogItem.create({
    data: {
      userId: session.user.id,
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
