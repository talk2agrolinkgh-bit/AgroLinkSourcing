// src/app/admin/layout.tsx
// Every route under /admin passes through here first. This is the single
// place role-gating happens — individual admin pages never need to repeat
// the auth check themselves.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAdminActor } from "@/lib/approvals";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { Toaster } from "@/components/admin/Toaster";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!isAdminSession(session)) {
    redirect("/admin/login");
  }

  // Re-read the admin from the database so a suspended admin is locked out
  // of every page immediately, and so the nav reflects their live role.
  const actor = await getAdminActor();
  if (!actor) redirect("/admin/login");
  const isSuper = actor!.role === "SUPER_ADMIN";
  const pending = isSuper ? await db.approvalRequest.count({ where: { status: "PENDING" } }) : 0;

  return (
    <div className="lg:pl-64 min-h-screen bg-cream">
      <div className="bg-gold-600 text-cream-50 text-xs font-semibold text-center py-1.5 px-3">
        AgroLink Admin{isSuper ? " · Super Admin" : ""}
      </div>

      <AdminSidebar adminName={actor!.name || "Admin"} isSuper={isSuper} pending={pending} />
      <AdminMobileNav isSuper={isSuper} pending={pending} />

      <Toaster>
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">{children}</main>
      </Toaster>
    </div>
  );
}
