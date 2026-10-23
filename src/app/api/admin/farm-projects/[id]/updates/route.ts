// src/app/api/admin/farm-projects/[id]/updates/route.ts
// Powers the "Post Update" modal. Updates are shown to the public and to
// participants, so posting goes through the approval gate (FARM).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, releaseChange, outcomeResponse } from "@/lib/approvals";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json(); // { title, body, photoUrls?, videoUrls?, notify? }
  if (!body.title || !body.body) return NextResponse.json({ error: "Title and body are required" }, { status: 400 });

  const project = await db.farmProject.findUnique({ where: { id }, select: { name: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const outcome = await releaseChange({
    gate: "FARM",
    actor,
    change: {
      type: "farm.postUpdate",
      farmProjectId: id,
      data: {
        title: String(body.title),
        body: String(body.body),
        photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
        videoUrls: Array.isArray(body.videoUrls) ? body.videoUrls : [],
      },
    },
    summary: `Farm update on "${project.name}": ${String(body.title)}`,
  });

  if (outcome.applied && body.notify) {
    // TODO (production): fetch FarmParticipant emails/whatsapp for this project
    // and send via your notification provider (email + WhatsApp Business API).
  }

  return outcome.applied
    ? NextResponse.json(outcome.result, { status: 201 })
    : NextResponse.json({ pending: true, approvalId: outcome.approvalId }, { status: 202 });
}
