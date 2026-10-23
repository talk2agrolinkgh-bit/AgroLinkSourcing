// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid, Package, Truck, Inbox, Leaf, BookOpen, Flag, LayoutTemplate, LogOut, ShieldCheck, CheckCircle2, Users,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { href: "/admin/sourcing-requests", label: "Sourcing Requests", icon: Inbox },
  { href: "/admin/sourcing-agents", label: "Sourcing Desk Access", icon: ShieldCheck },
  { href: "/admin/farm-projects", label: "Farm Projects", icon: Leaf },
  { href: "/admin/academy", label: "Academy", icon: BookOpen },
  { href: "/admin/leads", label: "Leads", icon: Flag },
  { href: "/admin/cms", label: "CMS", icon: LayoutTemplate },
  { href: "/admin/approvals", label: "Approvals", icon: CheckCircle2 },
  { href: "/admin/team", label: "Team", icon: Users, superOnly: true },
];

export function AdminSidebar({ adminName, isSuper, pending }: { adminName: string; isSuper: boolean; pending: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-forest-900 text-cream-50 z-30">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-cream-50/10 shrink-0">
        <Image src="/logo-mark.png" alt="AgroLink" width={28} height={28} className="w-7 h-7" />
        <span className="font-display font-semibold">
          AgroLink <span className="text-gold-300 font-normal">Admin</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.filter((n: any) => !n.superOnly || isSuper).map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition ${
                active ? "bg-gold-600 text-cream-50 font-semibold" : "text-cream-100/80 hover:bg-cream-50/10"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {label}
              {href === "/admin/approvals" && pending > 0 && (
                <span className="ml-auto text-[11px] font-semibold bg-gold-600 text-cream-50 rounded-full px-2 py-0.5">{pending}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cream-50/10 text-xs text-cream-100/60">
        Signed in as <span className="text-cream-50 font-medium">{adminName}</span>
        <br />
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="mt-2 inline-flex items-center gap-1.5 text-cream-100/70 hover:text-cream-50"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
