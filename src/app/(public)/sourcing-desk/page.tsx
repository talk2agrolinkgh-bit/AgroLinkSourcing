// src/app/(public)/sourcing-desk/page.tsx
// Public URL, but the content behind it is fully gated. Buyer contact
// details (name, company, email, WhatsApp) are deliberately never sent to
// this page — agents see enough to know if they can help (product,
// quantity, destination, spec, timeline), and respond through AgroLink
// rather than contacting the buyer directly. See src/lib/sourcing-desk.ts
// for the access-status logic and README for the full design rationale.

import Link from "next/link";
import { db } from "@/lib/db";
import { getSourcingDeskAccess, hasGraduated, DESK_OPEN_STATUSES } from "@/lib/sourcing-desk";
import { scrubContacts } from "@/lib/scrub";
import { SectionHead } from "@/components/ui/badges";
import { ApplyButton } from "@/components/sourcing-desk/ApplyButton";
import { RespondForm } from "@/components/sourcing-desk/RespondForm";

export const metadata = {
  title: "Sourcing Desk — AgroLink",
  robots: { index: false, follow: false }, // never index a page gated behind approval
};
export const dynamic = "force-dynamic";

export default async function SourcingDeskPage() {
  const access = await getSourcingDeskAccess();

  if (access.status === "SIGNED_OUT") {
    return (
      <Gate
        eyebrow="Sourcing Desk"
        title="Sign in to access the Sourcing Desk"
        body="The Sourcing Desk is reserved for AgroLink-trained agents who've completed the Produce-Sourcing Academy. Sign in first, then apply for access."
        cta={<Link href="/login" className="inline-flex items-center px-5 h-12 rounded-full bg-forest-700 text-cream-50 font-semibold hover:bg-forest-800 transition">Sign In</Link>}
      />
    );
  }

  if (access.status === "NONE") {
    const graduated = await hasGraduated(access.userId);
    if (!graduated) {
      return (
        <Gate
          eyebrow="Sourcing Desk"
          title="Open to Academy graduates"
          body="The Sourcing Desk is where trained agents see reviewed sourcing requests. To protect buyers and agents from scams, access is limited to graduates of the Produce-Sourcing Academy. Once AgroLink marks your course as completed you can apply here."
          cta={<Link href="/academy" className="inline-flex items-center px-5 h-12 rounded-full bg-forest-700 text-cream-50 font-semibold hover:bg-forest-800 transition">View the Academy</Link>}
        />
      );
    }
    return (
      <Gate
        eyebrow="Sourcing Desk"
        title="Apply for Sourcing Desk access"
        body="You've completed the Academy, so you can apply. This is where trained agents view reviewed sourcing requests and offer to help fulfil them. Each application is approved individually by AgroLink."
        cta={<ApplyButton />}
      />
    );
  }

  if (access.status === "PENDING") {
    return (
      <Gate
        eyebrow="Sourcing Desk"
        title="Your application is under review"
        body="AgroLink reviews Sourcing Desk applications individually. You'll be notified once a decision is made — no need to reapply."
      />
    );
  }

  if (access.status === "REVOKED") {
    return (
      <Gate
        eyebrow="Sourcing Desk"
        title="Access is currently unavailable"
        body="Your Sourcing Desk access has been withdrawn. If you believe this is a mistake, contact AgroLink directly."
      />
    );
  }

  // APPROVED
  const [requests, myResponses] = await Promise.all([
    db.sourcingRequest.findMany({
      // Only requests an admin has reviewed and approved for the desk.
      where: { deskStatus: "APPROVED", status: { in: [...DESK_OPEN_STATUSES] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        product: true,
        quantity: true,
        destination: true,
        specNotes: true,
        timeline: true,
        status: true,
        createdAt: true,
        // Deliberately not selected: name, company, email, whatsapp, userId, country.
      },
    }),
    db.message.findMany({
      where: { senderId: access.userId, channel: "agent_response" },
      select: { sourcingRequestId: true },
    }),
  ]);

  const respondedIds = new Set(myResponses.map((m) => m.sourcingRequestId));

  return (
    <section className="max-w-4xl mx-auto px-4 lg:px-6 pt-8 pb-20">
      <SectionHead
        eyebrow="Sourcing Desk"
        title="Open sourcing requests"
        sub="Every request here has been reviewed by AgroLink. Buyer names and contact details are never shown — respond here and AgroLink will coordinate the connection."
      />

      {requests.length === 0 ? (
        <p className="text-sm text-ink-soft">No reviewed requests right now — new ones appear here after AgroLink approves them.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="p-5 rounded-xl2 border border-forest-100 bg-cream-50 card-shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display font-semibold text-forest-800">{scrubContacts(r.product)}</p>
                  <p className="text-sm text-ink-soft mt-1">{scrubContacts(r.quantity)} → {scrubContacts(r.destination)}</p>
                  {r.specNotes && <p className="text-xs text-ink-soft mt-1">{scrubContacts(r.specNotes)}</p>}
                  <p className="text-xs font-mono text-ink-soft mt-2">
                    {r.timeline ? `Needed: ${r.timeline} · ` : ""}Submitted {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-mono text-gold-700">{r.status}</span>
              </div>
              <div className="mt-3">
                <RespondForm requestId={r.id} alreadyResponded={respondedIds.has(r.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Gate({ eyebrow, title, body, cta }: { eyebrow: string; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <section className="max-w-md mx-auto px-4 lg:px-6 pt-8 pb-24 text-center">
      <p className="font-mono text-xs tracking-widest uppercase text-gold-700 mb-2">{eyebrow}</p>
      <h1 className="font-display text-2xl font-semibold text-forest-800 mb-3">{title}</h1>
      <p className="text-sm text-ink-soft leading-relaxed mb-6">{body}</p>
      {cta}
    </section>
  );
}
