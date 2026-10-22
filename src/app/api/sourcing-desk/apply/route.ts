// src/app/api/sourcing-desk/apply/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasGraduated } from "@/lib/sourcing-desk";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  // Only Academy graduates (enrollment marked completed by an admin) may apply.
  if (!(await hasGraduated(userId))) {
    return NextResponse.json({ error: "NOT_GRADUATED" }, { status: 403 });
  }

  // Only move NONE -> PENDING. Doesn't touch REVOKED (an admin revoked
  // access for a reason; re-applying shouldn't silently undo that) or
  // APPROVED/PENDING (already applied).
  const user = await db.user.updateMany({
    where: { id: userId, sourcingAgentStatus: "NONE" },
    data: { sourcingAgentStatus: "PENDING", sourcingAgentAppliedAt: new Date() },
  });

  if (user.count === 0) {
    const current = await db.user.findUnique({ where: { id: userId }, select: { sourcingAgentStatus: true } });
    return NextResponse.json({ status: current?.sourcingAgentStatus ?? "NONE" });
  }

  return NextResponse.json({ status: "PENDING" }, { status: 201 });
}
