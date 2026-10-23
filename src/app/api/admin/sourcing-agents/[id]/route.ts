// src/app/api/admin/sourcing-agents/[id]/route.ts
// Granting Sourcing Desk access goes through the approval gate; revoking or
// moving back to pending applies immediately.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, releaseChange, outcomeResponse } from "@/lib/approvals";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json(); // "APPROVED" | "REVOKED" | "PENDING"
  if (!["APPROVED", "REVOKED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id }, select: { name: true, email: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const outcome = await releaseChange({
    gate: "DESK_AGENT",
    actor,
    restricting: status !== "APPROVED",
    change: { type: "desk.setAgent", id, status },
    summary: `Sourcing Desk access for ${user.name || user.email}: ${status === "APPROVED" ? "grant" : status.toLowerCase()}`,
  });
  return outcomeResponse(outcome, NextResponse);
}
