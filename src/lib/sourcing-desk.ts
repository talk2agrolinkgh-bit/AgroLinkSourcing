// src/lib/sourcing-desk.ts
// Access control for the "Sourcing Desk" — the page where approved,
// trained agents view live sourcing requests and respond to them.
//
// This is deliberately a separate permission from `role`. Completing the
// Produce-Sourcing Academy makes someone *eligible to apply*, but doesn't
// grant access by itself — an admin has to explicitly approve the
// application (src/app/admin/(dashboard)/sourcing-agents). A self-reported
// "I finished the course" claim isn't enough to hand someone buyer contact
// details and live sourcing data.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type SourcingDeskAccess =
  | { status: "SIGNED_OUT" }
  | { status: "NONE"; userId: string }
  | { status: "PENDING"; userId: string }
  | { status: "REVOKED"; userId: string }
  | { status: "APPROVED"; userId: string };

export async function getSourcingDeskAccess(): Promise<SourcingDeskAccess> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "ADMIN") return { status: "SIGNED_OUT" };

  const userId = (session.user as any).id as string;
  const user = await db.user.findUnique({ where: { id: userId }, select: { sourcingAgentStatus: true } });
  if (!user) return { status: "SIGNED_OUT" };

  return { status: user.sourcingAgentStatus, userId } as SourcingDeskAccess;
}

// "Graduated" = an admin has marked one of the user's Academy enrollments as
// completed (Admin → Academy → Enrollments). Self-reporting isn't enough.
export async function hasGraduated(userId: string) {
  const count = await db.enrollment.count({
    where: { userId, status: { equals: "completed", mode: "insensitive" } },
  });
  return count > 0;
}

export const DESK_OPEN_STATUSES = ["NEW", "CONTACTED", "SOURCING"] as const;
