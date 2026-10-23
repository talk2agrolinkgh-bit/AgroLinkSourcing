// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminActor, releaseChange, outcomeResponse } from "@/lib/approvals";

const STATUSES = ["VERIFIED", "PENDING", "UNVERIFIED"];

// PATCH — verification status, publish/unpublish, feature toggle, field edits.
// Releasing a product (verify / publish / feature) goes through the approval
// gate; restricting it (unverify / unpublish / unfeature) and plain field
// edits apply immediately. See src/lib/approvals.ts.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const releasing: { status?: string; published?: boolean; featured?: boolean } = {};
  const restricting: { status?: string; published?: boolean; featured?: boolean } = {};
  if (body.status) (body.status === "VERIFIED" ? releasing : restricting).status = body.status;
  if (body.published !== undefined) (body.published ? releasing : restricting).published = !!body.published;
  if (body.featured !== undefined) (body.featured ? releasing : restricting).featured = !!body.featured;

  const edits = {
    ...(body.name && { name: body.name }),
    ...(body.grade && { grade: body.grade }),
    ...(body.packaging && { packaging: body.packaging }),
    ...(body.moq && { moq: body.moq }),
    ...(body.availableQty && { availableQty: body.availableQty }),
  };

  const immediate = { ...restricting, ...edits };
  let product = await db.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (Object.keys(immediate).length > 0) {
    product = await db.product.update({ where: { id }, data: immediate });
  }

  if (Object.keys(releasing).length > 0) {
    const what = Object.entries(releasing).map(([k, v]) => (k === "status" ? `verify (${v})` : k === "published" ? "publish" : "feature")).join(" + ");
    const outcome = await releaseChange({
      gate: "PRODUCT",
      actor,
      change: { type: "product.update", id, data: releasing },
      summary: `Product "${product.name}": ${what}`,
    });
    return outcomeResponse(outcome, NextResponse);
  }

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
