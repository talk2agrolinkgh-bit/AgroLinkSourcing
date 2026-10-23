// src/app/api/admin/suppliers/[id]/route.ts
// Every status change is written to VerificationRecord as an audit trail —
// "who verified this supplier and when" matters for a trust-driven platform.
// Verifying a supplier is also the one point where SUPPLIER role elevation
// happens (see src/lib/roles.ts). VERIFYING goes through the approval gate;
// suspending/rejecting applies immediately. See src/lib/approvals.ts.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, releaseChange, outcomeResponse } from "@/lib/approvals";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, notes } = await req.json(); // "VERIFIED" | "PENDING" | "UNVERIFIED"
  if (!["VERIFIED", "PENDING", "UNVERIFIED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supplier = await db.supplier.findUnique({ where: { id }, select: { businessName: true } });
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const outcome = await releaseChange({
    gate: "SUPPLIER",
    actor,
    restricting: status !== "VERIFIED",
    change: { type: "supplier.setStatus", id, status, notes, reviewedBy: actor.id },
    summary: `Supplier "${supplier.businessName}": ${status === "VERIFIED" ? "verify" : status.toLowerCase()}`,
  });
  return outcomeResponse(outcome, NextResponse);
}
