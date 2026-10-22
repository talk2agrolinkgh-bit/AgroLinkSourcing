// src/app/api/academy-enrollments/route.ts
// Fired when someone clicks "Enroll via WhatsApp" on the Academy page. It
// records interest (a Lead either way, plus a real Enrollment row if the
// person is signed in) before handing off to WhatsApp — enrollment itself
// still happens through a real conversation, not a payment flow, matching
// how Contract Command actually operates today.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { elevateRoleIfVisitor } from "@/lib/roles";

const EnrollSchema = z.object({
  tier: z.enum(["MENTORSHIP_TRAINING", "VIDEO_ONLY"]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = EnrollSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { tier } = parsed.data;

  const session = await getServerSession(authOptions);
  const userId = session?.user && session.user.role !== "ADMIN" ? (session.user as any).id : undefined;

  if (userId) {
    const course = await db.academyCourse.findUnique({ where: { slug: "produce-sourcing-academy" } });
    if (course) {
      const existing = await db.enrollment.findFirst({ where: { userId, courseId: course.id } });
      if (!existing) {
        await db.enrollment.create({
          data: { userId, courseId: course.id, tier, status: "pending" },
        });
      }
    }
    await elevateRoleIfVisitor(userId, "STUDENT");
  }

  await db.lead.create({
    data: {
      source: "ACADEMY_ENROLLMENT",
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? null,
      payload: { tier } as any,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
