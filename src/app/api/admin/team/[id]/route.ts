// src/app/api/admin/team/[id]/route.ts — Super Admin changes another admin's role, suspension or password.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminActor } from "@/lib/approvals";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor || actor.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin only" }, { status: 403 });

  const { role, active, password } = await req.json();

  // You can't change your own role or suspend yourself — that guarantees at
  // least one active Super Admin always exists.
  if (id === actor.id && (role !== undefined || active !== undefined)) {
    return NextResponse.json({ error: "You can't change your own role or suspend yourself." }, { status: 400 });
  }
  if (password !== undefined && String(password).length < 12) {
    return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
  }
  if (role !== undefined && !["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const admin = await db.adminUser.update({
    where: { id },
    data: {
      ...(role !== undefined && { role }),
      ...(active !== undefined && { active: !!active }),
      ...(password !== undefined && { passwordHash: await bcrypt.hash(String(password), 10) }),
    },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  return NextResponse.json(admin);
}
