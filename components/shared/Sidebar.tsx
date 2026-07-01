"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  ChevronRight,
  Package,
  Users,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/analytics", label: "Analitik", icon: BarChart2 },
  { href: "/clients", label: "Klien", icon: Users },
  { href: "/catalog", label: "Katalog", icon: Package },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-slate-900 text-white shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">UFA</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <p className="text-xs text-slate-600 px-3">v1.0.0</p>
      </div>
    </aside>
  );
}
