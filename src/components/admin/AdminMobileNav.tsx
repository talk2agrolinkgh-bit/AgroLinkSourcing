// src/components/admin/AdminMobileNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutGrid, Package, Truck, Inbox, Leaf, BookOpen, Flag, LayoutTemplate, ShieldCheck, CheckCircle2, Users } from "lucide-react";

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

export function AdminMobileNav({ isSuper, pending }: { isSuper: boolean; pending: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-forest-900 text-cream-50">
      <div className="h-14 flex items-center justify-between px-4">
        <span className="font-display font-semibold">AgroLink Admin</span>
        <button onClick={() => setOpen(!open)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-cream-50/10">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="px-3 pb-3 space-y-1">
          {NAV.filter((n: any) => !n.superOnly || isSuper).map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium ${
                  active ? "bg-gold-600 text-cream-50" : "text-cream-100/80 hover:bg-cream-50/10"
                }`}
              >
                <Icon size={18} /> {label}
                {href === "/admin/approvals" && pending > 0 && (
                  <span className="ml-auto text-[11px] font-semibold bg-gold-600 text-cream-50 rounded-full px-2 py-0.5">{pending}</span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
