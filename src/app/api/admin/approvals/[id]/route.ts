// src/app/api/admin/approvals/[id]/route.ts — Super Admin approves or rejects a queued change.
import { NextRequest, NextResponse } from "next/server";
import { getAdminActor, decideApproval } from "@/lib/approvals";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor || actor.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin only" }, { status: 403 });

  const { decision, note } = await req.json();
  if (!["APPROVED", "REJECTED"].includes(decision)) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

  try {
    await decideApproval(id, decision, actor, typeof note === "string" ? note : undefined);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not apply this change" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
