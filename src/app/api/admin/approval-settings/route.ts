// src/app/api/admin/approval-settings/route.ts — Super Admin switches an approval gate on or off.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, GATES } from "@/lib/approvals";

export async function PATCH(req: NextRequest) {
  const actor = await getAdminActor();
  if (!actor || actor.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin only" }, { status: 403 });

  const { key, enabled } = await req.json();
  if (!(key in GATES) || typeof enabled !== "boolean") return NextResponse.json({ error: "Invalid setting" }, { status: 400 });

  const row = await db.approvalSetting.upsert({
    where: { key },
    update: { enabled, updatedBy: actor.email },
    create: { key, enabled, updatedBy: actor.email },
  });
  return NextResponse.json(row);
}
