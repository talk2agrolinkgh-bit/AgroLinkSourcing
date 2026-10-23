// src/components/admin/ApprovalsPanel.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";

type Item = {
  id: string;
  gate: string;
  summary: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedByName: string;
  decidedByName: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export function ApprovalsPanel({ isSuper, pending, recent }: { isSuper: boolean; pending: Item[]; recent: Item[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setBusy(id);
    const res = await fetch(`/api/admin/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    }).catch(() => null);
    setBusy(null);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => null);
      toast(data?.error || "Couldn't complete that. Try again.");
      startTransition(() => router.refresh());
      return;
    }
    toast(decision === "APPROVED" ? "Approved — it's now live." : "Rejected.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display font-semibold text-forest-800 mb-3">
          {isSuper ? "Waiting for your approval" : "Waiting for the Super Admin"} ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-ink-soft p-5 rounded-xl2 border border-dashed border-forest-100">
            {isSuper ? "Nothing waiting. New requests from admins appear here." : "You have no requests waiting."}
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="p-4 rounded-xl2 border border-gold-200 bg-cream-50 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words">{r.summary}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Requested by {r.requestedByName} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                {isSuper && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={busy === r.id}
                      onClick={() => decide(r.id, "APPROVED")}
                      className="text-xs font-semibold px-3 h-8 rounded-full bg-forest-700 text-cream-50 hover:bg-forest-800 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy === r.id}
                      onClick={() => decide(r.id, "REJECTED")}
                      className="text-xs font-semibold px-3 h-8 rounded-full border border-forest-100 text-ink-soft hover:text-red-600 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display font-semibold text-forest-800 mb-3">Recent decisions</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-soft">No decisions yet.</p>
        ) : (
          <div className="rounded-xl2 border border-forest-100 bg-cream-50 divide-y divide-forest-100 shadow-sm">
            {recent.map((r) => (
              <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm break-words">{r.summary}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    By {r.requestedByName} · decided by {r.decidedByName ?? "—"}
                    {r.decidedAt ? ` · ${new Date(r.decidedAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === "APPROVED" ? "bg-forest-100 text-forest-700" : "bg-red-100 text-red-600"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
