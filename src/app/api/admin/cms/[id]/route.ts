// src/app/api/admin/cms/[id]/route.ts
// Homepage text goes live to everyone, so edits go through the CMS gate.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, releaseChange, outcomeResponse } from "@/lib/approvals";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { value } = await req.json();
  const block = await db.siteContent.findUnique({ where: { id }, select: { label: true } });
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const outcome = await releaseChange({
    gate: "CMS",
    actor,
    change: { type: "cms.update", id, value: String(value ?? "") },
    summary: `Homepage text "${block.label}": ${String(value ?? "").slice(0, 80) || "(blank)"}`,
  });
  return outcomeResponse(outcome, NextResponse);
}
