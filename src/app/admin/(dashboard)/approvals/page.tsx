// src/app/admin/(dashboard)/approvals/page.tsx
// Super Admin: final-approval queue + on/off switches for each gate.
// Admin: read-only view of their own requests and where they stand.

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { getAdminActor, GATES } from "@/lib/approvals";
import { ApprovalsPanel } from "@/components/admin/ApprovalsPanel";
import { GateToggles } from "@/components/admin/GateToggles";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const actor = await getAdminActor();
  if (!actor) redirect("/admin/login");
  const isSuper = actor!.role === "SUPER_ADMIN";
  const mine = isSuper ? {} : { requestedById: actor!.id };

  const [pending, recent, settings] = await Promise.all([
    db.approvalRequest.findMany({ where: { status: "PENDING", ...mine }, orderBy: { createdAt: "asc" } }),
    db.approvalRequest.findMany({ where: { status: { not: "PENDING" }, ...mine }, orderBy: { decidedAt: "desc" }, take: 30 }),
    db.approvalSetting.findMany(),
  ]);

  const enabled = Object.fromEntries(Object.keys(GATES).map((k) => [k, settings.find((s) => s.key === k)?.enabled ?? true]));

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Approvals"
        action={<span className="text-xs text-ink-soft self-center">{isSuper ? "Nothing in a switched-on category goes live until you approve it" : "Your requests waiting for the Super Admin"}</span>}
      />
      {isSuper && <GateToggles initial={enabled} />}
      <ApprovalsPanel
        isSuper={isSuper}
        pending={JSON.parse(JSON.stringify(pending))}
        recent={JSON.parse(JSON.stringify(recent))}
      />
    </>
  );
}
