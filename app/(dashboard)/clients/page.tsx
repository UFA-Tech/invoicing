import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientManager } from "@/components/clients/ClientManager";

const LIMIT = 20;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const skip = (page - 1) * LIMIT;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
      skip,
      take: LIMIT,
    }),
    prisma.client.count({ where: { userId: session.user.id } }),
  ]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <PageHeader
        title="Data Klien"
        description="Kelola daftar klien untuk digunakan kembali saat membuat invoice"
      />
      <ClientManager
        initialClients={clients}
        pagination={{ page, pages, total }}
      />
    </div>
  );
}
