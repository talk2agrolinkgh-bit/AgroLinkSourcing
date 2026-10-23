// src/app/api/admin/farm-projects/[id]/route.ts
// Stage and payment-model edits apply immediately. PUBLISHING a project goes
// through the approval gate; unpublishing applies immediately.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, releaseChange, outcomeResponse } from "@/lib/approvals";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json(); // { stage?, paymentModel?, published? }
  let project = await db.farmProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const immediate = {
    ...(body.stage && { stage: body.stage }),
    ...(body.paymentModel && { paymentModel: body.paymentModel }),
    ...(body.published === false && { published: false }),
  };
  if (Object.keys(immediate).length > 0) {
    project = await db.farmProject.update({ where: { id }, data: immediate });
  }

  if (body.published === true) {
    const outcome = await releaseChange({
      gate: "FARM",
      actor,
      change: { type: "farm.update", id, data: { published: true } },
      summary: `Farm project "${project.name}": publish`,
    });
    return outcomeResponse(outcome, NextResponse);
  }

  return NextResponse.json(project);
}
