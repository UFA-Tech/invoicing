import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { CatalogManager } from "@/components/catalog/CatalogManager";

export default async function CatalogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await prisma.catalogItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

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
      <CatalogManager initialItems={catalogItems} />
    </div>
  );
}
