// src/app/(public)/account/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { VerificationBadge } from "@/components/ui/badges";
import { SignOutButton } from "@/components/account/SignOutButton";

export const metadata = {
  title: "My Account — AgroLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Buyer",
  SUPPLIER: "Verified Supplier",
  FARMER: "Farm Participant",
  FARM_PARTICIPANT: "Farm Participant",
  ACADEMY_STUDENT: "Academy Student",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (isAdminSession(session)) redirect("/admin"); // admins don't have a buyer profile

  const userId = (session.user as any).id as string;

  const [currentUser, sourcingRequests, farmParticipations, enrollments, supplierProfile] = await Promise.all([
    // Read the live role from the database rather than the session token —
    // role elevation (see src/lib/roles.ts) happens server-side between
    // sign-ins and doesn't retroactively update an already-issued JWT.
    db.user.findUnique({ where: { id: userId }, select: { role: true, name: true, email: true, sourcingAgentStatus: true } }),
    db.sourcingRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.farmParticipant.findMany({ where: { userId }, include: { farmProject: true }, orderBy: { createdAt: "desc" } }),
    db.enrollment.findMany({ where: { userId }, include: { course: true }, orderBy: { createdAt: "desc" } }),
    db.supplier.findUnique({ where: { userId } }),
  ]);

  return (
    <section className="max-w-3xl mx-auto px-4 lg:px-6 pt-8 pb-20">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest uppercase text-gold-700 mb-2">My Account</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-forest-800 leading-tight">
              {currentUser?.name || currentUser?.email || "Your AgroLink account"}
            </h1>
            {currentUser?.role && currentUser.role !== "VISITOR" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-forest-100 text-forest-700">
                {ROLE_LABEL[currentUser.role] ?? currentUser.role}
              </span>
            )}
          </div>
        </div>
        <SignOutButton />
      </div>

      {supplierProfile && (
        <div className="mb-8 p-5 rounded-xl2 border border-forest-100 bg-cream-50 card-shadow flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-forest-800">{supplierProfile.businessName}</p>
            <p className="text-xs text-ink-soft mt-0.5">Supplier profile · {supplierProfile.country}</p>
          </div>
          <VerificationBadge status={supplierProfile.status} />
        </div>
      )}

      {(!currentUser?.sourcingAgentStatus || currentUser.sourcingAgentStatus === "NONE") && (
        <div className="mb-8 p-5 rounded-xl2 border border-forest-100 bg-cream-50 card-shadow">
          <p className="font-display font-semibold text-forest-800">Your path to the Sourcing Desk</p>
          <p className="text-xs text-ink-soft mt-0.5 mb-4">
            The Sourcing Desk shows reviewed buyer requests to trained agents. Here&apos;s where you are:
          </p>
          <ol className="space-y-2 text-sm">
            {[
              { done: enrollments.some((e) => e.status.toLowerCase() !== "cancelled"), label: "Enroll in the Produce-Sourcing Academy", href: "/academy", cta: "View Academy" },
              { done: enrollments.some((e) => e.status.toLowerCase() === "completed"), label: "Graduate (AgroLink marks your course completed)" },
              { done: false, label: "Apply for Sourcing Desk access", href: enrollments.some((e) => e.status.toLowerCase() === "completed") ? "/sourcing-desk" : undefined, cta: "Apply" },
              { done: false, label: "AgroLink approves your access" },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${step.done ? "bg-forest-700 text-cream-50" : "bg-forest-100 text-forest-700"}`}>
                  {step.done ? "✓" : i + 1}
                </span>
                <span className={step.done ? "text-ink-soft line-through" : ""}>
                  {step.label}
                  {!step.done && step.href && (
                    <a href={step.href} className="ml-2 text-forest-700 font-semibold text-xs">{step.cta} →</a>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {currentUser?.sourcingAgentStatus && currentUser.sourcingAgentStatus !== "NONE" && (
        <div className="mb-8 p-5 rounded-xl2 border border-forest-100 bg-cream-50 card-shadow flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-forest-800">Sourcing Desk</p>
            <p className="text-xs text-ink-soft mt-0.5">
              {currentUser.sourcingAgentStatus === "APPROVED" && "You can view and respond to open sourcing requests."}
              {currentUser.sourcingAgentStatus === "PENDING" && "Your application is under review."}
              {currentUser.sourcingAgentStatus === "REVOKED" && "Access has been withdrawn."}
            </p>
          </div>
          {currentUser.sourcingAgentStatus === "APPROVED" ? (
            <Link href="/sourcing-desk" className="text-xs font-semibold text-forest-700 hover:underline shrink-0">
              Open →
            </Link>
          ) : (
            <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-gold-100 text-gold-700">
              {currentUser.sourcingAgentStatus}
            </span>
          )}
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h3 className="font-display font-semibold text-forest-800 mb-3">Sourcing Requests</h3>
          {sourcingRequests.length === 0 ? (
            <EmptyState label="You haven't submitted a sourcing request yet." href="/sourcing" cta="Start Sourcing" />
          ) : (
            <div className="space-y-2">
              {sourcingRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl2 border border-forest-100 bg-cream-50 text-sm">
                  <div>
                    <p className="font-medium">{r.product}</p>
                    <p className="text-xs text-ink-soft">{r.quantity} → {r.destination}</p>
                  </div>
                  <span className="text-xs font-mono text-gold-700">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display font-semibold text-forest-800 mb-3">Farm Participation</h3>
          {farmParticipations.length === 0 ? (
            <EmptyState label="You're not part of a Farm For You project yet." href="/farm" cta="Explore Farm Projects" />
          ) : (
            <div className="space-y-2">
              {farmParticipations.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl2 border border-forest-100 bg-cream-50 text-sm">
                  <p className="font-medium">{p.farmProject.name}</p>
                  <span className="text-xs font-mono text-gold-700">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display font-semibold text-forest-800 mb-3">Academy Enrollment</h3>
          {enrollments.length === 0 ? (
            <EmptyState label="You haven't enrolled in the Academy yet." href="/academy" cta="Explore the Academy" />
          ) : (
            <div className="space-y-2">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 rounded-xl2 border border-forest-100 bg-cream-50 text-sm">
                  <p className="font-medium">{e.course.title}</p>
                  <span className="text-xs font-mono text-gold-700">{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ label, href, cta }: { label: string; href: string; cta: string }) {
  return (
    <div className="p-5 rounded-xl2 border border-dashed border-forest-100 text-sm text-ink-soft">
      {label}{" "}
      <a href={href} className="text-forest-700 font-semibold">{cta} →</a>
    </div>
  );
}
