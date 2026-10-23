// src/lib/approvals.ts
// "Two-key" approval system. Admins prepare work; a Super Admin gives final
// approval for anything that would go live to the public or grant access.
//
// Rule of thumb: changes that RELEASE something (publish, verify, feature,
// approve, post) are gated. Changes that RESTRICT (unpublish, suspend, reject,
// revoke) always apply immediately — pulling something down never needs
// permission. Each gate can be switched off by the Super Admin
// (Admin -> Approvals); when off, admins release changes directly.

import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { elevateRoleIfVisitor } from "@/lib/roles";

export const GATES = {
  PRODUCT: { label: "Products", help: "Publishing, verifying or featuring a product" },
  SUPPLIER: { label: "Suppliers", help: "Verifying a supplier" },
  DESK_REQUEST: { label: "Sourcing Desk requests", help: "Approving a sourcing request for the desk" },
  DESK_AGENT: { label: "Sourcing Desk agents", help: "Approving an agent's desk access" },
  FARM: { label: "Farm projects", help: "Publishing a farm project or posting a farm update" },
  CMS: { label: "Homepage / CMS", help: "Any change to homepage text going live" },
} as const;
export type GateKey = keyof typeof GATES;

export type Change =
  | { type: "product.update"; id: string; data: { status?: string; published?: boolean; featured?: boolean } }
  | { type: "supplier.setStatus"; id: string; status: string; notes?: string; reviewedBy: string }
  | { type: "desk.setRequest"; id: string; deskStatus: string }
  | { type: "desk.setAgent"; id: string; status: string }
  | { type: "farm.update"; id: string; data: { published?: boolean } }
  | { type: "farm.postUpdate"; farmProjectId: string; data: { title: string; body: string; photoUrls: string[]; videoUrls: string[] } }
  | { type: "cms.update"; id: string; value: string };

export type AdminActor = { id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN" };

/** The signed-in admin, re-read from the database (never trusted from the token). */
export async function getAdminActor(): Promise<AdminActor | null> {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return null;
  const id = (session!.user as any).id as string;
  const admin = await db.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  if (!admin || !admin.active) return null;
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export async function isGateEnabled(gate: GateKey) {
  const row = await db.approvalSetting.findUnique({ where: { key: gate } });
  return row ? row.enabled : true; // no row = gate on
}

/** Actually performs a change. Used for direct applies and for approved requests. */
export async function executeChange(c: Change): Promise<any> {
  switch (c.type) {
    case "product.update":
      return db.product.update({ where: { id: c.id }, data: c.data as any });
    case "supplier.setStatus": {
      const [supplier] = await db.$transaction([
        db.supplier.update({ where: { id: c.id }, data: { status: c.status as any } }),
        db.verificationRecord.create({
          data: { supplierId: c.id, outcome: c.status as any, notes: c.notes, reviewedBy: c.reviewedBy },
        }),
      ]);
      if (c.status === "VERIFIED") await elevateRoleIfVisitor(supplier.userId, "SUPPLIER");
      return supplier;
    }
    case "desk.setRequest":
      return db.sourcingRequest.update({
        where: { id: c.id },
        data: { deskStatus: c.deskStatus as any, deskReviewedAt: new Date() },
      });
    case "desk.setAgent":
      return db.user.update({
        where: { id: c.id },
        data: {
          sourcingAgentStatus: c.status as any,
          ...(c.status === "APPROVED" && { sourcingAgentApprovedAt: new Date() }),
        },
      });
    case "farm.update":
      return db.farmProject.update({ where: { id: c.id }, data: c.data as any });
    case "farm.postUpdate":
      return db.farmUpdate.create({ data: { farmProjectId: c.farmProjectId, ...c.data } });
    case "cms.update":
      return db.siteContent.update({ where: { id: c.id }, data: { value: c.value } });
  }
}

export type Outcome = { applied: true; result: any } | { applied: false; approvalId: string };

/**
 * Applies the change now, or queues it for a Super Admin.
 * - restricting=true (unpublish/suspend/reject/revoke) always applies now.
 * - Super admins always apply directly.
 * - If the gate is switched off, admins apply directly.
 */
export async function releaseChange(opts: {
  gate: GateKey;
  change: Change;
  summary: string;
  actor: AdminActor;
  restricting?: boolean;
}): Promise<Outcome> {
  const { gate, change, summary, actor, restricting } = opts;

  if (restricting || actor.role === "SUPER_ADMIN" || !(await isGateEnabled(gate))) {
    return { applied: true, result: await executeChange(change) };
  }

  // Don't stack duplicates if the same admin clicks twice.
  const existing = await db.approvalRequest.findMany({
    where: { gate, type: change.type, status: "PENDING", requestedById: actor.id },
  });
  const payload = JSON.stringify(change);
  const dupe = existing.find((r) => JSON.stringify(r.payload) === payload);
  if (dupe) return { applied: false, approvalId: dupe.id };

  const created = await db.approvalRequest.create({
    data: {
      gate,
      type: change.type,
      summary,
      payload: change as any,
      requestedById: actor.id,
      requestedByName: actor.name || actor.email,
    },
  });
  return { applied: false, approvalId: created.id };
}

/** Standard JSON response for routes: 200 when applied, 202 when queued. */
export function outcomeResponse(outcome: Outcome, NextResponse: typeof import("next/server").NextResponse) {
  return outcome.applied
    ? NextResponse.json(outcome.result)
    : NextResponse.json({ pending: true, approvalId: outcome.approvalId }, { status: 202 });
}

/** Super admin decision. APPROVED executes the stored change. */
export async function decideApproval(id: string, decision: "APPROVED" | "REJECTED", actor: AdminActor, note?: string) {
  if (actor.role !== "SUPER_ADMIN") throw new Error("Only a Super Admin can decide approvals.");

  // Claim first so two clicks can't execute the change twice.
  const claimed = await db.approvalRequest.updateMany({
    where: { id, status: "PENDING" },
    data: { status: decision, decidedByName: actor.name || actor.email, decidedAt: new Date(), note: note || null },
  });
  if (claimed.count === 0) throw new Error("This request was already decided.");

  if (decision === "APPROVED") {
    const req = await db.approvalRequest.findUnique({ where: { id } });
    try {
      await executeChange(req!.payload as any);
    } catch (e) {
      await db.approvalRequest.update({ where: { id }, data: { status: "PENDING", decidedByName: null, decidedAt: null } });
      throw e;
    }
  }
}
