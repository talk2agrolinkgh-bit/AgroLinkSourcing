// src/app/api/admin/team/route.ts — Super Admin creates another admin.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminActor } from "@/lib/approvals";

export async function POST(req: NextRequest) {
  const actor = await getAdminActor();
  if (!actor || actor.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin only" }, { status: 403 });

  const { email, name, password, role } = await req.json();
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (!name || String(name).trim().length < 2) return NextResponse.json({ error: "Enter a name." }, { status: 400 });
  if (!password || String(password).length < 12) return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });

  if (await db.adminUser.findUnique({ where: { email: cleanEmail } })) {
    return NextResponse.json({ error: "An admin with that email already exists." }, { status: 409 });
  }

  const admin = await db.adminUser.create({
    data: {
      email: cleanEmail,
      name: String(name).trim(),
      passwordHash: await bcrypt.hash(String(password), 10),
      role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
    },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  return NextResponse.json(admin, { status: 201 });
}
