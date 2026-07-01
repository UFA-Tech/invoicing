import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { CatalogManager } from "@/components/catalog/CatalogManager";

const LIMIT = 24;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const skip = (page - 1) * LIMIT;

  const [items, total] = await Promise.all([
    prisma.catalogItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: LIMIT,
    }),
    prisma.catalogItem.count({ where: { userId: session.user.id } }),
  ]);

  const pages = Math.ceil(total / LIMIT);

  const catalogItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    unitPrice: Number(item.unitPrice),
    unit: item.unit,
  }));

  return (
    <div>
      <PageHeader
        title="Katalog Item"
        description="Simpan produk atau jasa yang sering digunakan untuk mempercepat pembuatan invoice"
      />
      <CatalogManager
        initialItems={catalogItems}
        pagination={{ page, pages, total }}
      />
    </div>
  );
}
