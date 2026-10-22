// src/lib/roles.ts
// Auto-elevates a signed-in user's role the first time they take an action
// that clearly signals what they're using AgroLink for. Deliberately
// simple: role only ever moves off VISITOR once, automatically. After that,
// changing someone's role is a manual admin decision — we never flip a
// SUPPLIER to BUYER just because they also submitted a sourcing request,
// and we never re-run elevation logic against a role that's already set.
//
// Triggers wired in:
//   BUYER    — submitting a sourcing request or a product inquiry
//   FARMER   — requesting participation in a Farm For You project
//   ACADEMY_STUDENT — expressing interest in an Academy course (enroll click)
//   SUPPLIER — deliberately NOT automatic on submission; a self-reported
//              "I'm a supplier" claim isn't worth much. It elevates only
//              when an admin actually verifies one of their listings — see
//              the PATCH handler in api/admin/suppliers/[id]/route.ts.

import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export async function elevateRoleIfVisitor(userId: string | undefined | null, role: Exclude<UserRole, "VISITOR" | "ADMIN">) {
  if (!userId) return;
  // Single conditional update (not read-then-write) — avoids a race between
  // two elevation triggers firing for the same brand-new user at once.
  await db.user.updateMany({
    where: { id: userId, role: "VISITOR" },
    data: { role },
  });
}
