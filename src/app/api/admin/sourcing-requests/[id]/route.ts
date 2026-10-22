// src/app/api/admin/sourcing-requests/[id]/route.ts
// Powers the kanban stage changes (dropdown or drag-and-drop) on the admin board.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, deskStatus } = await req.json(); // status: SourcingRequestStatus, deskStatus: DeskReviewStatus
  const STATUSES = ["NEW", "CONTACTED", "SOURCING", "MATCHED", "NEGOTIATION", "CLOSED", "CANCELLED"];
  const DESK = ["PENDING_REVIEW", "APPROVED", "REJECTED"];
  if ((status && !STATUSES.includes(status)) || (deskStatus && !DESK.includes(deskStatus))) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }
  const request = await db.sourcingRequest.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(deskStatus && { deskStatus, deskReviewedAt: new Date() }),
    },
  });
  return NextResponse.json(request);
}
