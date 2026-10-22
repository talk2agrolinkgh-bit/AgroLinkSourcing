// src/app/api/sourcing-desk/[id]/respond/route.ts
// The only write path an outside agent has into a SourcingRequest. Access
// is checked server-side here regardless of what the page already gated —
// routes must never trust that only the intended page could have called
// them (same principle as every admin API route in this app).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DESK_OPEN_STATUSES } from "@/lib/sourcing-desk";

const RespondSchema = z.object({ body: z.string().min(5).max(2000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const user = await db.user.findUnique({ where: { id: userId }, select: { sourcingAgentStatus: true } });
  if (user?.sourcingAgentStatus !== "APPROVED") {
    return NextResponse.json({ error: "Sourcing Desk access required" }, { status: 403 });
  }

  // Agents can only respond to requests an admin approved for the desk.
  const target = await db.sourcingRequest.findFirst({
    where: { id, deskStatus: "APPROVED", status: { in: [...DESK_OPEN_STATUSES] } },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Request not available" }, { status: 404 });

  const body = await req.json();
  const parsed = RespondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const message = await db.message.create({
    data: {
      sourcingRequestId: id,
      senderId: userId,
      body: parsed.data.body,
      channel: "agent_response",
    },
  });

  // An agent responding means this is no longer sitting untouched — but
  // don't override anything past that stage; admin may already be deep
  // into negotiation and a new response shouldn't reset their pipeline.
  await db.sourcingRequest.updateMany({
    where: { id, status: "NEW" },
    data: { status: "SOURCING" },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
