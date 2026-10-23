// src/app/admin/(dashboard)/team/page.tsx — Super Admin only.
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { getAdminActor } from "@/lib/approvals";
import { TeamManager } from "@/components/admin/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const actor = await getAdminActor();
  if (!actor || actor.role !== "SUPER_ADMIN") redirect("/admin");

  const admins = await db.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader eyebrow="Governance" title="Team" action={<span className="text-xs text-ink-soft self-center">Add admins, change roles, suspend access</span>} />
      <TeamManager selfId={actor!.id} initialAdmins={JSON.parse(JSON.stringify(admins))} />
    </>
  );
}
