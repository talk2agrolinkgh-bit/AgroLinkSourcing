// src/components/admin/SourcingRequestsBoard.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";

type Request = {
  id: string;
  product: string;
  name: string;
  company: string | null;
  quantity: string;
  destination: string;
  status: string;
  deskStatus: string;
  specNotes: string | null;
  createdAt: string;
};

const STAGES = ["NEW", "CONTACTED", "SOURCING", "MATCHED", "NEGOTIATION", "CLOSED", "CANCELLED"];

export function SourcingRequestsBoard({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function moveTo(id: string, status: string) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/admin/sourcing-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(`Moved to ${status.replace("_", " ")}.`);
    startTransition(() => router.refresh());
  }

  async function setDesk(id: string, deskStatus: string) {
    const before = requests.find((r) => r.id === id)?.deskStatus;
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, deskStatus } : r)));
    const res = await fetch(`/api/admin/sourcing-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deskStatus }),
    }).catch(() => null);
    if (!res || res.status === 202 || !res.ok) {
      if (before) setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, deskStatus: before } : r)));
      toast(res && res.status === 202 ? "Sent to the Super Admin for final approval." : "Couldn't update. Try again.");
      startTransition(() => router.refresh());
      return;
    }
    toast(res.ok ? (deskStatus === "APPROVED" ? "Approved — now visible on the Sourcing Desk." : deskStatus === "REJECTED" ? "Rejected — hidden from the desk." : "Moved back to review.") : "Couldn't update. Try again.");
    startTransition(() => router.refresh());
  }

  const awaiting = requests.filter((r) => r.deskStatus === "PENDING_REVIEW" && !["CLOSED", "CANCELLED"].includes(r.status));

  return (
    <>
    {awaiting.length > 0 && (
      <div className="mb-4 p-4 rounded-xl2 border border-gold-200 bg-gold-50 text-sm">
        <p className="font-semibold text-gold-700 mb-2">{awaiting.length} request{awaiting.length > 1 ? "s" : ""} awaiting Sourcing Desk review</p>
        <p className="text-xs text-ink-soft mb-3">Check the details are genuine and contain no contact info, then approve. Approved requests are shown to approved agents without buyer name or contact.</p>
        <div className="space-y-2">
          {awaiting.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-cream-50 border border-forest-100">
              <div className="text-xs">
                <p className="font-medium text-sm">{r.product} · {r.quantity} → {r.destination}</p>
                <p className="text-ink-soft">{r.company || r.name}{r.specNotes ? ` — ${r.specNotes}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDesk(r.id, "APPROVED")} className="text-xs font-semibold px-3 h-8 rounded-full bg-forest-700 text-cream-50 hover:bg-forest-800">Approve for desk</button>
                <button onClick={() => setDesk(r.id, "REJECTED")} className="text-xs font-semibold px-3 h-8 rounded-full border border-forest-100 text-ink-soft hover:text-red-600">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {STAGES.map((stage) => {
        const items = requests.filter((r) => r.status === stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              moveTo(id, stage);
            }}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">{stage.replace("_", " ")}</p>
              <span className="text-xs font-mono text-ink-soft">{items.length}</span>
            </div>
            <div className="space-y-2 min-h-[80px] rounded-xl2">
              {items.map((r) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                  className="p-3 rounded-xl2 border border-forest-100 bg-cream-50 shadow-sm cursor-grab"
                >
                  <p className="font-medium text-sm">{r.product}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{r.company || r.name}</p>
                  <p className="text-xs text-ink-soft">{r.quantity}</p>
                  <p className="text-[10px] font-mono text-ink-soft mt-1">
                    {new Date(r.createdAt).toLocaleDateString()} · {r.destination}
                  </p>
                  <p className="mt-2 text-[10px] font-mono">
                    Desk:{" "}
                    <span className={r.deskStatus === "APPROVED" ? "text-forest-700" : r.deskStatus === "REJECTED" ? "text-red-600" : "text-gold-700"}>
                      {r.deskStatus.replace("_", " ")}
                    </span>
                    {r.deskStatus !== "PENDING_REVIEW" && (
                      <button onClick={() => setDesk(r.id, r.deskStatus === "APPROVED" ? "REJECTED" : "APPROVED")} className="ml-2 underline text-ink-soft">
                        {r.deskStatus === "APPROVED" ? "pull from desk" : "approve"}
                      </button>
                    )}
                  </p>
                  <select
                    value={r.status}
                    onChange={(e) => moveTo(r.id, e.target.value)}
                    className="mt-2 w-full h-8 bg-cream-100 border border-forest-100 rounded-lg px-2 text-xs"
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
