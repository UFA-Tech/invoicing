import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";

export async function OnboardingBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { businessName: true },
  });

  if (user?.businessName) return null;

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 shrink-0">
      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        <span className="font-semibold">Lengkapi profil bisnis Anda.</span>{" "}
        Invoice PDF masih menggunakan placeholder. Atur nama bisnis dan detail lainnya di{" "}
        <Link href="/settings" className="underline font-medium hover:text-amber-900">
          Pengaturan
        </Link>
        .
      </p>
    </div>
  );
}
