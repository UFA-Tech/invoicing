import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientManager } from "@/components/clients/ClientManager";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Data Klien"
        description="Kelola daftar klien untuk digunakan kembali saat membuat invoice"
      />
      <ClientManager initialClients={clients} />
    </div>
  );
}
