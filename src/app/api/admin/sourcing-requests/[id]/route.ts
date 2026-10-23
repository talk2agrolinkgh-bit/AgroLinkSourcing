// src/app/api/admin/sourcing-requests/[id]/route.ts
// Powers the kanban stage changes and the Sourcing Desk review buttons.
// Pipeline stage changes apply immediately. APPROVING a request for the desk
// goes through the approval gate; rejecting/pulling it applies immediately.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, releaseChange, outcomeResponse } from "@/lib/approvals";

const STATUSES = ["NEW", "CONTACTED", "SOURCING", "MATCHED", "NEGOTIATION", "CLOSED", "CANCELLED"];
const DESK = ["PENDING_REVIEW", "APPROVED", "REJECTED"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, deskStatus } = await req.json();
  if ((status && !STATUSES.includes(status)) || (deskStatus && !DESK.includes(deskStatus))) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  let request = await db.sourcingRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status) request = await db.sourcingRequest.update({ where: { id }, data: { status } });

  if (deskStatus) {
    const outcome = await releaseChange({
      gate: "DESK_REQUEST",
      actor,
      restricting: deskStatus !== "APPROVED",
      change: { type: "desk.setRequest", id, deskStatus },
      summary: `Sourcing request "${request.product}" (${request.quantity} → ${request.destination}): ${deskStatus === "APPROVED" ? "approve for Sourcing Desk" : deskStatus.toLowerCase().replace("_", " ")}`,
    });
    return outcomeResponse(outcome, NextResponse);
  }

  return NextResponse.json(request);
}
