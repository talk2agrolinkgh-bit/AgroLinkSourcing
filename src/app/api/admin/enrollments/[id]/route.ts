// src/app/api/admin/enrollments/[id]/route.ts
// Admin sets an enrollment's status. Marking it "completed" is what makes a
// student eligible to apply for the Sourcing Desk (see src/lib/sourcing-desk.ts).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED = ["pending", "active", "completed", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const enrollment = await db.enrollment.update({ where: { id }, data: { status } });
  return NextResponse.json(enrollment);
}
